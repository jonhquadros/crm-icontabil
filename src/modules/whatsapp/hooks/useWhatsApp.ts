import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { whatsappService } from '../services/whatsappService';
import { Chat, Message, MessageType, QuickResponse, Tag } from '../types';
import toast from 'react-hot-toast';

export function useWhatsApp() {
  const { userData, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'waiting' | 'tags'>('all');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);

  const companyId = userData?.companyId || '';
  const userName = userData?.name || user?.displayName || 'Atendente Contábil';

  // Subscribe to Chats
  useEffect(() => {
    if (!companyId) return;

    const unsubscribe = whatsappService.subscribeToChats(companyId, (data) => {
      setChats(data);
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
      }
    });

    whatsappService.getQuickResponses(companyId).then(setQuickResponses);

    return () => unsubscribe();
  }, [companyId]);

  // Subscribe to Messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    const unsubscribe = whatsappService.subscribeToMessages(activeChat.id, (data) => {
      setMessages(data);
    });

    whatsappService.markAsRead(activeChat.id);

    return () => unsubscribe();
  }, [activeChat?.id]);

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

    setNewMessage('');
    setShowQuickPicker(false);

    try {
      await whatsappService.sendMessage(activeChat.id, companyId, {
        senderId: userData.id,
        senderName: userName,
        text,
        type,
        isFromMe: true,
        attachment
      });
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem: ' + err.message);
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

  // Filtering
  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.contactPhone.includes(searchTerm) ||
      (chat.companyName && chat.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') return chat.unreadCount > 0;
    if (activeFilter === 'waiting') return chat.status === 'waiting';
    if (activeFilter === 'tags') return (chat.tags || []).length > 0;

    return true;
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
    activeFilter,
    setActiveFilter,
    isInfoOpen,
    setIsInfoOpen,
    quickResponses,
    showQuickPicker,
    setShowQuickPicker,
    isRecordingAudio,
    recordingTimer,
    handleSendMessage,
    handleSendAttachment,
    handleToggleTag,
    handleStartAudioRecord,
    handleStopAndSendAudio,
    handleCancelAudioRecord
  };
}
