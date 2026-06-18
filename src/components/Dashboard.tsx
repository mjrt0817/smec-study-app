import React, { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { UserData, Subject, Question } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { Flame, Star, Trophy, Medal, CheckCircle, Target, TrendingUp, Upload, Trash2 } from 'lucide-react';
import { SubjectList } from './SubjectList';

interface Props {
  userData: UserData;
  subjects: Subject[];
  questions: Question[];
  onStartStudy: (mode: 'normal' | 'weakness', subjectId?: string) => void;
  onImportQuestions?: (questions: Question[]) => void;
  onClearCustomQuestions?: () => void;
}

export function Dashboard({ userData, subjects, questions, onStartStudy, onImportQuestions, onClearCustomQuestions }: Props) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('インポート中...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newQuestions: Question[] = results.data.map((row: any, index) => {
            if (!row['No'] || !row['問題文']) return null;
            return {
              id: `custom-${Date.now()}-${index}`,
              subjectId: '5', // 経営法務としてインポート
              text: row['問題文'],
              options: [
                { id: '1', text: row['選択肢1'] },
                { id: '2', text: row['選択肢2'] },
                { id: '3', text: row['選択肢3'] },
                { id: '4', text: row['選択肢4'] },
              ],
              correctOptionId: String(row['正解番号']),
              explanation: row['解説']
            };
          }).filter(Boolean) as Question[];

          if (onImportQuestions && newQuestions.length > 0) {
            onImportQuestions(newQuestions);
            setImportStatus(`${newQuestions.length}問のインポートが完了しました！`);
          } else {
            setImportStatus('CSVの形式を確認してください。データが見つかりませんでした。');
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
          setTimeout(() => setImportStatus(''), 5000);
        } catch (error) {
          setImportStatus('データの解析中にエラーが発生しました。');
          setTimeout(() => setImportStatus(''), 5000);
        }
      },
      error: () => {
        setImportStatus('ファイルの読み込みに失敗しました。');
        setTimeout(() => setImportStatus(''), 5000);
      }
    });
  };

  const chartData = useMemo(() => {
    // Last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const log = userData.dailyLogs[dateStr];
      data.push({
        name: format(d, 'MM/dd'),
        count: log ? log.questionsAnswered : 0,
        date: dateStr
      });
    }
    return data;
  }, [userData]);

  const totalWeakness = useMemo(() => {
    return Object.values(userData.progress).filter(p => p.isWeakness).length;
  }, [userData]);

  const IconMap: Record<string, any> = {
    Flame, Star, Trophy, Medal
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-800 mb-1">中小企業診断士 1問1答</h1>
          <p className="text-slate-500 text-sm">継続は力なり。今日の学習を始めましょう。</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button 
            onClick={() => onStartStudy('normal')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition shadow-sm flex items-center"
          >
            <Target size={16} className="mr-2" />
            ランダム学習
          </button>
          {totalWeakness > 0 && (
            <button 
              onClick={() => onStartStudy('weakness')}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition shadow-sm flex items-center"
            >
              <Flame size={16} className="mr-2" />
              弱点克服 ({totalWeakness})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <TrendingUp className="text-blue-500 mb-2" size={20} />
              <span className="text-xl font-bold text-slate-800 font-mono">{userData.currentStreak}</span>
              <span className="text-xs text-slate-500 font-medium mt-1">連続学習日数</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <CheckCircle className="text-green-500 mb-2" size={20} />
              <span className="text-xl font-bold text-slate-800 font-mono">
                {Object.keys(userData.progress).length}
              </span>
              <span className="text-xs text-slate-500 font-medium mt-1">学習済問題数</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <Flame className="text-rose-500 mb-2" size={20} />
              <span className="text-xl font-bold text-slate-800 font-mono">{totalWeakness}</span>
              <span className="text-xs text-slate-500 font-medium mt-1">現在の弱点数</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <Medal className="text-amber-500 mb-2" size={20} />
              <span className="text-xl font-bold text-slate-800 font-mono">{userData.badges.length}</span>
              <span className="text-xs text-slate-500 font-medium mt-1">獲得バッジ</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-4">過去7日間の学習数</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3b82f6' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <SubjectList 
            subjects={subjects} 
            questions={questions} 
            userData={userData} 
            onStartStudy={onStartStudy} 
          />
        </div>

        {/* Right Column: Missions & Badges */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-xl shadow-md text-white">
            <h2 className="text-sm font-bold mb-4 flex items-center">
              <Target size={16} className="mr-2 opacity-80" />
              デイリーミッション
            </h2>
            <div className="space-y-4">
              {userData.missions.map(m => (
                <div key={m.id} className="relative">
                  <div className="flex items-start space-x-3 mb-1">
                    <div className={`w-4 h-4 mt-0.5 rounded border flex flex-shrink-0 items-center justify-center text-[10px] ${m.completed ? 'border-white/50 bg-white/20 text-white' : 'border-white/40'}`}>
                      {m.completed ? '✓' : ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium truncate ${m.completed ? 'text-white/60 line-through' : 'text-white'}`}>
                          {m.description}
                        </span>
                        <span className="text-[10px] font-mono text-white/70 ml-2">{m.progress}/{m.target}</span>
                      </div>
                      <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${m.completed ? 'bg-green-400' : 'bg-white'}`}
                          style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <Medal size={16} className="mr-2 text-amber-500" />
              獲得バッジ
            </h2>
            {userData.badges.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">まだバッジがありません<br/>学習を進めて獲得しましょう！</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userData.badges.map(badge => {
                  const Icon = IconMap[badge.iconType] || Star;
                  return (
                    <div key={badge.id} className="flex flex-col items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 shadow-sm">
                        <Icon size={16} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 leading-tight mb-0.5">{badge.name}</span>
                      <span className="text-[9px] text-slate-500 leading-tight">{badge.description}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <Upload size={16} className="mr-2 text-slate-500" />
              データ管理
            </h2>
            <div className="space-y-3">
              <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                お持ちのCSVファイルから問題を追加できます。<br />
                <span className="font-mono text-[10px]">ヘッダ: No,分野1-分野2,問題文,選択肢1,選択肢2,選択肢3,選択肢4,正解番号,解説</span>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition border border-slate-200 flex items-center justify-center"
              >
                <Upload size={14} className="mr-2" />
                CSVから問題をインポート
              </button>
              
              {importStatus && <p className="text-[10px] text-blue-600 mt-1 font-medium">{importStatus}</p>}

              {userData.customQuestions && userData.customQuestions.length > 0 && (
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">追加済: {userData.customQuestions.length}問</span>
                  <button 
                    onClick={() => {
                      if (window.confirm('インポートした問題をすべて削除しますか？')) {
                        onClearCustomQuestions?.();
                      }
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center px-2 py-1 rounded hover:bg-rose-50 transition"
                  >
                    <Trash2 size={12} className="mr-1" />
                    すべて削除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
