import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (firebaseAppletConfig as any).apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseAppletConfig as any).authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (firebaseAppletConfig as any).projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseAppletConfig as any).storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseAppletConfig as any).messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (firebaseAppletConfig as any).appId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId);

export default app;
