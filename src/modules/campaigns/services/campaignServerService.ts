import { Express, Request, Response } from 'express';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch, 
  increment, 
  Timestamp 
} from 'firebase/firestore';

// Pools for dynamic, anti-ban rotations
const GREETINGS = [
  'Olá', 'Oi', 'Bom dia', 'Boa tarde',
  'Olá, tudo bem?', 'Oi, tudo bem?'
];

const CLOSINGS = [
  'Estamos à disposição!',
  'Qualquer dúvida, é só falar.',
  'Fico à disposição para mais informações.',
  'Conte conosco!',
  'Será um prazer atendê-lo.'
];

const ACCOUNTING_ANGLES = [
  'simplificar sua contabilidade',
  'cuidar da sua contabilidade',
  'organizar sua vida fiscal',
  'resolver sua situação contábil',
  'gerenciar seus tributos'
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Personalize message dynamically to evade templates anti-ban detection
export function personalizeMessage(
  template: string,
  contact: { name: string; company?: string; city?: string; email?: string; customVars?: Record<string, string> },
  variations?: string[]
): string {
  let text = variations && variations.length > 0
    ? pickRandom(variations)
    : template;

  const firstName = contact.name ? contact.name.split(' ')[0] : 'Cliente';

  // Replace standard variables
  text = text
    .replace(/\{\{nome\}\}/gi, firstName)
    .replace(/\{\{nome_completo\}\}/gi, contact.name || '')
    .replace(/\{\{empresa\}\}/gi, contact.company || '')
    .replace(/\{\{cidade\}\}/gi, contact.city || '')
    .replace(/\{\{email\}\}/gi, contact.email || '')
    .replace(/\{\{saudacao\}\}/gi, pickRandom(GREETINGS))
    .replace(/\{\{fechamento\}\}/gi, pickRandom(CLOSINGS))
    .replace(/\{\{angulo\}\}/gi, pickRandom(ACCOUNTING_ANGLES));

  // Replace custom variables
  if (contact.customVars) {
    for (const [key, value] of Object.entries(contact.customVars)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value);
    }
  }

  return text.trim();
}

function randomDelay(minMs: number, maxMs: number): number {
  const base = Math.random() * (maxMs - minMs) + minMs;
  const jitter = (Math.random() - 0.5) * 0.1 * base; // +/- 5% jitter
  return Math.floor(base + jitter);
}

function getDailyLimit(warmthLevel: string): number {
  const limits: Record<string, number> = {
    new: 15,
    warming: 30,
    warm: 60,
    hot: 80,
  };
  return limits[warmthLevel] ?? 15;
}

// Fetch instance helper that looks up integrations and settings
async function loadInstanceDetails(companyId: string, instanceId: string) {
  // 1. Try directly from integrations collection
  const directSnap = await getDoc(doc(db, 'integrations', instanceId));
  if (directSnap.exists()) {
    return { ref: directSnap.ref, ...directSnap.data() };
  }

  // 2. Try companies/{companyId}/settings/integrations
  const configDocRef = doc(db, 'companies', companyId, 'settings', 'integrations');
  const configSnap = await getDoc(configDocRef);
  if (configSnap.exists()) {
    const data = configSnap.data();
    if (data && data.whatsapp) {
      return {
        ref: configDocRef,
        ...data.whatsapp,
        isSubdoc: true
      };
    }
  }

  return null;
}

