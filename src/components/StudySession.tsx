import React, { useState, useEffect, useMemo } from 'react';
import { Question, UserData, Subject } from '../types';
import { calculateNextReview } from '../lib/srs';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  questions: Question[];
  subjects: Subject[];
  userData: UserData;
  mode: 'normal' | 'weakness';
  subjectId?: string;
  onFinish: () => void;
  onAnswer: (questionId: string, isCorrect: boolean, isWeaknessReview: boolean, newProgress: any) => void;
}

export function StudySession({ questions, subjects, userData, mode, subjectId, onFinish, onAnswer }: Props) {
  
  // Filter questions based on mode and subject
  const sessionQuestions = useMemo(() => {
    let filtered = questions;
    if (subjectId) {
      filtered = filtered.filter(q => q.subjectId === subjectId);
    }
    if (mode === 'weakness') {
      filtered = filtered.filter(q => userData.progress[q.id]?.isWeakness);
    } else {
      // Normal mode: prioritize new questions or those due for review
      const now = Date.now();
      filtered = filtered.filter(q => {
        const p = userData.progress[q.id];
        if (!p) return true; // New
        if (p.nextReviewAt <= now) return true; // Due for review
        return false;
      });
      // If no new/due questions, just shuffle all for practice? 
      // Actually let's just let them review anything if it's normal mode and they insist.
      if (filtered.length === 0 && subjectId) {
         filtered = questions.filter(q => q.subjectId === subjectId);
      }
    }
    // Shuffle
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, 10); // Max 10 per session
  }, [questions, userData.progress, mode, subjectId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const currentQuestion = sessionQuestions[currentIndex];
  const subject = subjects.find(s => s.id === currentQuestion?.subjectId);

  if (sessionQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">素晴らしい！</h2>
        <p className="text-slate-600 mb-6">現在、学習が必要な問題はありません。少し休むか、別の科目に挑戦しましょう。</p>
        <button 
          onClick={onFinish}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          ダッシュボードへ戻る
        </button>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (isAnswered) return;
    
    setSelectedOptionId(optionId);
    setIsAnswered(true);
    
    const isCorrect = optionId === currentQuestion.correctOptionId;
    const progress = userData.progress[currentQuestion.id];
    const newProgress = calculateNextReview(progress, isCorrect, currentQuestion.id);
    const isWeaknessReview = mode === 'weakness' || (progress && progress.isWeakness) || false;
    
    onAnswer(currentQuestion.id, isCorrect, isWeaknessReview, newProgress);
  };

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      onFinish();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onFinish}
          className="flex items-center text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={20} className="mr-1" />
          中断して戻る
        </button>
        <div className="flex items-center space-x-4">
           <span className="text-sm font-medium text-slate-500">
             {currentIndex + 1} / {sessionQuestions.length}
           </span>
           <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
             <div 
               className="h-full bg-blue-500 transition-all duration-300"
               style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
             />
           </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 mb-3">
             <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: subject?.color || '#ccc' }} />
             <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">{subject?.name}</span>
          </div>
          <h2 className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
            {currentQuestion.text}
          </h2>
        </div>
        
        <div className="p-6 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === currentQuestion.correctOptionId;
            const showCorrect = isAnswered && isCorrectOption;
            const showIncorrect = isAnswered && isSelected && !isCorrectOption;
            
            return (
              <button
                key={option.id}
                disabled={isAnswered}
                onClick={() => handleOptionClick(option.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all flex items-start",
                  !isAnswered && "border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm",
                  showCorrect && "border-green-500 bg-green-50/50",
                  showIncorrect && "border-rose-500 bg-rose-50/50",
                  isAnswered && !isSelected && !showCorrect && "border-slate-100 opacity-60"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full border mr-3 flex items-center justify-center text-xs font-bold transition-colors",
                  !isAnswered && "border-slate-300 text-slate-500",
                  showCorrect && "border-green-500 text-green-700 bg-green-100",
                  showIncorrect && "border-rose-500 text-rose-700 bg-rose-100",
                  isAnswered && !isSelected && !showCorrect && "border-slate-200 text-slate-400"
                )}>
                  {showCorrect ? <CheckCircle2 size={16} /> : showIncorrect ? <XCircle size={16} /> : idx + 1}
                </div>
                <span className={cn(
                  "text-slate-700 font-medium",
                  showCorrect && "text-green-800",
                  showIncorrect && "text-rose-800"
                )}>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Section (Revealed after answer) */}
      {isAnswered && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
           <div className={cn(
             "rounded-2xl p-6 mb-6",
             selectedOptionId === currentQuestion.correctOptionId ? "bg-green-50 border border-green-100" : "bg-rose-50 border border-rose-100"
           )}>
             <h3 className={cn(
               "font-bold mb-2 flex items-center text-sm",
               selectedOptionId === currentQuestion.correctOptionId ? "text-green-800" : "text-rose-800"
             )}>
               {selectedOptionId === currentQuestion.correctOptionId ? '解説' : '解説（不正解）'}
             </h3>
             <p className="text-slate-700 leading-relaxed text-sm">
               {currentQuestion.explanation}
             </p>
           </div>
           
           <div className="flex justify-end">
             <button
               onClick={handleNext}
               className="flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-sm"
             >
               {currentIndex < sessionQuestions.length - 1 ? '次の問題へ' : '結果を見る'}
               <ArrowRight size={18} className="ml-2" />
             </button>
           </div>
        </div>
      )}

    </div>
  );
}
