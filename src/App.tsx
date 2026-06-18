import React, { useState } from 'react';
import { useStorage } from './lib/useStorage';
import { SUBJECTS } from './data/subjects';
import { QUESTIONS } from './data/questions';
import { Dashboard } from './components/Dashboard';
import { StudySession } from './components/StudySession';
import { loginWithGoogle, logout } from './lib/firebase';
import { LogIn, LogOut } from 'lucide-react';

type ViewMode = 'dashboard' | 'study';

export default function App() {
  const { data, loading, user, updateProgress, recordAnswer, importQuestions, clearCustomQuestions } = useStorage();
  const [view, setView] = useState<ViewMode>('dashboard');
  const [studyConfig, setStudyConfig] = useState<{ mode: 'normal' | 'weakness', subjectId?: string }>({ mode: 'normal' });

  // 組み込み問題とインポートされた問題を統合
  const allQuestions = [...QUESTIONS, ...(data.customQuestions || [])];

  const handleStartStudy = (mode: 'normal' | 'weakness', subjectId?: string) => {
    setStudyConfig({ mode, subjectId });
    setView('study');
  };

  const handleFinishStudy = () => {
    setView('dashboard');
  };

  const handleAnswer = (questionId: string, isCorrect: boolean, isWeaknessReview: boolean, newProgress: any) => {
    // Update progress
    updateProgress({
      progress: {
        ...data.progress,
        [questionId]: newProgress
      }
    });
    // Record stats, daily goals, badges
    recordAnswer(isCorrect, isWeaknessReview);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 py-3 px-4 flex justify-between items-center sticky top-0 z-10 shadow-sm max-w-2xl mx-auto">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight" onClick={() => setView('dashboard')}>SMC Exam</h1>
        <div>
          {user ? (
            <button 
              onClick={logout}
              className="flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-slate-800 transition bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full"
            >
              <LogOut size={14} />
              <span>ログアウト</span>
            </button>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="flex items-center space-x-1 text-xs font-medium text-white transition bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full shadow-sm"
            >
              <LogIn size={14} />
              <span>Googleでログイン</span>
            </button>
          )}
        </div>
      </header>

      {view === 'dashboard' ? (
        <Dashboard 
          userData={data} 
          subjects={SUBJECTS} 
          questions={allQuestions} 
          onStartStudy={handleStartStudy} 
          onImportQuestions={importQuestions}
          onClearCustomQuestions={clearCustomQuestions}
        />
      ) : (
        <StudySession 
          mode={studyConfig.mode}
          subjectId={studyConfig.subjectId}
          questions={allQuestions}
          subjects={SUBJECTS}
          userData={data}
          onFinish={handleFinishStudy}
          onAnswer={handleAnswer}
        />
      )}
    </div>
  );
}

