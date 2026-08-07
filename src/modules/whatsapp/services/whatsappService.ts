import { Chat, Message, QuickResponse, Tag } from '../types';
import { whatsappRepository } from '../repositories/whatsappRepository';
import { evolutionService } from './evolutionService';

const DEMO_CHATS: Omit<Chat, 'id' | 'updatedAt'>[] = [
  {
    companyId: '',
    contactName: 'Carlos Eduardo (Silva & Santos Adv)',
    contactPhone: '(91) 98112-3344',
    cpfCnpj: '12.345.678/0001-90',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    unreadCount: 2,
    status: 'active',
    email: 'carlos@silvasantos.adv.br',
    companyName: 'Silva & Santos Advogados',
    notes: 'Interessado em migração de regime tributário para Lucro Presumido.',
    assignedUser: 'Atendente Contábil',
    openTasksCount: 2,
    pendingDocsCount: 1,
    isPinned: true,
    tags: [
      { id: '1', name: 'Prospect', color: 'bg-blue-500 text-white' },
      { id: '2', name: 'Lucro Presumido', color: 'bg-purple-500 text-white' }
    ],
    lastMessage: {
      text: 'Olá! Gostaria de confirmar a reunião de amanhã sobre o balancete.',
      timestamp: new Date()
    }
  },
  {
    companyId: '',
    contactName: 'Dra. Mariana Costa (Clínica Lume)',
    contactPhone: '(91) 98223-4455',
    cpfCnpj: '98.765.432/0001-11',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    unreadCount: 0,
    status: 'active',
    email: 'mariana@clinicalume.com.br',
    companyName: 'Clínica Lume Médica',
    notes: 'Cliente recorrente. Dúvidas sobre pró-labore dos sócios.',
    assignedUser: 'Mariana Costa',
    openTasksCount: 0,
    pendingDocsCount: 2,
    isPinned: false,
    campaignId: 'campanha_prospeccao_2026',
    tags: [
      { id: '3', name: 'Cliente Ativo', color: 'bg-emerald-500 text-white' },
      { id: '4', name: 'VIP', color: 'bg-amber-500 text-white' }
    ],
    lastMessage: {
      text: 'Segue em anexo o comprovante de pagamento dos impostos do mês.',
      timestamp: new Date()
    }
  },
  {
    companyId: '',
    contactName: 'Roberto Mendes (TechSoft)',
    contactPhone: '(91) 98334-5566',
    cpfCnpj: '45.123.789/0001-22',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    unreadCount: 1,
    status: 'waiting',
    email: 'roberto@techsoft.com',
    companyName: 'TechSoft Soluções',
    notes: 'Aguardando envio do contrato assinado.',
    assignedUser: 'Carlos Eduardo',
    openTasksCount: 1,
    pendingDocsCount: 3,
    isPinned: false,
    tags: [
      { id: '5', name: 'Aguardando Doc', color: 'bg-orange-500 text-white' }
    ],
    lastMessage: {
      text: 'Poderiam refazer o cálculo da folha de pagamento referente a Julho?',
      timestamp: new Date()
    }
  },
  {
    companyId: '',
    contactName: 'Juliana Paes (Restaurante Sabor)',
    contactPhone: '(91) 98445-6677',
    cpfCnpj: '67.890.123/0001-33',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    unreadCount: 0,
    status: 'active',
    email: 'juliana@sabor.com.br',
    companyName: 'Restaurante Sabor Pará',
    assignedUser: 'Felipe Santos',
    openTasksCount: 0,
    pendingDocsCount: 0,
    isPinned: false,
    campaignId: 'campanha_abertura_mei',
    tags: [
      { id: '1', name: 'Prospect', color: 'bg-blue-500 text-white' }
    ],
    lastMessage: {
      text: 'Obrigada pelas orientações fiscais!',
      timestamp: new Date()
    }
  }
];

