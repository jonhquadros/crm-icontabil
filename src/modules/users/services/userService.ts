import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  addDoc,
  doc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AppUser } from '../types';

export const userService = {
  subscribeToCompanyUsers: (companyId: string, callback: (users: AppUser[]) => void) => {
    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppUser[];
      callback(users);
    });
  },

  inviteUser: async (companyId: string, data: Omit<AppUser, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'active'>, createdBy: string) => {
    return addDoc(collection(db, 'users'), {
      ...data,
      companyId,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
    });
  },

  updateUser: async (id: string, data: Partial<AppUser>) => {
    const userRef = doc(db, 'users', id);
    return updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Note: Creating a new user usually involves Firebase Auth (invitation flow)
  // For this demo, we'll assume we're just updating the Firestore document
  // which would be created by an Auth trigger or a cloud function.
  saveUserPermissions: async (id: string, role: string, permissions: any) => {
    const userRef = doc(db, 'users', id);
    return updateDoc(userRef, {
      role,
      permissions,
      updatedAt: serverTimestamp(),
    });
  },

  deleteUser: async (id: string) => {
    const userRef = doc(db, 'users', id);
    return updateDoc(userRef, {
      active: false,
      status: 'inactive',
      updatedAt: serverTimestamp(),
    });
  }
};
