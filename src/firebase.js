import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

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

export async function ensureAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user);
      } else {
        const cred = await signInAnonymously(auth);
        resolve(cred.user);
      }
    });
  });
}