const DEFAULT_QUICK_RESPONSES: Omit<QuickResponse, 'id'>[] = [
  {
    shortcut: '/oi',
    title: 'Boas-vindas / Saudação',
    content: 'Olá {{nome}}! Seja bem-vindo ao iContábil CRM. Como podemos ajudar com a gestão da empresa {{empresa}} hoje?'
  },
  {
    shortcut: '/docs',
    title: 'Lista de Documentos Necessários',
    content: 'Prezado(a) {{nome}}, para dar andamento ao seu atendimento, solicitamos o envio dos seguintes documentos: Contrato Social, Cartão CNPJ e comprovante de endereço.'
  },
  {
    shortcut: '/prazo',
    title: 'Aviso de Prazo de Impostos',
    content: 'Aviso de prazo: {{nome}}, os impostos e obrigações da empresa {{empresa}} vencem em breve. Se precisar da 2ª via das guias, solicite por aqui.'
  },
  {
    shortcut: '/aguarde',
    title: 'Verificando com equipe fiscal',
    content: 'Aguarde um momento, {{nome}}, nossa equipe técnica contábil já está verificando as informações solicitadas.'
  },
  {
    shortcut: '/obrigado',
    title: 'Agradecimento pelo contato',
    content: 'Muito obrigado pelo contato, {{nome}}! Seguimos à disposição da empresa {{empresa}}.'
  },
  {
    shortcut: '/reuniao',
    title: 'Agendamento de Reunião',
    content: 'Olá {{nome}}, você pode agendar uma reunião online no horário mais conveniente através do link: https://icontabil.com.br/agenda'
  },
  {
    shortcut: '/boleto',
    title: '2ª Via de Honorários',
    content: 'Prezado(a) {{nome}}, segue o link para emissão da 2ª via atualizada do boleto de honorários: https://icontabil.com.br/segunda-via'
  },
  // Campaign Templates (/c)
  {
    shortcut: '/c prospecção',
    title: 'Campanha: Prospecção MEI',
    content: 'Olá {{nome}}! Vi que você possui registro MEI para a empresa {{empresa}}. Sabia que ao estourar o limite você pode pagar multas? Faça uma consultoria de migração gratuita com o iContábil!'
  },
  {
    shortcut: '/c abertura',
    title: 'Campanha: Abertura de Empresa',
    content: 'Olá {{nome}}! Planejando abrir uma nova empresa? No iContábil cuidamos de todo o processo de abertura com isenção da 1ª mensalidade de honorários!'
  },
  {
    shortcut: '/c troca',
    title: 'Campanha: Troca de Contador',
    content: 'Prezado(a) {{nome}}, insatisfeito com o atendimento da sua contabilidade atual? Na iContábil realizamos a migração sem burocracia nem interrupção nas operações da {{empresa}}.'
  }
];

