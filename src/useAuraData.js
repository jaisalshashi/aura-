// src/useAuraData.js
// Ye hook Firebase se saara data load/save karta hai

import { useState, useEffect, useCallback } from "react";
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp
} from "firebase/firestore";
import { db, ensureAuth } from "./firebase.js";

const DEFAULT_HABITS = [
  { id: 1, name: "Coding",    icon: "⌨️", streak: 7,  done: false },
  { id: 2, name: "Reading",   icon: "📖", streak: 4,  done: false },
  { id: 3, name: "Workout",   icon: "💪", streak: 12, done: false },
  { id: 4, name: "Meditation",icon: "🧘", streak: 3,  done: false },
  { id: 5, name: "Learning",  icon: "🧠", streak: 9,  done: false },
];

const DEFAULT_MISSIONS = [
  { id: 1, title: "Learn 20 mins",           xp: 50, done: false, icon: "📚" },
  { id: 2, title: "Read 10 pages",            xp: 30, done: false, icon: "📖" },
  { id: 3, title: "Drink 8 glasses of water", xp: 20, done: false, icon: "💧" },
  { id: 4, title: "Practice your skill",      xp: 60, done: false, icon: "⚡" },
  { id: 5, title: "30 min workout",           xp: 80, done: false, icon: "🔥" },
];

export function useAuraData() {
  const [uid, setUid]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [xp, setXp]             = useState(120);
  const [streak, setStreak]     = useState(7);
  const [habits, setHabits]     = useState(DEFAULT_HABITS);
  const [missions, setMissions] = useState(DEFAULT_MISSIONS);
  const nextId = { current: 200 };

  // ── Init: auth + realtime listener ──────────────────────────────
  useEffect(() => {
    let unsub;
    ensureAuth().then((user) => {
      setUid(user.uid);
      const ref = doc(db, "users", user.uid);

      unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.xp      !== undefined) setXp(d.xp);
          if (d.streak  !== undefined) setStreak(d.streak);
          if (d.habits  !== undefined) setHabits(d.habits);
          if (d.missions!== undefined) setMissions(d.missions);
        } else {
          // First time user — default data save karo
          setDoc(ref, {
            xp: 120, streak: 7,
            habits:   DEFAULT_HABITS,
            missions: DEFAULT_MISSIONS,
            createdAt: serverTimestamp(),
          });
        }
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, []);

  // ── Save helper ─────────────────────────────────────────────────
  const save = useCallback((data) => {
    if (!uid) return;
    updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
  }, [uid]);

  // ── Actions ─────────────────────────────────────────────────────
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

  const addXp = useCallback((amount) => {
    setXp(prev => { const n = prev + amount; save({ xp: n }); return n; });
  }, [save]);

  return {
    loading, xp, streak, habits, missions,
    toggleHabit, completeMission, addHabit, addMission, addXp,
  };
}
