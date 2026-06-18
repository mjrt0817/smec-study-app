import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0125274260",
  appId: "1:525064586221:web:a118584b93f9db49669de4",
  apiKey: "AIzaSyAfgEV9oDQQPnlP7r-RnAYRKlEB6vL-S5I",
  authDomain: "gen-lang-client-0125274260.firebaseapp.com",
  storageBucket: "gen-lang-client-0125274260.firebasestorage.app",
  messagingSenderId: "525064586221",
};

const app = initializeApp(firebaseConfig);

// The user's requested firestoreDatabaseId
const firestoreDatabaseId = "ai-studio-d0db6707-4bff-4ffa-9012-738e5d076770";

export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
