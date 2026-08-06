import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

export interface RbacLog {
  id?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  route: string;
  module: string;
  action: string;
  permitted: boolean;
  timestamp: any;
  details?: string;
}

export const rbacLogger = {
  logAccessAttempt: async (
    userId: string,
    userEmail: string,
    userRole: string,
    route: string,
    module: string,
    action: string,
    permitted: boolean,
    details?: string
  ) => {
    try {
      const logData = {
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous',
        userRole: userRole || 'none',
        route,
        module,
        action,
        permitted,
        timestamp: new Date().toISOString(), // Use simple ISO string to avoid client/server timestamp sync latency in instant audits
        details: details || '',
      };
      
      // Log to console for real-time tracking
      if (permitted) {
        console.log(`[RBAC SUCCESS] User ${userEmail} (${userRole}) accessed ${route} (module: ${module}, action: ${action})`);
      } else {
        console.warn(`[RBAC FAILURE] User ${userEmail} (${userRole}) blocked from ${route} (module: ${module}, action: ${action}). Details: ${details}`);
      }

      // Log to firestore
      const rbacLogsRef = collection(db, 'rbacLogs');
      await addDoc(rbacLogsRef, {
        ...logData,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error writing RBAC log to firestore:', error);
    }
  },

  getRecentLogs: async (maxLogs = 50): Promise<RbacLog[]> => {
    try {
      const q = query(
        collection(db, 'rbacLogs'),
        orderBy('createdAt', 'desc'),
        limit(maxLogs)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as RbacLog));
    } catch (err) {
      console.error('Error loading RBAC logs:', err);
      return [];
    }
  }
};