export const whatsappService = {
  subscribeToChats: (companyId: string, callback: (chats: Chat[]) => void) => {
    return whatsappRepository.subscribeToChats(companyId, async (chats) => {
      // If no chats exist for this company, auto-seed demo chats
      if (chats.length === 0 && companyId) {
        await whatsappService.seedDemoData(companyId);
      } else {
        callback(chats);
      }
    });
  },

  subscribeToMessages: (chatId: string, limitCount: number, callback: (messages: Message[]) => void) => {
    return whatsappRepository.subscribeToMessages(chatId, limitCount, async (messages) => {
      if (messages.length === 0 && chatId) {
        await whatsappService.seedDemoMessages(chatId);
      } else {
        // Sort ascending chronologically
        const sorted = [...messages].sort((a, b) => {
          const t1 = a.timestamp?.toDate?.()?.getTime() || new Date(a.timestamp || 0).getTime();
          const t2 = b.timestamp?.toDate?.()?.getTime() || new Date(b.timestamp || 0).getTime();
          return t1 - t2;
        });
        callback(sorted);
      }
    });
  },

  sendMessage: async (
    chatId: string, 
    companyId: string, 
    messageData: {
      senderId: string;
      senderName: string;
      text: string;
      type: Message['type'];
      isFromMe: boolean;
      attachment?: Message['attachment'];
      replyTo?: Message['replyTo'];
    },
    contactPhone?: string
  ) => {
    const messageId = await whatsappRepository.addMessage({
      chatId,
      companyId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      text: messageData.text,
      type: messageData.type,
      status: 'sent',
      isFromMe: messageData.isFromMe,
      attachment: messageData.attachment,
      replyTo: messageData.replyTo
    });

    if (messageData.isFromMe && contactPhone && companyId && messageData.text) {
      evolutionService.sendTextMessage(companyId, contactPhone, messageData.text).catch((err) => {
        console.warn('Erro ao disparar mensagem via Evolution API:', err);
      });
    }

    return messageId;
  },

  markAsRead: async (chatId: string) => {
    await whatsappRepository.markAsRead(chatId);
  },

  updateChatTags: async (chatId: string, tags: Tag[]) => {
    await whatsappRepository.updateTags(chatId, tags);
  },

  togglePinChat: async (chatId: string, isPinned: boolean) => {
    await whatsappRepository.updateChat(chatId, { isPinned: !isPinned });
  },

  toggleMuteChat: async (chatId: string, isMuted: boolean) => {
    await whatsappRepository.updateChat(chatId, { isMuted: !isMuted });
  },

  resolveChat: async (chatId: string) => {
    await whatsappRepository.updateChat(chatId, { status: 'archived', unreadCount: 0 });
  },

  assignUserToChat: async (
    chatId: string, 
    assignedUser: string, 
    companyId?: string, 
    transferDetails?: { previousUser?: string; currentUser?: string }
  ) => {
    await whatsappRepository.updateChat(chatId, { assignedUser });

    if (companyId) {
      const prev = transferDetails?.previousUser || 'Fila';
      const actor = transferDetails?.currentUser || 'Sistema';
      const text = `Conversa transferida de ${prev} para ${assignedUser} por ${actor}`;

      await whatsappRepository.addMessage({
        chatId,
        companyId,
        senderId: 'system',
        senderName: 'Sistema',
        text,
        type: 'system',
        status: 'sent',
        isFromMe: false,
        isSystemEvent: true,
        systemEventType: 'general'
      }).catch(() => {});
    }
  },

  togglePinMessage: async (messageId: string, isPinned: boolean, messages: Message[]) => {
    if (!isPinned) {
      // Pinning: check if already 3 pinned messages
      const pinnedCount = messages.filter(m => m.isPinned).length;
      if (pinnedCount >= 3) {
        throw new Error('Você só pode fixar até 3 mensagens simultaneamente.');
      }
    }
    await whatsappRepository.updateMessage(messageId, { isPinned: !isPinned });
  },

  toggleStarMessage: async (messageId: string, isStarred: boolean) => {
    await whatsappRepository.updateMessage(messageId, { isStarred: !isStarred });
  },

  addReactionToMessage: async (messageId: string, emoji: string, senderName: string, existingReactions: Message['reactions'] = []) => {
    // If same user already reacted with this emoji, toggle it off; otherwise add or update
    const filtered = existingReactions.filter(r => !(r.senderName === senderName && r.emoji === emoji));
    if (filtered.length === existingReactions.length) {
      // Add reaction
      filtered.push({ emoji, senderName });
    }
    await whatsappRepository.updateMessage(messageId, { reactions: filtered });
  },

  deleteMessageForMe: async (messageId: string) => {
    await whatsappRepository.deleteMessage(messageId);
  },

  getQuickResponses: async (companyId: string): Promise<QuickResponse[]> => {
    let responses = await whatsappRepository.getQuickResponses(companyId);
    if (responses.length === 0 && companyId) {
      for (const item of DEFAULT_QUICK_RESPONSES) {
        await whatsappRepository.addQuickResponse(companyId, item);
      }
      responses = await whatsappRepository.getQuickResponses(companyId);
    }
    return responses;
  },

  createQuickResponse: async (companyId: string, item: Omit<QuickResponse, 'id'>) => {
    await whatsappRepository.addQuickResponse(companyId, item);
  },

  seedDemoData: async (companyId: string) => {
    try {
      for (const chat of DEMO_CHATS) {
        const chatId = await whatsappRepository.createChat({
          ...chat,
          companyId
        });
        await whatsappService.seedDemoMessages(chatId);
      }
    } catch (err) {
      console.error('Error seeding demo chats:', err);
    }
  },

  seedDemoMessages: async (chatId: string) => {
    try {
      const demoMsgs = [
        {
          text: 'Olá! Sou o consultor responsável pelo atendimento iContábil CRM.',
          type: 'text' as const,
          isFromMe: true,
          status: 'read' as const,
        },
        {
          text: '🔄 Card movido para "Documentação Pendente"',
          type: 'text' as const,
          isFromMe: false,
          status: 'read' as const,
          isSystemEvent: true,
          systemEventType: 'card_moved' as const,
        },
        {
          text: 'Boa tarde! Gostaria de solicitar o envio do relatório de faturamento do último trimestre.',
          type: 'text' as const,
          isFromMe: false,
          status: 'read' as const,
        },
        {
          text: 'Aguardando envio do contrato social assinado e balancete.',
          type: 'text' as const,
          isFromMe: true,
          status: 'read' as const,
          isPinned: true,
        },
        {
          text: '✅ Tarefa "Enviar DASN / DEFIS de 2026" marcada como concluída',
          type: 'text' as const,
          isFromMe: false,
          status: 'read' as const,
          isSystemEvent: true,
          systemEventType: 'task_completed' as const,
        },
        {
          text: 'Claro! Vou gerar o relatório agora mesmo e já te envio o documento em PDF.',
          type: 'text' as const,
          isFromMe: true,
          status: 'read' as const,
        },
        {
          text: 'Relatorio_Faturamento_Q2_2026.pdf',
          type: 'pdf' as const,
          isFromMe: true,
          status: 'read' as const,
          attachment: {
            fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            fileName: 'Relatorio_Faturamento_Q2_2026.pdf',
            fileSize: '1.4 MB'
          }
        },
        {
          text: '📁 Documento "Contrato_Social_2026.pdf" enviado via CRM',
          type: 'text' as const,
          isFromMe: false,
          status: 'read' as const,
          isSystemEvent: true,
          systemEventType: 'document_sent' as const,
        },
        {
          text: 'Excelente! Muito obrigado pela agilidade.',
          type: 'text' as const,
          isFromMe: false,
          status: 'read' as const,
        }
      ];

      for (const msg of demoMsgs) {
        await whatsappRepository.addMessage({
          chatId,
          companyId: '',
          senderId: msg.isFromMe ? 'agent-1' : 'contact-1',
          senderName: msg.isFromMe ? 'Consultor Contábil' : 'Cliente',
          ...msg
        });
      }
    } catch (err) {
      console.error('Error seeding demo messages:', err);
    }
  }
};
