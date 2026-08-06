import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userData: any | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userData: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Use onSnapshot for real-time updates and better offline handling
        unsubscribeSnapshot = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          async (docSnap) => {
            if (docSnap.exists()) {
              setUserData({ id: docSnap.id, ...docSnap.data() });
            } else if (firebaseUser.email) {
              // Auto-create profile for test/admin emails if missing
              const email = firebaseUser.email.toLowerCase();
              if (email === 'teste@teste.com' || email === 'jonhquadros@gmail.com') {
                const isJonh = email === 'jonhquadros@gmail.com';
                const newUserData = {
                  name: firebaseUser.displayName || email.split('@')[0],
                  email: email,
                  role: isJonh ? 'viewer' : 'admin',
                  companyId: 'comp_default',
                  companyName: 'iContábil CRM',
                  active: true,
                  permissions: isJonh ? {
                    dashboard: { view: true, create: false, edit: false, delete: false },
                    clients: { view: true, create: false, edit: false, delete: false },
                    kanban: { view: true, create: false, edit: false, delete: false },
                    whatsapp: { view: true, create: false, edit: false, delete: false },
                    calendar: { view: true, create: false, edit: false, delete: false },
                    documents: { view: true, create: false, edit: false, delete: false },
                    tasks: { view: true, create: false, edit: false, delete: false },
                    reports: { view: true, create: false, edit: false, delete: false },
                    users: { view: false, create: false, edit: false, delete: false },
                    campaigns: { view: true, create: false, edit: false, delete: false }
                  } : {
                    dashboard: { view: true, create: true, edit: true, delete: true },
                    clients: { view: true, create: true, edit: true, delete: true },
                    kanban: { view: true, create: true, edit: true, delete: true },
                    whatsapp: { view: true, create: true, edit: true, delete: true },
                    calendar: { view: true, create: true, edit: true, delete: true },
                    documents: { view: true, create: true, edit: true, delete: true },
                    tasks: { view: true, create: true, edit: true, delete: true },
                    reports: { view: true, create: true, edit: true, delete: true },
                    users: { view: true, create: true, edit: true, delete: true },
                    campaigns: { view: true, create: true, edit: true, delete: true }
                  },
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                try {
                  const { setDoc, doc } = await import('firebase/firestore');
                  await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
                  // onSnapshot will trigger again and set the state
                } catch (err) {
                  console.error("Error auto-creating profile:", err);
                }
              }
              setUserData(null);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error in user data snapshot:', error);
            // Don't block loading on data error if we have a user
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
