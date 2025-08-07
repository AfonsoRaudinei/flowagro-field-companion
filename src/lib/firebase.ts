import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDd3Xmr1w0FU4mcgHXH2KEaOFixg7ngvn0",
  authDomain: "flowagro-8c3bc.firebaseapp.com",
  projectId: "flowagro-8c3bc",
  storageBucket: "flowagro-8c3bc.firebasestorage.app",
  messagingSenderId: "540665358389",
  appId: "1:540665358389:web:3171e5b6e7aeef63e9a97c",
  measurementId: "G-XX69ZPBW9W"
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