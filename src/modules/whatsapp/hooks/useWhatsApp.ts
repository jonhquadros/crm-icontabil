import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { whatsappService } from '../services/whatsappService';
import { Chat, Message, MessageType, QuickResponse, Tag } from '../types';
import toast from 'react-hot-toast';
import { query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { notificationService } from '../services/notificationService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useWhatsApp() {
  const { userData, user } = useAuth();
  const queryClient = useQueryClient();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'waiting' | 'tags' | 'mine' | 'campaigns' | 'queue'>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'unread' | 'waiting' | 'assigned' | 'stage'>('recent');

  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageLimit, setMessageLimit] = useState(50);

  const companyId = userData?.companyId || '';

  // TanStack Query cache integration for chat, messages, and contact data
  const { data: cachedChats = [] } = useQuery({
    queryKey: ['chats', companyId],
    queryFn: () => chats,
    enabled: !!companyId,
    staleTime: 30000, // 30 seconds
  });

  const { data: cachedMessages = [] } = useQuery({
    queryKey: ['messages', activeChat?.id, messageLimit],
    queryFn: () => messages,
    enabled: !!activeChat?.id,
    staleTime: 5000, // 5 seconds
  });

  const { data: contactDetails } = useQuery({
    queryKey: ['contact', activeChat?.contactPhone],
    queryFn: () => {
      if (!activeChat) return null;
      return {
        phone: activeChat.contactPhone,
        name: activeChat.contactName,
        companyName: activeChat.companyName,
        email: activeChat.email,
        cpfCnpj: activeChat.cpfCnpj,
        notes: activeChat.notes,
        lastFetch: Date.now()
      };
    },
    enabled: !!activeChat?.contactPhone,
    staleTime: 300000, // 5 minutes
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term by 300ms (5.3)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [showSystemEvents, setShowSystemEvents] = useState(true);
  const [isContactTyping, setIsContactTyping] = useState(false);

  const typingTimeoutRef = useCallback(() => {
    let timer: any = null;
    return (callback: () => void) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(callback, 3000);
    };
  }, [])();

  const userName = userData?.name || user?.displayName || 'Atendente Contábil';

  // Request browser permission for push notifications on load
  useEffect(() => {
    notificationService.requestPushPermission();
  }, []);

  // Keep a reference to the latest chats array to map sender names without resubscribing
  const chatsRef = useRef<Chat[]>([]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // Keep a reference to the active chat ID to avoid notifying for messages in the currently open chat
  const activeChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeChatIdRef.current = activeChat?.id || null;
  }, [activeChat]);

  // Subscribe to new incoming messages for Real-Time notifications and sound chimes
  useEffect(() => {
    if (!companyId) return;

    const loadTime = Date.now();
    const processedMessageIds = new Set<string>();

    const q = query(
      collection(db, 'messages'),
      where('companyId', '==', companyId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Determine if this is the initial snapshot of already-existing messages
      const isInitial = snapshot.metadata.fromCache || processedMessageIds.size === 0;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const data = change.doc.data() as any;

          if (processedMessageIds.has(docId)) return;
          processedMessageIds.add(docId);

          if (isInitial) return;

          // Exclude messages sent by ourselves
          if (data.isFromMe) return;

          // Exclude messages belonging to the currently active chat
          if (data.chatId === activeChatIdRef.current) return;

          // Check if timestamp is reasonable (after the hook was mounted)
          const msgTime = data.timestamp?.toDate?.()?.getTime() || Date.now();
          if (msgTime < loadTime - 5000) return;

          // Find corresponding chat name for this chatId
          const parentChat = chatsRef.current.find(c => c.id === data.chatId);
          const senderName = parentChat?.contactName || data.senderName || 'Novo Contato';
          const messageText = data.text || `[${data.type?.toUpperCase() || 'MENSAGEM'}]`;

          // Trigger sound and notifications
          notificationService.notifyIncomingMessage(
            senderName,
            messageText,
            () => {
              if (parentChat) {
                setActiveChat(parentChat);
              }
            }
          );
        }
      });
    }, (err) => {
      console.error('Error listening to messages for notifications:', err);
    });

    return () => unsubscribe();
  }, [companyId]);

  const refreshQuickResponses = useCallback(() => {
    if (companyId) {
      whatsappService.getQuickResponses(companyId).then(setQuickResponses);
    }
  }, [companyId]);

  const handleUserTyping = () => {
    if (!activeChat) return;
    // Trigger presence composing via Evolution API
    import('../services/evolutionService').then(({ evolutionService }) => {
      evolutionService.sendPresence(companyId, activeChat.contactPhone, 'composing');
    });

    typingTimeoutRef(() => {
      import('../services/evolutionService').then(({ evolutionService }) => {
        evolutionService.sendPresence(companyId, activeChat.contactPhone, 'paused');
      });
    });
  };

  // Reset message limit when chat changes
  useEffect(() => {
    if (activeChat?.id) {
      setMessageLimit(50);
      setMessages([]); // Clear messages immediately for smooth skeletons
    }
  }, [activeChat?.id]);

  // Subscribe to Chats
  useEffect(() => {
    if (!companyId) return;

    setIsLoadingChats(true);
    const unsubscribe = whatsappService.subscribeToChats(companyId, (data) => {
      setChats(data);
      queryClient.setQueryData(['chats', companyId], data);
      setIsLoadingChats(false);
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
      }
    });

    whatsappService.getQuickResponses(companyId).then(setQuickResponses);

    return () => unsubscribe();
  }, [companyId, queryClient]);

  // Subscribe to Messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    setIsLoadingMessages(true);
    const unsubscribe = whatsappService.subscribeToMessages(activeChat.id, messageLimit, (data) => {
      setMessages(data);
      queryClient.setQueryData(['messages', activeChat.id, messageLimit], data);
      setIsLoadingMessages(false);
    });

    whatsappService.markAsRead(activeChat.id);

    return () => unsubscribe();
  }, [activeChat?.id, messageLimit, queryClient]);

  const loadMoreMessages = useCallback(() => {
    setMessageLimit(prev => prev + 50);
  }, []);

  // Audio recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecordingAudio) {
      interval = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  const handleSendMessage = async (textToSend?: string, type: MessageType = 'text', attachment?: any) => {
    const text = textToSend !== undefined ? textToSend : newMessage;
    if ((!text.trim() && !attachment) || !activeChat || !userData) return;

    const currentReply = replyingTo;
    setNewMessage('');
    setShowQuickPicker(false);
    setReplyingTo(null);

    try {
      await whatsappService.sendMessage(
        activeChat.id, 
        companyId, 
        {
          senderId: userData.id,
          senderName: userName,
          text,
          type,
          isFromMe: true,
          attachment,
          replyTo: currentReply ? {
            id: currentReply.id,
            senderName: currentReply.senderName,
            text: currentReply.text || (currentReply.attachment?.fileName || `[${currentReply.type.toUpperCase()}]`)
          } : undefined
        },
        activeChat.contactPhone
      );
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem: ' + err.message);
    }
  };

  const handleTogglePin = async (msg: Message) => {
    try {
      await whatsappService.togglePinMessage(msg.id, !!msg.isPinned, messages);
      toast.success(msg.isPinned ? 'Mensagem desafixada' : 'Mensagem fixada na conversa');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar estado de fixação.');
    }
  };

  const handleToggleStar = async (msg: Message) => {
    try {
      await whatsappService.toggleStarMessage(msg.id, !!msg.isStarred);
      toast.success(msg.isStarred ? 'Removido dos favoritos' : 'Marcado como importante');
    } catch (err: any) {
      toast.error('Erro ao marcar mensagem.');
    }
  };

  const handleAddReaction = async (msg: Message, emoji: string) => {
    try {
      await whatsappService.addReactionToMessage(msg.id, emoji, userName, msg.reactions || []);
    } catch (err: any) {
      toast.error('Erro ao adicionar reação.');
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    try {
      await whatsappService.deleteMessageForMe(msg.id);
      toast.success('Mensagem apagada.');
    } catch (err: any) {
      toast.error('Erro ao apagar mensagem.');
    }
  };

  const handleSendAttachment = async (type: MessageType, fileUrl: string, fileName: string) => {
    await handleSendMessage(fileName, type, {
      fileUrl,
      fileName,
      fileSize: '2.1 MB'
    });
  };

  const handleToggleTag = async (tag: Tag) => {
    if (!activeChat) return;
    const currentTags = activeChat.tags || [];
    const exists = currentTags.some(t => t.id === tag.id);
    
    let updatedTags: Tag[];
    if (exists) {
      updatedTags = currentTags.filter(t => t.id !== tag.id);
    } else {
      updatedTags = [...currentTags, tag];
    }

    try {
      await whatsappService.updateChatTags(activeChat.id, updatedTags);
      setActiveChat(prev => prev ? { ...prev, tags: updatedTags } : null);
      toast.success(exists ? 'Etiqueta removida' : 'Etiqueta adicionada');
    } catch (err) {
      toast.error('Erro ao atualizar etiqueta.');
    }
  };

  const handleStartAudioRecord = () => {
    setIsRecordingAudio(true);
  };

  const handleStopAndSendAudio = async () => {
    setIsRecordingAudio(false);
    await handleSendMessage('Áudio de Voz (00:08)', 'audio', {
      fileUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
      duration: recordingTimer || 8,
      fileName: 'mensagem_audio.ogg'
    });
    toast.success('Áudio de voz enviado!');
  };

  const handleCancelAudioRecord = () => {
    setIsRecordingAudio(false);
  };

  const handleTogglePinChat = async (chat: Chat) => {
    try {
      await whatsappService.togglePinChat(chat.id, !!chat.isPinned);
      toast.success(chat.isPinned ? 'Conversa desafixada' : 'Conversa fixada no topo');
    } catch {
      toast.error('Erro ao alterar fixação da conversa.');
    }
  };

  const handleToggleMuteChat = async (chat: Chat) => {
    try {
      await whatsappService.toggleMuteChat(chat.id, !!chat.isMuted);
      toast.success(chat.isMuted ? 'Notificações ativadas' : 'Conversa silenciada');
    } catch {
      toast.error('Erro ao alterar notificação.');
    }
  };

  const handleResolveChat = async (chat: Chat) => {
    try {
      await whatsappService.resolveChat(chat.id);
      toast.success('Conversa resolvida e finalizada');
    } catch {
      toast.error('Erro ao resolver conversa.');
    }
  };

  const handleAssignUser = async (chat: Chat, targetUser: string) => {
    try {
      const prevUser = chat.assignedUser || 'Fila';
      await whatsappService.assignUserToChat(chat.id, targetUser, companyId, {
        previousUser: prevUser,
        currentUser: userName
      });
      if (activeChat?.id === chat.id) {
        setActiveChat(prev => prev ? { ...prev, assignedUser: targetUser } : null);
      }
      toast.success(`Conversa atribuída a ${targetUser}`);
    } catch {
      toast.error('Erro ao atribuir responsável.');
    }
  };

  const handleAssumeChat = async (chat: Chat) => {
    await handleAssignUser(chat, userName);
  };

  const handleToggleTagForChat = async (chat: Chat, tag: Tag) => {
    const currentTags = chat.tags || [];
    const exists = currentTags.some(t => t.id === tag.id);
    const updatedTags = exists ? currentTags.filter(t => t.id !== tag.id) : [...currentTags, tag];

    try {
      await whatsappService.updateChatTags(chat.id, updatedTags);
      if (activeChat?.id === chat.id) {
        setActiveChat(prev => prev ? { ...prev, tags: updatedTags } : null);
      }
      toast.success(exists ? 'Etiqueta removida' : 'Etiqueta vinculada');
    } catch {
      toast.error('Erro ao atualizar etiqueta.');
    }
  };

  // 5.3 & 5.2 Filtering & 5.5 Sorting
  const filteredChats = chats
    .filter(chat => {
      // 5.3 Multi-field search query
      if (debouncedSearchTerm.trim()) {
        const term = debouncedSearchTerm.toLowerCase();
        const matchesName = chat.contactName.toLowerCase().includes(term);
        const matchesCompany = (chat.companyName || '').toLowerCase().includes(term);
        const matchesPhone = chat.contactPhone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const matchesCpfCnpj = (chat.cpfCnpj || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const matchesLastMsg = (chat.lastMessage?.text || '').toLowerCase().includes(term);
        const matchesTags = (chat.tags || []).some(t => t.name.toLowerCase().includes(term));

        if (!matchesName && !matchesCompany && !matchesPhone && !matchesCpfCnpj && !matchesLastMsg && !matchesTags) {
          return false;
        }
      }

      // 5.2 Filter tabs
      if (activeFilter === 'unread') return chat.unreadCount > 0;
      if (activeFilter === 'waiting') return chat.status === 'waiting';
      if (activeFilter === 'tags') return (chat.tags || []).length > 0;
      if (activeFilter === 'mine') {
        const currentUName = userName.toLowerCase();
        return (chat.assignedUser || '').toLowerCase().includes(currentUName) || currentUName.includes((chat.assignedUser || '').toLowerCase());
      }
      if (activeFilter === 'campaigns') return !!chat.campaignId;
      if (activeFilter === 'queue') {
        return !chat.assignedUser || chat.assignedUser === '' || chat.assignedUser === 'Fila' || chat.assignedUser === 'Sem Responsável';
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned chats always stay on top if sorting by recent
      if (sortOption === 'recent') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.updatedAt?.toDate?.() ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || 0).getTime();
        const timeB = b.updatedAt?.toDate?.() ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortOption === 'unread') {
        if (a.unreadCount !== b.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }
        const timeA = a.updatedAt?.toDate?.() ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || 0).getTime();
        const timeB = b.updatedAt?.toDate?.() ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortOption === 'waiting') {
        if (a.status === 'waiting' && b.status !== 'waiting') return -1;
        if (a.status !== 'waiting' && b.status === 'waiting') return 1;
        const timeA = a.updatedAt?.toDate?.() ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || 0).getTime();
        const timeB = b.updatedAt?.toDate?.() ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || 0).getTime();
        return timeA - timeB;
      }
      if (sortOption === 'assigned') {
        return (a.assignedUser || 'Z').localeCompare(b.assignedUser || 'Z');
      }
      if (sortOption === 'stage') {
        const tagA = a.tags?.[0]?.name || 'Z';
        const tagB = b.tags?.[0]?.name || 'Z';
        return tagA.localeCompare(tagB);
      }
      return 0;
    });

  return {
    chats: filteredChats,
    allChats: chats,
    activeChat,
    setActiveChat,
    messages,
    newMessage,
    setNewMessage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    activeFilter,
    setActiveFilter,
    sortOption,
    setSortOption,
    isInfoOpen,
    setIsInfoOpen,
    quickResponses,
    showQuickPicker,
    setShowQuickPicker,
    isRecordingAudio,
    recordingTimer,
    replyingTo,
    setReplyingTo,
    isSearchingMessages,
    setIsSearchingMessages,
    showSystemEvents,
    setShowSystemEvents,
    isContactTyping,
    setIsContactTyping,
    handleUserTyping,
    refreshQuickResponses,
    handleSendMessage,
    handleSendAttachment,
    handleToggleTag,
    handleToggleTagForChat,
    handleStartAudioRecord,
    handleStopAndSendAudio,
    handleCancelAudioRecord,
    handleTogglePin,
    handleToggleStar,
    handleAddReaction,
    handleDeleteMessage,
    handleTogglePinChat,
    handleToggleMuteChat,
    handleResolveChat,
    handleAssignUser,
    handleAssumeChat,
    queueCount: chats.filter(c => !c.assignedUser || c.assignedUser === '' || c.assignedUser === 'Fila' || c.assignedUser === 'Sem Responsável').length,
    currentUser: userName,
    isLoadingChats,
    isLoadingMessages,
    loadMoreMessages,
    messageLimit
  };
}
