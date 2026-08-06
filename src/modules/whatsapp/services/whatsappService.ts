import { Chat, Message, QuickResponse, Tag } from '../types';
import { whatsappRepository } from '../repositories/whatsappRepository';
import { evolutionService } from './evolutionService';

const DEMO_CHATS: Omit<Chat, 'id' | 'updatedAt'>[] = [
  {
    companyId: '',
    contactName: 'Carlos Eduardo (Silva & Santos Adv)',
    contactPhone: '(91) 98112-3344',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    unreadCount: 2,
    status: 'active',
    email: 'carlos@silvasantos.adv.br',
    companyName: 'Silva & Santos Advogados',
    notes: 'Interessado em migração de regime tributário para Lucro Presumido.',
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
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    unreadCount: 0,
    status: 'active',
    email: 'mariana@clinicalume.com.br',
    companyName: 'Clínica Lume Médica',
    notes: 'Cliente recorrente. Dúvidas sobre pró-labore dos sócios.',
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
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    unreadCount: 1,
    status: 'waiting',
    email: 'roberto@techsoft.com',
    companyName: 'TechSoft Soluções',
    notes: 'Aguardando envio do contrato assinado.',
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
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    unreadCount: 0,
    status: 'active',
    email: 'juliana@sabor.com.br',
    companyName: 'Restaurante Sabor Pará',
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
    shortcut: '/saudacao',
    title: 'Saudação Inicial',
    content: 'Olá! Sou do atendimento iContábil CRM. Como posso ajudar com a contabilidade da sua empresa hoje?'
  },
  {
    shortcut: '/documentos',
    title: 'Solicitar Documentos',
    content: 'Para dar andamento ao seu contrato, precisamos do Contrato Social, Cartão CNPJ e documentos dos sócios.'
  },
  {
    shortcut: '/reuniao',
    title: 'Link de Agendamento',
    content: 'Você pode escolher o melhor horário para nossa reunião através da nossa agenda online: https://icontabil.com.br/agenda'
  },
  {
    shortcut: '/boleto',
    title: 'Envio de 2ª via de Honorários',
    content: 'Segue o link da 2ª via atualizada do seu boleto de honorários contábeis.'
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

  subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void) => {
    return whatsappRepository.subscribeToMessages(chatId, async (messages) => {
      if (messages.length === 0 && chatId) {
        await whatsappService.seedDemoMessages(chatId);
      } else {
        callback(messages);
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
      attachment: messageData.attachment
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
          text: 'Olá! Sou o consultor responsável pelo iContábil CRM.',
          type: 'text' as const,
          isFromMe: true,
          status: 'read' as const,
        },
        {
          text: 'Boa tarde! Gostaria de solicitar o envio do relatório de faturamento do último trimestre.',
          type: 'text' as const,
          isFromMe: false,
          status: 'read' as const,
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
