import { QuestionProgress } from '../types';

// Simple implementation of SuperMemo-2 for Spaced Repetition
export function calculateNextReview(
  progress: QuestionProgress | undefined,
  isCorrect: boolean,
  questionId: string
): QuestionProgress {
  const now = Date.now();
  
  if (!progress) {
    // First time seeing this question
    return {
      questionId,
      lastReviewedAt: now,
      // If correct: review tomorrow. If incorrect: review immediately (0 interval)
      nextReviewAt: now + (isCorrect ? 1 * 24 * 60 * 60 * 1000 : 0), 
      interval: isCorrect ? 1 : 0,
      efactor: 2.5,
      isWeakness: !isCorrect,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
    };
  }

  let { interval, efactor, correctCount, incorrectCount } = progress;
  
  let newEfactor = efactor;
  let newInterval = interval;
  
  if (isCorrect) {
    if (correctCount === 0) {
      newInterval = 1;
    } else if (correctCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * efactor);
    }
    newEfactor = Math.max(1.3, efactor + 0.1);
  } else {
    // Incorrect answer resets interval, makes it a weakness
    newInterval = 0; 
    newEfactor = Math.max(1.3, efactor - 0.2);
  }

  return {
    questionId,
    lastReviewedAt: now,
    nextReviewAt: now + newInterval * 24 * 60 * 60 * 1000,
    interval: newInterval,
    efactor: newEfactor,
    isWeakness: !isCorrect,
    correctCount: isCorrect ? correctCount + 1 : correctCount,
    incorrectCount: isCorrect ? incorrectCount : incorrectCount + 1,
  };
}
