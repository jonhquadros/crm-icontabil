import { Timestamp } from 'firebase/firestore';

export type MessageType = 'text' | 'image' | 'audio' | 'document';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  companyId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: MessageType;
  fileUrl?: string;
  status: MessageStatus;
  isFromMe: boolean;
  timestamp: Timestamp;
}

export interface Chat {
  id: string;
  companyId: string;
  clientId?: string;
  contactName: string;
  contactPhone: string;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
  };
  unreadCount: number;
  status: 'active' | 'archived';
  avatarUrl?: string;
  updatedAt: Timestamp;
}
