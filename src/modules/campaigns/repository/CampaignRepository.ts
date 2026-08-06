import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Campaign, 
  CampaignContact, 
  CampaignTemplate, 
  OptOut, 
  CampaignStatus 
} from '../types/campaign.types';

export const CampaignRepository = {
  // --- CAMPAIGNS ---
  subscribeToCampaigns: (companyId: string, callback: (campaigns: Campaign[]) => void) => {
    const q = query(
      collection(db, 'campaigns'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const campaigns = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate() : data.scheduledAt,
          startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : data.startedAt,
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt,
          pausedAt: data.pausedAt?.toDate ? data.pausedAt.toDate() : data.pausedAt,
        };
      }) as Campaign[];
      callback(campaigns);
    }, (err) => {
      console.error('Error listening to campaigns:', err);
    });
  },

  subscribeToCampaignDetail: (campaignId: string, callback: (campaign: Campaign | null) => void) => {
    const docRef = doc(db, 'campaigns', campaignId);
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      const data = docSnap.data();
      const campaign = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate() : data.scheduledAt,
        startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : data.startedAt,
        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt,
        pausedAt: data.pausedAt?.toDate ? data.pausedAt.toDate() : data.pausedAt,
      } as Campaign;
      callback(campaign);
    }, (err) => {
      console.error('Error listening to campaign detail:', err);
    });
  },

  getCampaigns: async (companyId: string): Promise<Campaign[]> => {
    const q = query(
      collection(db, 'campaigns'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate() : data.scheduledAt,
        startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : data.startedAt,
        completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt,
        pausedAt: data.pausedAt?.toDate ? data.pausedAt.toDate() : data.pausedAt,
      } as Campaign;
    });
  },

  getCampaignById: async (campaignId: string): Promise<Campaign | null> => {
    const docRef = doc(db, 'campaigns', campaignId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate() : data.scheduledAt,
      startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : data.startedAt,
      completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt,
      pausedAt: data.pausedAt?.toDate ? data.pausedAt.toDate() : data.pausedAt,
    } as Campaign;
  },

  createCampaign: async (companyId: string, userId: string, data: Omit<Campaign, 'id' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'metrics'>): Promise<string> => {
    const colRef = collection(db, 'campaigns');
    const docRef = doc(colRef);
    const now = serverTimestamp();
    const newCampaign = {
      ...data,
      id: docRef.id,
      companyId,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      metrics: {
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0,
        replied: 0,
        optedOut: 0
      }
    };
    await setDoc(docRef, newCampaign);
    return docRef.id;
  },

  updateCampaign: async (campaignId: string, userId: string, data: Partial<Campaign>) => {
    const docRef = doc(db, 'campaigns', campaignId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  },

  deleteCampaign: async (campaignId: string) => {
    const docRef = doc(db, 'campaigns', campaignId);
    await updateDoc(docRef, {
      active: false,
      updatedAt: serverTimestamp()
    });
  },

  // --- CAMPAIGN CONTACTS ---
  subscribeToContacts: (campaignId: string, callback: (contacts: CampaignContact[]) => void) => {
    const q = query(
      collection(db, 'campaigns', campaignId, 'contacts'),
      where('active', '==', true),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const contacts = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : data.sentAt,
          failedAt: data.failedAt?.toDate ? data.failedAt.toDate() : data.failedAt,
          optedOutAt: data.optedOutAt?.toDate ? data.optedOutAt.toDate() : data.optedOutAt,
        };
      }) as CampaignContact[];
      callback(contacts);
    }, (err) => {
      console.error('Error listening to campaign contacts:', err);
    });
  },

  getContacts: async (campaignId: string): Promise<CampaignContact[]> => {
    const q = query(
      collection(db, 'campaigns', campaignId, 'contacts'),
      where('active', '==', true),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : data.sentAt,
        failedAt: data.failedAt?.toDate ? data.failedAt.toDate() : data.failedAt,
        optedOutAt: data.optedOutAt?.toDate ? data.optedOutAt.toDate() : data.optedOutAt,
      } as CampaignContact;
    });
  },

  addContactsBatch: async (
    campaignId: string,
    companyId: string,
    userId: string,
    contacts: Omit<CampaignContact, 'id' | 'campaignId' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'sentAt' | 'failedAt' | 'failReason' | 'retries' | 'messageId' | 'optedOutAt'>[]
  ) => {
    // Firestore batch supports up to 500 writes
    const batchSize = 400;
    const now = new Date();

    for (let i = 0; i < contacts.length; i += batchSize) {
      const chunk = contacts.slice(i, i + batchSize);
      const batch = writeBatch(db);

      chunk.forEach(contactData => {
        const contactCol = collection(db, 'campaigns', campaignId, 'contacts');
        const contactRef = doc(contactCol);

        const newContact = {
          ...contactData,
          id: contactRef.id,
          campaignId,
          companyId,
          active: true,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
          status: 'pending' as const,
          sentAt: null,
          failedAt: null,
          failReason: null,
          retries: 0,
          messageId: null,
          optedOutAt: null
        };

        batch.set(contactRef, newContact);
      });

      await batch.commit();
    }

    // Also update campaign total metrics
    const campaignRef = doc(db, 'campaigns', campaignId);
    await updateDoc(campaignRef, {
      'metrics.total': increment(contacts.length),
      'metrics.pending': increment(contacts.length),
      updatedAt: serverTimestamp()
    });
  },

  deleteContact: async (campaignId: string, contactId: string, contactStatus?: string) => {
    const docRef = doc(db, 'campaigns', campaignId, 'contacts', contactId);
    await deleteDoc(docRef);

    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      if (campaignSnap.exists()) {
        const campaignData = campaignSnap.data();
        const currentMetrics = campaignData.metrics || {};
        const newTotal = Math.max(0, (currentMetrics.total || 0) - 1);
        const updates: Record<string, any> = {
          'metrics.total': newTotal,
          updatedAt: serverTimestamp()
        };
        const statusToUpdate = (contactStatus && ['pending', 'sent', 'failed', 'delivered', 'read', 'optedOut'].includes(contactStatus))
          ? contactStatus
          : 'pending';
        const currentStatusVal = currentMetrics[statusToUpdate] || 0;
        updates[`metrics.${statusToUpdate}`] = Math.max(0, currentStatusVal - 1);
        
        await updateDoc(campaignRef, updates);
      }
    } catch (err) {
      console.warn('Non-fatal: failed to update campaign metrics on deleteContact:', err);
    }
  },

  updateContact: async (campaignId: string, contactId: string, userId: string, data: Partial<CampaignContact>) => {
    const docRef = doc(db, 'campaigns', campaignId, 'contacts', contactId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  },

  // --- CAMPAIGN TEMPLATES ---
  getTemplates: async (companyId: string): Promise<CampaignTemplate[]> => {
    const q = query(
      collection(db, 'campaignTemplates'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as CampaignTemplate;
    });
  },

  addTemplate: async (companyId: string, userId: string, data: Omit<CampaignTemplate, 'id' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'usageCount'>): Promise<string> => {
    const colRef = collection(db, 'campaignTemplates');
    const docRef = doc(colRef);
    const now = serverTimestamp();
    const newTemplate = {
      ...data,
      id: docRef.id,
      companyId,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      usageCount: 0
    };
    await setDoc(docRef, newTemplate);
    return docRef.id;
  },

  updateTemplate: async (templateId: string, userId: string, data: Partial<CampaignTemplate>) => {
    const docRef = doc(db, 'campaignTemplates', templateId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  },

  deleteTemplate: async (templateId: string) => {
    const docRef = doc(db, 'campaignTemplates', templateId);
    await updateDoc(docRef, {
      active: false,
      updatedAt: serverTimestamp()
    });
  },

  // --- OPT-OUT LIST ---
  subscribeToOptOutList: (companyId: string, callback: (list: OptOut[]) => void) => {
    const q = query(
      collection(db, 'optOutList'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          optedOutAt: data.optedOutAt?.toDate ? data.optedOutAt.toDate() : data.optedOutAt,
        };
      }) as OptOut[];
      callback(list);
    }, (err) => {
      console.error('Error listening to optOutList:', err);
    });
  },

  getOptOutList: async (companyId: string): Promise<OptOut[]> => {
    const q = query(
      collection(db, 'optOutList'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        optedOutAt: data.optedOutAt?.toDate ? data.optedOutAt.toDate() : data.optedOutAt,
      } as OptOut;
    });
  },

  addOptOut: async (companyId: string, userId: string, phone: string, source: 'reply_stop' | 'manual' | 'webhook', reason?: string, name?: string): Promise<string> => {
    const colRef = collection(db, 'optOutList');
    const docRef = doc(colRef);
    const now = serverTimestamp();
    const cleanPhone = phone.replace(/\D/g, '');

    const newOptOut = {
      id: docRef.id,
      companyId,
      phone: cleanPhone,
      name: name || null,
      optedOutAt: now,
      source,
      reason: reason || null,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    };

    await setDoc(docRef, newOptOut);
    return docRef.id;
  },

  removeOptOut: async (optOutId: string, userId: string) => {
    const docRef = doc(db, 'optOutList', optOutId);
    await updateDoc(docRef, {
      active: false,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  }
};
