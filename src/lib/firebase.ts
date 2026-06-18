import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA7HEK0181ZDogpbBum7ubRW5FXYr3zeMM",
  authDomain: "smec-exam-app.firebaseapp.com",
  projectId: "smec-exam-app",
  storageBucket: "smec-exam-app.firebasestorage.app",
  messagingSenderId: "497871148123",
  appId: "1:497871148123:web:fffb64f43f4aed1a8f1b7e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
