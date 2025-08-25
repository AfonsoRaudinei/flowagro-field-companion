import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDd3Xmr1w0FU4mcgHXH2KEaOFixg7ngvn0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flowagro-8c3bc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flowagro-8c3bc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flowagro-8c3bc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "540665358389",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:540665358389:web:3171e5b6e7aeef63e9a97c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XX69ZPBW9W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Enable offline persistence
export const enableOffline = () => disableNetwork(db);
export const enableOnline = () => enableNetwork(db);