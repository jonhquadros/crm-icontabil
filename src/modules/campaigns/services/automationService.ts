import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AutomationTrigger } from '../types/automation.types';
import { kanbanService } from '../../kanban/services/kanbanService';
import { personalizeMessage } from './campaignServerService';

function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

export const automationService = {
  // Listen to all automation triggers for a company
  subscribeToTriggers: (companyId: string, callback: (triggers: AutomationTrigger[]) => void) => {
    if (!companyId) return () => {};

    const q = query(
      collection(db, 'automationTriggers'),
      where('companyId', '==', companyId)
    );

    return onSnapshot(q, (snapshot) => {
      const triggers = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as AutomationTrigger;
      });

      // Sort client-side by creation date
      triggers.sort((a, b) => {
        const timeA = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt?.getTime ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });

      callback(triggers);
    }, (err) => {
      console.error('Error listening to automationTriggers:', err);
    });
  },

  // Fetch triggers once
  getTriggers: async (companyId: string): Promise<AutomationTrigger[]> => {
    if (!companyId) return [];

    const q = query(
      collection(db, 'automationTriggers'),
      where('companyId', '==', companyId)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : d.data().createdAt,
      updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate() : d.data().updatedAt,
    } as AutomationTrigger));
  },

  // Create new trigger
  createTrigger: async (
    companyId: string, 
    userId: string, 
    data: Omit<AutomationTrigger, 'id' | 'companyId' | 'triggerCount' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ): Promise<string> => {
    const colRef = collection(db, 'automationTriggers');
    const docRef = doc(colRef);
    const now = serverTimestamp();

    const newTrigger = cleanUndefined({
      ...data,
      id: docRef.id,
      companyId,
      triggerCount: 0,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId
    });

    await setDoc(docRef, newTrigger);
    return docRef.id;
  },

  // Update existing trigger
  updateTrigger: async (triggerId: string, userId: string, data: Partial<AutomationTrigger>) => {
    const docRef = doc(db, 'automationTriggers', triggerId);
    const updateData = cleanUndefined({
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
    await updateDoc(docRef, updateData);
  },

  // Toggle trigger active status
  toggleTriggerActive: async (triggerId: string, userId: string, currentStatus: boolean) => {
    const docRef = doc(db, 'automationTriggers', triggerId);
    await updateDoc(docRef, {
      active: !currentStatus,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    });
  },

  // Delete trigger
  deleteTrigger: async (triggerId: string) => {
    const docRef = doc(db, 'automationTriggers', triggerId);
    await deleteDoc(docRef);
  },

  // Seed default suggested triggers if company has none
  seedDefaultTriggersIfEmpty: async (companyId: string, userId: string): Promise<boolean> => {
    if (!companyId) return false;

    const existing = await automationService.getTriggers(companyId);
    if (existing.length > 0) return false; // Already has triggers

    const defaultTriggers = [
      {
        pipelineId: 'default_pipeline',
        pipelineName: 'Pipeline Geral',
        columnName: 'lead',
        columnLabel: 'Novo Lead',
        templateName: 'Apresentação do Escritório',
        templateText: '{{saudacao}} {{nome}}! Recebemos seu contato com muito carinho na {{empresa}}. Como podemos ajudar seu negócio hoje? {{fechamento}}',
        instanceId: 'inst_principal',
        instanceName: 'WhatsApp Principal',
        delayMs: 0,
        active: true
      },
      {
        pipelineId: 'default_pipeline',
        pipelineName: 'Pipeline Geral',
        columnName: 'documentation',
        columnLabel: 'Documentação Pendente',
        templateName: 'Checklist de Documentos',
        templateText: '{{saudacao}} {{nome}}, referente ao processo da {{empresa}}, identificamos a necessidade do envio dos seus documentos. Caso precise de suporte, conte conosco!',
        instanceId: 'inst_principal',
        instanceName: 'WhatsApp Principal',
        delayMs: 0,
        active: true
      },
      {
        pipelineId: 'default_pipeline',
        pipelineName: 'Pipeline Geral',
        columnName: 'waiting',
        columnLabel: 'Aguardando Cliente',
        templateName: 'Lembrete de Retorno',
        templateText: '{{saudacao}} {{nome}}, passando para saber como estão as coisas na {{empresa}} e se podemos dar sequência no nosso atendimento. {{fechamento}}',
        instanceId: 'inst_principal',
        instanceName: 'WhatsApp Principal',
        delayMs: 172800000, // 48h
        active: true
      },
      {
        pipelineId: 'default_pipeline',
        pipelineName: 'Pipeline Geral',
        columnName: 'won',
        columnLabel: 'Cliente Ativo',
        templateName: 'Boas-Vindas Novo Cliente',
        templateText: '{{saudacao}} {{nome}}! Seja muito bem-vindo como cliente parceiro da {{empresa}}. É uma honra cuidar da sua contabilidade!',
        instanceId: 'inst_principal',
        instanceName: 'WhatsApp Principal',
        delayMs: 0,
        active: true
      }
    ];

    for (const t of defaultTriggers) {
      await automationService.createTrigger(companyId, userId, t as any);
    }

    return true;
  },

  // Main execution trigger when a card's column changes
  processCardColumnChange: async (params: {
    companyId: string;
    cardId: string;
    cardTitle?: string;
    clientName?: string;
    phone?: string;
    companyName?: string;
    columnId: string;
    columnLabel?: string;
    pipelineId?: string;
    authorName?: string;
  }) => {
    const {
      companyId,
      cardId,
      cardTitle,
      clientName,
      phone,
      companyName,
      columnId,
      columnLabel,
      pipelineId,
      authorName
    } = params;

    if (!companyId || !cardId || !phone) {
      return { triggered: false, reason: 'Dados insuficientes do contato/card' };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      return { triggered: false, reason: 'Telefone inválido' };
    }

    // 1. Find active triggers for this company & matching column
    const triggers = await automationService.getTriggers(companyId);
    const activeMatchingTriggers = triggers.filter(t => {
      if (!t.active) return false;
      
      const colMatch = 
        t.columnName.toLowerCase() === columnId.toLowerCase() ||
        (t.columnLabel && columnLabel && t.columnLabel.toLowerCase() === columnLabel.toLowerCase()) ||
        (t.columnName.toLowerCase() === (columnLabel || '').toLowerCase());

      const pipeMatch = !t.pipelineId || !pipelineId || t.pipelineId === pipelineId || t.pipelineId === 'default_pipeline';

      return colMatch && pipeMatch;
    });

    if (activeMatchingTriggers.length === 0) {
      return { triggered: false, reason: 'Nenhum gatilho ativo para esta coluna' };
    }

    // 2. Check Opt-Out list for this phone number
    const optOutQuery = query(
      collection(db, 'optOutList'),
      where('companyId', '==', companyId),
      where('phone', '==', cleanPhone),
      where('active', '==', true)
    );
    const optOutSnap = await getDocs(optOutQuery);

    if (!optOutSnap.empty) {
      // Record blocked event in card timeline
      await kanbanService.addTimelineEvent(cardId, {
        type: 'stage_change',
        title: 'Automação Bloqueada (Opt-Out)',
        description: `Gatilho de automação para a coluna "${columnLabel || columnId}" não foi enviado pois o número ${cleanPhone} está na lista de bloqueio (Opt-Out).`,
        author: authorName || 'Sistema de Automações'
      });

      return { triggered: false, reason: 'Número em lista de Opt-Out' };
    }

    let queuedCount = 0;

    for (const trigger of activeMatchingTriggers) {
      // Prepare personalized text
      const rawText = trigger.customMessage || trigger.templateText || 'Olá {{nome}}, tudo bem?';
      const formattedMessage = personalizeMessage(rawText, {
        name: clientName || cardTitle || 'Cliente',
        company: companyName || 'sua empresa',
        city: '',
        email: ''
      });

      const delayMs = trigger.delayMs || 0;
      const scheduledAtDate = new Date(Date.now() + delayMs);

      // Create queue item in campaignQueue
      await addDoc(collection(db, 'campaignQueue'), {
        companyId,
        campaignId: `auto_${trigger.id}`,
        campaignName: `Automação: ${trigger.columnLabel || trigger.columnName}`,
        contactName: clientName || cardTitle || 'Cliente',
        contactPhone: cleanPhone,
        message: formattedMessage,
        instanceId: trigger.instanceId || 'default',
        instanceName: trigger.instanceName || 'WhatsApp Principal',
        status: 'pending',
        delayMs,
        scheduledAt: Timestamp.fromDate(scheduledAtDate),
        createdAt: serverTimestamp(),
        isAutomation: true,
        triggerId: trigger.id,
        cardId
      });

      // Increment trigger count
      await updateDoc(doc(db, 'automationTriggers', trigger.id), {
        triggerCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Register timeline event in CRM Card
      const delayText = delayMs === 0 ? 'imediatamente' : `em ${delayMs / 3600000}h`;
      await kanbanService.addTimelineEvent(cardId, {
        type: 'stage_change',
        title: `Automação Disparada (${trigger.columnLabel || trigger.columnName})`,
        description: `Mensagem WhatsApp agendada (${delayText}) para ${cleanPhone}: "${formattedMessage.substring(0, 80)}..."`,
        author: authorName || 'Robô de Automação CRM'
      });

      queuedCount++;
    }

    return { triggered: true, queuedCount };
  }
};
