import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Chat, Message } from '../types';

export const whatsappService = {
  subscribeToChats: (companyId: string, callback: (chats: Chat[]) => void) => {
    const q = query(
      collection(db, 'chats'),
      where('companyId', '==', companyId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      callback(chats);
    });
  },

  subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void) => {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages);
    });
  },

  sendMessage: async (chatId: string, companyId: string, messageData: Omit<Message, 'id' | 'timestamp' | 'status' | 'chatId' | 'companyId'>) => {
    const timestamp = serverTimestamp();
    
    // Add message
    const messageRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      chatId,
      companyId,
      status: 'sent',
      timestamp,
    });

    // Update chat last message
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        text: messageData.text,
        timestamp,
      },
      updatedAt: timestamp,
    });

    return messageRef;
  },

  markAsRead: async (chatId: string) => {
    const chatRef = doc(db, 'chats', chatId);
    return updateDoc(chatRef, {
      unreadCount: 0
    });
  }
};
