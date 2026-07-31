import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export const reportService = {
  getClientStats: async (companyId: string) => {
    const q = query(collection(db, 'clients'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const clients = snapshot.docs.map(doc => doc.data());
    
    return {
      total: clients.length,
      active: clients.filter(c => c.active).length,
      byType: clients.reduce((acc: any, curr: any) => {
        const type = curr.type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  },

  getTaskStats: async (companyId: string) => {
    const q = query(collection(db, 'tasks'), where('companyId', '==', companyId), where('active', '==', true));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => doc.data());

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      byPriority: tasks.reduce((acc: any, curr: any) => {
        acc[curr.priority] = (acc[curr.priority] || 0) + 1;
        return acc;
      }, {})
    };
  }
};
