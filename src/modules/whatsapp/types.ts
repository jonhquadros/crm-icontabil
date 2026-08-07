import { Timestamp } from 'firebase/firestore';

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'pdf' 
  | 'document' 
  | 'location' 
  | 'contact' 
  | 'sticker'
  | 'system';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface Tag {
  id: string;
  name: string;
  color: string; // e.g. '#3b82f6' or tailwind color
}

export interface AttachmentData {
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video in seconds
  latitude?: number;
  longitude?: number;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface MessageReaction {
  emoji: string;
  senderName: string;
}

export interface MessageReplyContext {
  id: string;
  senderName: string;
  text: string;
}

export interface Message {
  id: string;
  companyId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: MessageType;
  status: MessageStatus;
  isFromMe: boolean;
  timestamp: any; // Timestamp or Date
  attachment?: AttachmentData;
  isPinned?: boolean;
  isStarred?: boolean;
  reactions?: MessageReaction[];
  replyTo?: MessageReplyContext;
  isSystemEvent?: boolean;
  systemEventType?: 'card_moved' | 'task_completed' | 'document_sent' | 'general';
}

export interface ChatFilterTab {
  id: 'all' | 'unread' | 'waiting' | 'tags' | 'mine' | 'campaigns' | 'queue';
  label: string;
}

export interface Chat {
  id: string;
  companyId: string;
  clientId?: string;
  contactName: string;
  contactPhone: string;
  cpfCnpj?: string;
  avatarUrl?: string;
  lastMessage?: {
    text: string;
    timestamp: any;
    type?: MessageType;
  };
  unreadCount: number;
  status: 'active' | 'archived' | 'waiting';
  tags?: Tag[];
  email?: string;
  companyName?: string;
  notes?: string;
  assignedUser?: string;
  assignedUserId?: string;
  assignedUserAvatar?: string;
  openTasksCount?: number;
  pendingDocsCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  campaignId?: string;
  crmStage?: string;
  updatedAt: any;
  createdAt?: any;
}

export interface QuickResponse {
  id: string;
  shortcut: string; // e.g. "/saudacao"
  title: string;
  content: string;
}

export interface EvolutionConfig {
  id?: string;
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  webhookUrl: string;
  connectedPhone: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code' | 'error';
  qrCodeUrl?: string;
  lastConnectedAt?: string;
  updatedAt?: any;
}
