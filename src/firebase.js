import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALJWkYJ-PRT-yc6ZzuPEvQR1hj89C8K_w",
  authDomain: "aura-app-d5688.firebaseapp.com",
  projectId: "aura-app-d5688",
  storageBucket: "aura-app-d5688.firebasestorage.app",
  messagingSenderId: "902365296946",
  appId: "1:902365296946:web:b0a0d919a8905f8bd17f2b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };