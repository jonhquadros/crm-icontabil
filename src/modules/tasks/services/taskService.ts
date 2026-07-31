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
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Task } from '../types';

export const taskService = {
  subscribeToTasks: (companyId: string, callback: (tasks: Task[]) => void) => {
    const q = query(
      collection(db, 'tasks'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('dueDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      callback(tasks);
    });
  },

  createTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'active'>) => {
    const coll = collection(db, 'tasks');
    const snapshot = await getCountFromServer(coll);
    const count = snapshot.data().count;
    const nextId = `task_${count + 1}`;

    return setDoc(doc(db, 'tasks', nextId), {
      ...taskData,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    const taskRef = doc(db, 'tasks', id);
    return updateDoc(taskRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteTask: async (id: string) => {
    const taskRef = doc(db, 'tasks', id);
    return updateDoc(taskRef, {
      active: false,
      updatedAt: serverTimestamp(),
    });
  }
};
