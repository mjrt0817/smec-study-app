import React, { useState } from 'react';
import { useStorage } from './lib/useStorage';
import { SUBJECTS } from './data/subjects';
import { QUESTIONS } from './data/questions';
import { Dashboard } from './components/Dashboard';
import { StudySession } from './components/StudySession';

type ViewMode = 'dashboard' | 'study';

export default function App() {
  const { data, updateProgress, recordAnswer, importQuestions, clearCustomQuestions } = useStorage();
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
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

