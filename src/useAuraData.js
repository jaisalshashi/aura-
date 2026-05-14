import { useState, useEffect, useCallback } from "react";
import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, onAuthStateChanged } from "./firebase.js";

const DEFAULT_HABITS = [
  { id: 1, name: "Coding", icon: "⌨️", streak: 0, done: false },
  { id: 2, name: "Reading", icon: "📖", streak: 0, done: false },
  { id: 3, name: "Workout", icon: "💪", streak: 0, done: false },
  { id: 4, name: "Meditation", icon: "🧘", streak: 0, done: false },
  { id: 5, name: "Learning", icon: "🧠", streak: 0, done: false },
];

const DEFAULT_MISSIONS = [
  { id: 1, title: "Learn 20 mins", xp: 50, done: false, icon: "📚" },
  { id: 2, title: "Read 10 pages", xp: 30, done: false, icon: "📖" },
  { id: 3, title: "Drink 8 glasses", xp: 20, done: false, icon: "💧" },
  { id: 4, title: "Practice skill", xp: 60, done: false, icon: "⚡" },
  { id: 5, title: "30 min workout", xp: 80, done: false, icon: "🔥" },
];

export function useAuraData(uid) {
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [missions, setMissions] = useState(DEFAULT_MISSIONS);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.xp !== undefined) setXp(d.xp);
        if (d.streak !== undefined) setStreak(d.streak);
        if (d.habits !== undefined) setHabits(d.habits);
        if (d.missions !== undefined) setMissions(d.missions);
      } else {
        setDoc(ref, {
          xp: 0,
          streak: 0,
          habits: DEFAULT_HABITS,
          missions: DEFAULT_MISSIONS,
          createdAt: serverTimestamp(),
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  const save = useCallback((data) => {
    if (!uid) return;
    updateDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: serverTimestamp()
    }).catch(err => console.error("Save error:", err));
  }, [uid]);

  const toggleHabit = useCallback((id) => {
    setHabits(prev => {
      const updated = prev.map(h =>
        h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : h.streak } : h
      );
      save({ habits: updated });
      return updated;
    });
    setXp(prev => { const n = prev + 25; save({ xp: n }); return n; });
  }, [save]);

  const completeMission = useCallback((id) => {
    const m = missions.find(m => m.id === id);
    if (!m || m.done) return;
    setMissions(prev => {
      const updated = prev.map(mi => mi.id === id ? { ...mi, done: true } : mi);
      save({ missions: updated });
      return updated;
    });
    setXp(prev => { const n = prev + m.xp; save({ xp: n }); return n; });
  }, [missions, save]);

  const addHabit = useCallback((habit) => {
    setHabits(prev => {
      const updated = [...prev, { ...habit, id: Date.now() }];
      save({ habits: updated });
      return updated;
    });
  }, [save]);

  const addMission = useCallback((mission) => {
    setMissions(prev => {
      const updated = [...prev, { ...mission, id: Date.now() }];
      save({ missions: updated });
      return updated;
    });
  }, [save]);

  return {
    loading, xp, streak, habits, missions,
    toggleHabit, completeMission, addHabit, addMission,
  };
}