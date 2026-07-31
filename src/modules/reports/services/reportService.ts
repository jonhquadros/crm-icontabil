import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export const reportService = {
  getClientStats: async (companyId: string) => {
    const q = query(collection(db, 'clients'), where('companyId', '==', companyId), where('active', '==', true));
    const snapshot = await getDocs(q);
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    
    const activeCount = clients.filter(c => c.status === 'active' || (!c.status && c.active !== false)).length;
    const inactiveCount = clients.filter(c => c.status === 'inactive').length;
    const leadCount = clients.filter(c => c.status === 'lead').length;
    const blockedCount = clients.filter(c => c.status === 'blocked').length;

    const byRegime = clients.reduce((acc: any, curr: any) => {
      const regime = curr.taxRegime || curr.type || 'Outros';
      acc[regime] = (acc[regime] || 0) + 1;
      return acc;
    }, {});

    return {
      total: clients.length,
      active: activeCount,
      inactive: inactiveCount,
      lead: leadCount,
      blocked: blockedCount,
      rawClients: clients,
      byType: byRegime,
      byStatus: {
        'Ativos': activeCount,
        'Inativos': inactiveCount,
        'Leads': leadCount,
        'Bloqueados': blockedCount
      }
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
