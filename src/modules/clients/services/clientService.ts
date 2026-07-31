import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  setDoc,
  getCountFromServer,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Client } from '../types';

export const clientService = {
  subscribeToClients: (companyId: string, callback: (clients: Client[]) => void) => {
    const q = query(
      collection(db, 'clients'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      callback(clients);
    });
  },

  createClient: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'active'>) => {
    const coll = collection(db, 'clients');
    const snapshot = await getCountFromServer(coll);
    const count = snapshot.data().count;
    const nextId = `cli_${count + 1}`;

    return setDoc(doc(db, 'clients', nextId), {
      ...clientData,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  updateClient: async (id: string, data: Partial<Client>) => {
    const clientRef = doc(db, 'clients', id);
    return updateDoc(clientRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteClient: async (id: string) => {
    const clientRef = doc(db, 'clients', id);
    return updateDoc(clientRef, {
      active: false,
      updatedAt: serverTimestamp(),
    });
  }
};
