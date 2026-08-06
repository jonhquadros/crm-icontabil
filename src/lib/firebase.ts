import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Safely determine environment variables in both client (Vite) and server (Node) environments
const safeEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

const firebaseConfig = {
  apiKey: safeEnv.VITE_FIREBASE_API_KEY || (firebaseAppletConfig as any).apiKey,
  authDomain: safeEnv.VITE_FIREBASE_AUTH_DOMAIN || (firebaseAppletConfig as any).authDomain,
  projectId: safeEnv.VITE_FIREBASE_PROJECT_ID || (firebaseAppletConfig as any).projectId,
  storageBucket: safeEnv.VITE_FIREBASE_STORAGE_BUCKET || (firebaseAppletConfig as any).storageBucket,
  messagingSenderId: safeEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseAppletConfig as any).messagingSenderId,
  appId: safeEnv.VITE_FIREBASE_APP_ID || (firebaseAppletConfig as any).appId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
