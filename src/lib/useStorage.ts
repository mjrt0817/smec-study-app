import { useState, useEffect } from 'react';
import { UserData, DailyLog, Mission, Badge, Question } from '../types';
import { format } from 'date-fns';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

const STORAGE_KEY = 'smec_study_data';

const INITIAL_MISSIONS: Mission[] = [
  { id: 'm1', description: '今日5問解く', target: 5, progress: 0, completed: false, type: 'answer_count' },
  { id: 'm2', description: '今日3問正解する', target: 3, progress: 0, completed: false, type: 'correct_count' },
  { id: 'm3', description: '弱点問題を1問復習', target: 1, progress: 0, completed: false, type: 'review_weakness' },
];

const AVAILABLE_BADGES: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'b_first', name: 'ファーストステップ', description: '初めて問題を解いた', iconType: 'Star' },
  { id: 'b_streak_3', name: '3日連続ログイン', description: '3日連続で学習した', iconType: 'Flame' },
  { id: 'b_streak_7', name: '7日連続ログイン', description: '7日連続で学習した', iconType: 'Trophy' },
  { id: 'b_10_correct', name: '10問正解', description: '累計10問正解した', iconType: 'Medal' },
];

function getInitialData(): UserData {
  const today = format(new Date(), 'yyyy-MM-dd');
  return {
    progress: {},
    dailyLogs: {},
    badges: [],
    lastMissionDate: today,
    missions: [...INITIAL_MISSIONS],
    currentStreak: 0,
    lastStudyDate: null,
    customQuestions: [],
  };
}

export function useStorage() {
  const [data, setData] = useState<UserData>(getInitialData());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load data from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let firestoreData = getInitialData();
          if (userDoc.exists()) {
            const parsed = userDoc.data() as UserData;
            if (!parsed.customQuestions) parsed.customQuestions = [];
            
            const today = format(new Date(), 'yyyy-MM-dd');
            if (parsed.lastMissionDate !== today) {
              parsed.lastMissionDate = today;
              parsed.missions = [...INITIAL_MISSIONS];
            }
            firestoreData = parsed;
          }
          
          // Also fetch custom questions assuming they are stored inside user document 
          // or we can just fetch them from a subcollection. Let's keep them in the main user doc for simplicity if they fit, 
          // but if they are large, subcollection is safer. We'll use a root collection: `customQuestions` where user == currentUser.
          const customQSnapshot = await getDocs(collection(db, 'customQuestions'));
          const customQuestions = customQSnapshot.docs
            .map(d => d.data() as Question & { userId: string })
            .filter(q => q.userId === currentUser.uid);
            
          firestoreData.customQuestions = customQuestions;
          
          setData(firestoreData);
        } catch (e) {
          console.error("Failed to load from Firestore", e);
        }
      } else {
        // Load from LocalStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (!parsed.customQuestions) parsed.customQuestions = [];
            const today = format(new Date(), 'yyyy-MM-dd');
            if (parsed.lastMissionDate !== today) {
              parsed.lastMissionDate = today;
              parsed.missions = [...INITIAL_MISSIONS];
            }
            setData(parsed);
          } catch (e) {
            setData(getInitialData());
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const syncToFirestore = async (newData: UserData) => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // We don't write customQuestions to the user doc directly anymore, 
      // they are managed separately to prevent big doc size.
      const { customQuestions, ...userDataToSave } = newData;
      await setDoc(userDocRef, userDataToSave, { merge: true });
    } catch(e) {
      console.error("Failed to sync to Firestore", e);
    }
  };

  useEffect(() => {
    if (!loading) {
      syncToFirestore(data);
    }
  }, [data, loading, user]);

  const updateProgress = (newData: Partial<UserData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const importQuestions = async (newQuestions: Question[]) => {
    // 既存の問題IDと重複しないものだけ追加
    const existingIds = new Set(data.customQuestions.map(q => q.id));
    const filtered = newQuestions.filter(q => !existingIds.has(q.id));
    
    if (user && filtered.length > 0) {
      // Create batch to write custom questions to Firestore Root Collection
      try {
        const batch = writeBatch(db);
        filtered.forEach(q => {
          const qRef = doc(collection(db, 'customQuestions'));
          const questionToSave = { ...q, id: qRef.id, userId: user.uid };
          batch.set(qRef, questionToSave);
        });
        await batch.commit();
        
        // Re-fetch all custom questions
        const customQSnapshot = await getDocs(collection(db, 'customQuestions'));
        const customQuestions = customQSnapshot.docs
          .map(d => d.data() as Question & { userId: string })
          .filter(q => q.userId === user.uid);

        setData(prev => ({
          ...prev,
          customQuestions: customQuestions,
        }));
        return;
      } catch (e) {
        console.error("Failed to save custom questions to Firestore", e);
      }
    } else {
      setData(prev => ({
        ...prev,
        customQuestions: [...prev.customQuestions, ...filtered],
      }));
    }
  };

  const clearCustomQuestions = async () => {
    if (user) {
      try {
        const customQSnapshot = await getDocs(collection(db, 'customQuestions'));
        const batch = writeBatch(db);
        customQSnapshot.docs.forEach(d => {
          if (d.data().userId === user.uid) {
            batch.delete(d.ref);
          }
        });
        await batch.commit();
      } catch(e) {
        console.error("Failed to delete from Firestore", e);
      }
    }
    setData(prev => ({ ...prev, customQuestions: [] }));
  };

  const recordAnswer = (isCorrect: boolean, isWeaknessReview: boolean = false) => {
    setData(prev => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const log = prev.dailyLogs[today] || { date: today, questionsAnswered: 0, correctAnswers: 0 };
      
      const newLog = {
        ...log,
        questionsAnswered: log.questionsAnswered + 1,
        correctAnswers: log.correctAnswers + (isCorrect ? 1 : 0)
      };

      // ストリークの更新
      let newStreak = prev.currentStreak;
      if (prev.lastStudyDate) {
        const lastDate = new Date(prev.lastStudyDate);
        const currentDate = new Date(today);
        const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      // ミッションの進捗更新
      const newMissions = prev.missions.map(m => {
        if (m.completed) return m;
        let p = m.progress;
        if (m.type === 'answer_count') p += 1;
        if (m.type === 'correct_count' && isCorrect) p += 1;
        if (m.type === 'review_weakness' && isWeaknessReview) p += 1;
        return {
          ...m,
          progress: p,
          completed: p >= m.target
        };
      });

      // バッジチェック
      const newBadges = [...prev.badges];
      const unlockBadge = (id: string) => {
        if (!newBadges.some(b => b.id === id)) {
          const badgeDef = AVAILABLE_BADGES.find(b => b.id === id);
          if (badgeDef) {
            newBadges.push({ ...badgeDef, unlockedAt: Date.now() });
          }
        }
      };

      if (newStreak >= 3) unlockBadge('b_streak_3');
      if (newStreak >= 7) unlockBadge('b_streak_7');
      if (newLog.questionsAnswered > 0) unlockBadge('b_first');
      
      const totalCorrect = Object.values(prev.dailyLogs).reduce((sum, l) => sum + l.correctAnswers, 0) + (isCorrect ? 1 : 0);
      if (totalCorrect >= 10) unlockBadge('b_10_correct');

      return {
        ...prev,
        dailyLogs: { ...prev.dailyLogs, [today]: newLog },
        currentStreak: newStreak,
        lastStudyDate: today,
        missions: newMissions,
        badges: newBadges
      };
    });
  };

  return { data, loading, user, updateProgress, recordAnswer, importQuestions, clearCustomQuestions };
}

