// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDyZlPtMKDbrxDbO6RlWCvs0EJaLfUXkMc",
  authDomain: "odgd-3b2b0.firebaseapp.com",
  projectId: "odgd-3b2b0",
  storageBucket: "odgd-3b2b0.firebasestorage.app",
  messagingSenderId: "756894598815",
  appId: "1:756894598815:web:b23b77c66b2b684bcec4aa",
  measurementId: "G-BE3H8ESSJ1"
};

// Initialize Firebase (prevents re-initialization issues in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;