import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { CompanyProfile, IntegrationConfig, AuditLogEntry } from '../types';

export const settingsRepository = {
  getCompanyProfile: async (companyId: string): Promise<CompanyProfile | null> => {
    if (!companyId) return null;
    const ref = doc(db, 'companies', companyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CompanyProfile;
  },

  updateCompanyProfile: async (companyId: string, data: Partial<CompanyProfile>, userId: string) => {
    const ref = doc(db, 'companies', companyId);
    const snap = await getDoc(ref);
    const updatePayload = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (snap.exists()) {
      await updateDoc(ref, updatePayload);
    } else {
      await setDoc(ref, {
        ...updatePayload,
        id: companyId,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
    }

    // Sync companyName in user doc
    const userRef = doc(db, 'users', userId);
    if (data.name) {
      await updateDoc(userRef, {
        companyName: data.name,
        updatedAt: serverTimestamp(),
      });
    }
  },

  getIntegrations: async (companyId: string): Promise<IntegrationConfig | null> => {
    if (!companyId) return null;
    const ref = doc(db, 'companies', companyId, 'settings', 'integrations');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as IntegrationConfig;
  },

  saveIntegrations: async (companyId: string, config: Partial<IntegrationConfig>, userId: string) => {
    const ref = doc(db, 'companies', companyId, 'settings', 'integrations');
    await setDoc(ref, {
      ...config,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    }, { merge: true });
  },

  getUserPreferences: async (userId: string) => {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data()?.preferences || null;
  },

  updateUserPreferences: async (userId: string, category: string, preferences: any) => {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, {
      [`preferences.${category}`]: preferences,
      updatedAt: serverTimestamp(),
    });
  },

  addAuditLog: async (companyId: string, log: Omit<AuditLogEntry, 'id'>) => {
    if (!companyId) return;
    const ref = doc(collection(db, 'companies', companyId, 'auditLogs'));
    await setDoc(ref, {
      ...log,
      createdAt: serverTimestamp(),
    });
  },

  getAuditLogs: async (companyId: string, maxLogs = 20): Promise<AuditLogEntry[]> => {
    if (!companyId) return [];
    try {
      const q = query(
        collection(db, 'companies', companyId, 'auditLogs'),
        orderBy('createdAt', 'desc'),
        limit(maxLogs)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
    } catch (err) {
      console.error('Erro ao carregar audit logs:', err);
      return [];
    }
  }
};