// Initialize server routes and workers
export function initCampaignServer(app: Express) {
  console.log("Initializing Campaigns Server Endpoints & Background Workers...");

  // 1. API: Schedule Campaign Endpoint
  app.post("/api/campaigns/schedule", async (req: Request, res: Response) => {
    try {
      const { campaignId, companyId, userId } = req.body;

      if (!campaignId || !companyId) {
        return res.status(400).json({ error: "campaignId and companyId are required" });
      }

      // 1. Load Campaign
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);
      if (!campaignSnap.exists()) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }

      const campaign = campaignSnap.data()!;
      if (campaign.companyId !== companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // 2. Load Instance details
      const instance = await loadInstanceDetails(companyId, campaign.instanceId);
      if (!instance) {
        return res.status(404).json({ error: "Instância de WhatsApp não configurada ou não encontrada" });
      }

      const warmthLevel = (instance.warmth && instance.warmth.level) || 'new';
      const dailyLimit = getDailyLimit(warmthLevel);

      // 3. Load Pending Contacts
      const contactsSnap = await getDocs(
        query(
          collection(db, 'campaigns', campaignId, 'contacts'),
          where('status', '==', 'pending')
        )
      );

      if (contactsSnap.empty) {
        return res.status(400).json({ error: "Nenhum contato pendente nesta campanha" });
      }

      const contacts = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // 3.1 Cross-reference against Company Opt-Out List (Anti-Ban Safety Check)
      const optOutSnap = await getDocs(
        query(
          collection(db, 'optOutList'),
          where('companyId', '==', companyId),
          where('active', '==', true)
        )
      );

      const optOutPhones = new Set<string>();
      optOutSnap.docs.forEach(d => {
        const p = d.data().phone;
        if (p) {
          optOutPhones.add(p.replace(/\D/g, ''));
        }
      });

      let optedOutRemovedCount = 0;
      const validContactsToSchedule: any[] = [];
      const batchOptOutUpdates = writeBatch(db);

      for (const contact of contacts) {
        const cleanPhone = (contact.phone || '').replace(/\D/g, '');
        if (optOutPhones.has(cleanPhone)) {
          optedOutRemovedCount++;
          const contactRef = doc(db, 'campaigns', campaignId, 'contacts', contact.id);
          batchOptOutUpdates.update(contactRef, {
            status: 'opted_out',
            optedOutAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        } else {
          validContactsToSchedule.push(contact);
        }
      }

      if (optedOutRemovedCount > 0) {
        await batchOptOutUpdates.commit();
        console.log(`[Schedule Campaign] Automatically removed ${optedOutRemovedCount} contacts matched in Opt-Out list.`);
      }

      if (validContactsToSchedule.length === 0) {
        await updateDoc(campaignRef, {
          status: 'completed',
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          'metrics.total': contacts.length,
          'metrics.pending': 0,
          'metrics.optedOut': increment(optedOutRemovedCount),
        });

        return res.json({
          success: true,
          jobsCreated: 0,
          optedOutRemovedCount,
          message: "Todos os contatos pendentes estavam na lista de Opt-Out e foram removidos."
        });
      }

      // 4. Create batch schedule in campaignQueue
      const batch = writeBatch(db);
      const baseTime = campaign.scheduledAt ? campaign.scheduledAt.toDate() : new Date();
      let currentTime = baseTime.getTime();
      let jobsCreated = 0;

      for (const contact of validContactsToSchedule) {
        const personalizedText = personalizeMessage(
          campaign.templateText,
          {
            name: contact.name,
            company: contact.company,
            city: contact.city,
            email: contact.email,
            customVars: contact.customVars,
          },
          campaign.templateVariations || []
        );

        const jobRef = doc(collection(db, 'campaignQueue'));
        batch.set(jobRef, {
          id: jobRef.id,
          companyId: campaign.companyId,
          campaignId,
          contactId: contact.id,
          instanceId: campaign.instanceId,

          phone: contact.phone,
          personalizedText,
          nativeDelayMs: randomDelay(2000, 5000),

          status: 'pending',
          scheduledAt: Timestamp.fromMillis(currentTime),
          processedAt: null,
          attempts: 0,

          active: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: userId || 'system',
          updatedBy: userId || 'system',
        });

        // Stagger clock with humanized delay interval
        currentTime += randomDelay(campaign.delayMinMs || 45000, campaign.delayMaxMs || 180000);
        jobsCreated++;

        // Shift next batch of messages to 9 AM the next day if daily instance limit exceeded
        if (jobsCreated % dailyLimit === 0) {
          const nextDay = new Date(currentTime);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(9, 0, 0, 0);
          currentTime = nextDay.getTime();
        }
      }

      await batch.commit();

      // 5. Update Campaign Status
      await updateDoc(campaignRef, {
        status: campaign.scheduledAt ? 'scheduled' : 'running',
        startedAt: campaign.scheduledAt ? null : Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: userId || 'system',
        'metrics.total': contacts.length,
        'metrics.pending': validContactsToSchedule.length,
        'metrics.optedOut': increment(optedOutRemovedCount),
        'metrics.sent': 0,
        'metrics.failed': 0,
      });

      return res.json({
        success: true,
        jobsCreated,
        optedOutRemovedCount,
        estimatedCompletionDays: Math.ceil(validContactsToSchedule.length / dailyLimit),
      });

    } catch (err: any) {
      console.error("Error scheduling campaign:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // 2. API: Webhook Opt-Out Endpoint
  app.post("/api/campaigns/webhook-optout", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const messageText = body?.data?.message?.conversation?.toLowerCase() || '';
      
      const OPT_OUT_KEYWORDS = ['stop', 'pare', 'cancelar', 'não quero', 'sair', 'remover', 'descadastrar'];
      const isOptOut = OPT_OUT_KEYWORDS.some(kw => messageText.includes(kw));

      if (isOptOut) {
        const rawPhone = body?.data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
        const phone = rawPhone ? rawPhone.replace(/\D/g, '') : null;
        const companyId = req.headers['x-company-id'] || 'system';

        if (phone) {
          const optOutSnap = await getDocs(
            query(
              collection(db, 'optOutList'),
              where('companyId', '==', companyId),
              where('phone', '==', phone),
              where('active', '==', true)
            )
          );

          if (optOutSnap.empty) {
            const optRef = doc(collection(db, 'optOutList'));
            await setDoc(optRef, {
              id: optRef.id,
              companyId,
              phone,
              optedOutAt: Timestamp.now(),
              source: 'webhook',
              active: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
              createdBy: 'system',
              updatedBy: 'system',
              reason: `Mensagem enviada com palavra gatilho: "${messageText}"`
            });
            console.log(`[OPT-OUT Webhook] Adicionado número ${phone} à lista de optOut.`);
          }
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Error in webhook optout:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. BACKGROUND TASK: Process Campaign Queue (Runs every 1 minute)
  setInterval(async () => {
    try {
      const now = Timestamp.now();

      // Find the oldest pending job scheduled for now or earlier
      const jobSnap = await getDocs(
        query(
          collection(db, 'campaignQueue'),
          where('status', '==', 'pending'),
          where('scheduledAt', '<=', now),
          orderBy('scheduledAt', 'asc'),
          limit(1)
        )
      );

      if (jobSnap.empty) {
        return; // No pending jobs to process
      }

      const jobDoc = jobSnap.docs[0];
      const job = jobDoc.data();

      console.log(`[Campaign Queue] Processing job ${job.id} to phone ${job.phone}`);

      // Instantly mark as 'processing' (optimistic locking to prevent duplicate runs)
      await updateDoc(jobDoc.ref, {
        status: 'processing',
        updatedAt: Timestamp.now(),
      });

      // 1. Load instance details
      const instance = await loadInstanceDetails(job.companyId, job.instanceId);
      if (!instance) {
        console.warn(`[Campaign Queue] Instance ${job.instanceId} not found. Pausing campaign.`);
        await pauseCampaignDueToInstance(job.campaignId, jobDoc.ref, "Instância não encontrada.");
        return;
      }

      // Check instance status
      if (instance.status !== 'connected') {
        console.warn(`[Campaign Queue] Instance ${job.instanceId} is not connected. Pausing campaign.`);
        await pauseCampaignDueToInstance(job.campaignId, jobDoc.ref, "Instância desconectada. Reconecte-a e retome a campanha.");
        return;
      }

      // 2. Check Daily Limit of instance
      const warmth = instance.warmth || { level: 'new', sentToday: 0 };
      const limitLevel = warmth.level || 'new';
      const maxDaily = getDailyLimit(limitLevel);
      const sentToday = warmth.sentToday || 0;

      if (sentToday >= maxDaily) {
        // Daily limit exceeded. Reschedule for tomorrow at 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        await updateDoc(jobDoc.ref, {
          status: 'pending',
          scheduledAt: Timestamp.fromDate(tomorrow),
          updatedAt: Timestamp.now(),
        });
        console.log(`[Campaign Queue] Daily limit reached on instance ${job.instanceId}. Rescheduled job for tomorrow.`);
        return;
      }

      // 3. Check global Opt-Out List before sending
      const optOutSnap = await getDocs(
        query(
          collection(db, 'optOutList'),
          where('companyId', '==', job.companyId),
          where('phone', '==', job.phone.replace(/\D/g, '')),
          where('active', '==', true)
        )
      );

      if (!optOutSnap.empty) {
        console.log(`[Campaign Queue] Skipping send to ${job.phone} because number is in Opt-Out list.`);
        
        await updateDoc(jobDoc.ref, {
          status: 'done',
          processedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          messageId: 'skipped_optout'
        });

        // Update campaign contact
        const contactRef = doc(db, 'campaigns', job.campaignId, 'contacts', job.contactId);
        await updateDoc(contactRef, {
          status: 'opted_out',
          optedOutAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Update campaign metrics
        await updateDoc(doc(db, 'campaigns', job.campaignId), {
          'metrics.optedOut': increment(1),
          'metrics.pending': increment(-1),
          updatedAt: Timestamp.now(),
        });

        // Check if finished
        await checkAndCompleteCampaign(job.campaignId);
        return;
      }

      // 4. Call Evolution API to dispatch the text message
      const rawApiUrl = instance.apiUrl || instance.url;
      const cleanUrl = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : '';
      const apiKey = instance.apiKey;
      const instanceName = instance.instanceName;

      if (!cleanUrl || !apiKey || !instanceName) {
        console.error(`[Campaign Queue] Missing connection variables for instance ${job.instanceId}`);
        await pauseCampaignDueToInstance(job.campaignId, jobDoc.ref, "Configurações de conexão incompletas na API.");
        return;
      }

      const response = await fetch(`${cleanUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: job.phone,
          text: job.personalizedText,
          delay: job.nativeDelayMs || 3000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Evolution API HTTP error ${response.status}: ${errText}`);
      }

      const result = await response.json();
      const apiMessageId = result?.key?.id || null;

      // 5. Complete Job successfully
      await updateDoc(jobDoc.ref, {
        status: 'done',
        processedAt: Timestamp.now(),
        messageId: apiMessageId,
        updatedAt: Timestamp.now(),
      });

      // Update contact
      const contactRef = doc(db, 'campaigns', job.campaignId, 'contacts', job.contactId);
      await updateDoc(contactRef, {
        status: 'sent',
        sentAt: Timestamp.now(),
        messageId: apiMessageId,
        updatedAt: Timestamp.now(),
      });

      // Increment campaign metrics
      await updateDoc(doc(db, 'campaigns', job.campaignId), {
        'metrics.sent': increment(1),
        'metrics.pending': increment(-1),
        updatedAt: Timestamp.now(),
      });

      // Increment instance counters
      if (instance.isSubdoc) {
        await updateDoc(instance.ref, {
          'whatsapp.warmth.sentToday': increment(1),
          'whatsapp.updatedAt': Timestamp.now(),
        });
      } else {
        await updateDoc(instance.ref, {
          'warmth.sentToday': increment(1),
          updatedAt: Timestamp.now(),
        });
      }

      console.log(`[Campaign Queue] Successfully sent message to ${job.phone} (job ${job.id})`);

      // Check if campaign is completed
      await checkAndCompleteCampaign(job.campaignId);

    } catch (err: any) {
      console.error("[Campaign Queue Error]", err);
      // Handle retry policy on failure
      const jobDoc = err.jobDoc || null;
      if (jobDoc) {
        const job = jobDoc.data();
        const attempts = (job.attempts || 0) + 1;
        const maxRetries = 2;

        if (attempts >= maxRetries) {
          // Desistir após 2 tentativas
          await updateDoc(jobDoc.ref, {
            status: 'failed',
            attempts,
            updatedAt: Timestamp.now(),
          });

          const contactRef = doc(db, 'campaigns', job.campaignId, 'contacts', job.contactId);
          await updateDoc(contactRef, {
            status: 'failed',
            failedAt: Timestamp.now(),
            failReason: err.message || 'Desconhecido',
            retries: attempts,
            updatedAt: Timestamp.now(),
          });

          await updateDoc(doc(db, 'campaigns', job.campaignId), {
            'metrics.failed': increment(1),
            'metrics.pending': increment(-1),
            updatedAt: Timestamp.now(),
          });

          await checkAndCompleteCampaign(job.campaignId);
        } else {
          // Tentar novamente em 10 minutos
          const retryAt = new Date(Date.now() + 10 * 60 * 1000);
          await updateDoc(jobDoc.ref, {
            status: 'pending',
            attempts,
            scheduledAt: Timestamp.fromDate(retryAt),
            updatedAt: Timestamp.now(),
          });
        }
      }
    }
  }, 60000); // 1 minute interval loop

  // 4. BACKGROUND TASK: Daily Counter Reset Check (Runs every 10 minutes)
  let lastResetDateString = new Date().toDateString();
  setInterval(async () => {
    try {
      const currentDateString = new Date().toDateString();
      if (currentDateString !== lastResetDateString) {
        console.log(`[Campaign Queue] Midnight occurred. Resetting daily counters across instances...`);
        
        // 1. Reset integrations collection counters
        const integrationsSnap = await getDocs(
          query(
            collection(db, 'integrations'),
            where('active', '==', true)
          )
        );

        const batch = writeBatch(db);
        for (const d of integrationsSnap.docs) {
          batch.update(d.ref, {
            'warmth.sentToday': 0,
            'warmth.lastResetAt': Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
        await batch.commit();

        // 2. Reset subdoc integrations in companies
        const companiesSnap = await getDocs(collection(db, 'companies'));
        for (const compDoc of companiesSnap.docs) {
          const configDocRef = doc(db, 'companies', compDoc.id, 'settings', 'integrations');
          const configSnap = await getDoc(configDocRef);
          if (configSnap.exists()) {
            const data = configSnap.data();
            if (data && data.whatsapp) {
              await updateDoc(configDocRef, {
                'whatsapp.warmth.sentToday': 0,
                'whatsapp.warmth.lastResetAt': Timestamp.now(),
                'whatsapp.updatedAt': Timestamp.now()
              });
            }
          }
        }

        lastResetDateString = currentDateString;
        console.log("[Campaign Queue] All instance daily warmth counters reset successfully.");
      }
    } catch (err) {
      console.error("[Daily Counter Reset Error]", err);
    }
  }, 600000); // 10 minutes interval loop
}

async function pauseCampaignDueToInstance(campaignId: string, jobRef: any, reason: string) {
  try {
    await updateDoc(jobRef, { status: 'pending', updatedAt: Timestamp.now() });
    await updateDoc(doc(db, 'campaigns', campaignId), {
      status: 'paused',
      pausedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      pauseReason: reason
    });
  } catch (err) {
    console.error("Error pausing campaign:", err);
  }
}

async function checkAndCompleteCampaign(campaignId: string) {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    const snap = await getDoc(campaignRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data && data.metrics && data.metrics.pending === 0) {
      await updateDoc(campaignRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`[Campaign Queue] Campaign ${campaignId} is completed successfully!`);
    }
  } catch (err) {
    console.error("Error checking campaign completion:", err);
  }
}
