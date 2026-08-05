import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { EvolutionConfig } from '../types';

export const evolutionRepository = {
  getEvolutionConfig: async (companyId: string): Promise<EvolutionConfig | null> => {
    if (!companyId) return null;
    const ref = doc(db, 'companies', companyId, 'settings', 'evolution');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as EvolutionConfig;
  },

  saveEvolutionConfig: async (companyId: string, data: Partial<EvolutionConfig>, userId?: string) => {
    if (!companyId) return;
    const ref = doc(db, 'companies', companyId, 'settings', 'evolution');
    const snap = await getDoc(ref);

    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId || 'system',
    };

    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  },

  updateStatus: async (companyId: string, status: EvolutionConfig['status'], qrCodeUrl?: string) => {
    if (!companyId) return;
    const ref = doc(db, 'companies', companyId, 'settings', 'evolution');
    await updateDoc(ref, {
      status,
      ...(qrCodeUrl !== undefined ? { qrCodeUrl } : {}),
      ...(status === 'connected' ? { lastConnectedAt: new Date().toISOString() } : {}),
      updatedAt: serverTimestamp(),
    });
  }
};
