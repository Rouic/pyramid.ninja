// src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getPerformance, FirebasePerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: "AIzaSyDyk-FE8w0yd82WduMP6KVmvRPt0-4miS8",
  authDomain: "pyramid-ninja.firebaseapp.com",
  databaseURL: "https://pyramid-ninja.firebaseio.com",
  projectId: "pyramid-ninja",
  storageBucket: "pyramid-ninja.appspot.com",
  messagingSenderId: "668178102663",
  appId: "1:668178102663:web:bc247d167d2cab96adfb22",
  measurementId: "G-VCPEBG1XK7"
};

// Initialize Firebase if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics and Performance in browser environment only
let analytics: Analytics | null = null;
let performance: FirebasePerformance | null = null;

if (typeof window !== 'undefined') {
  // Initialize Firebase Analytics
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
  
}

export { app, auth, db, analytics, performance };