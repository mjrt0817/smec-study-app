import React from 'react';
import { Subject, Question, UserData } from '../types';
import { Play, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';

interface Props {
  subjects: Subject[];
  questions: Question[];
  userData: UserData;
  onStartStudy: (mode: 'normal' | 'weakness', subjectId?: string) => void;
}

export function SubjectList({ subjects, questions, userData, onStartStudy }: Props) {
  // Calculate progress per subject
  const getProgress = (subjectId: string) => {
    const subjectQuestions = questions.filter(q => q.subjectId === subjectId);
    if (subjectQuestions.length === 0) return { total: 0, answered: 0, weakness: 0 };
    
    let answered = 0;
    let weakness = 0;
    
    subjectQuestions.forEach(q => {
      const p = userData.progress[q.id];
      if (p) {
        answered++;
        if (p.isWeakness) weakness++;
      }
    });
    
    return { 
      total: subjectQuestions.length, 
      answered, 
      weakness,
      percent: subjectQuestions.length > 0 ? Math.round((answered / subjectQuestions.length) * 100) : 0
    };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold mb-4 font-sans text-slate-800">科目別進捗</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map(subject => {
          const stats = getProgress(subject.id);
          return (
            <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition hover:shadow-md">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                <h3 className="text-sm font-bold text-slate-700 truncate">{subject.name}</h3>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                  <span>進捗率</span>
                  <span className="font-mono">{stats.percent}% ({stats.answered}/{stats.total})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.percent}%`, backgroundColor: subject.color }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center text-rose-500 font-medium">
                  <AlertCircle size={12} className="mr-1" />
                  <span>弱点: {stats.weakness}問</span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onStartStudy('normal', subject.id)}
                    className="p-1.5 bg-slate-50 text-slate-500 rounded border border-slate-200 hover:bg-slate-100 transition shadow-sm"
                    title="この科目を学習"
                  >
                    <Play size={14} />
                  </button>
                  {stats.weakness > 0 && (
                     <button 
                     onClick={() => onStartStudy('weakness', subject.id)}
                     className="p-1.5 bg-rose-50 text-rose-600 rounded border border-rose-100 hover:bg-rose-100 transition shadow-sm"
                     title="弱点を復習"
                   >
                     <RotateCcw size={14} />
                   </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
