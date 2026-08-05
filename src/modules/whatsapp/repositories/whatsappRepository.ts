import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Chat, Message, QuickResponse, Tag } from '../types';

export const whatsappRepository = {
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
    }, (err) => {
      console.error('Error listening to chats:', err);
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
    }, (err) => {
      console.error('Error listening to messages:', err);
    });
  },

  getChats: async (companyId: string): Promise<Chat[]> => {
    const q = query(
      collection(db, 'chats'),
      where('companyId', '==', companyId),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
  },

  createChat: async (chatData: Omit<Chat, 'id' | 'updatedAt'>) => {
    const ref = await addDoc(collection(db, 'chats'), {
      ...chatData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateChat: async (chatId: string, data: Partial<Chat>) => {
    const ref = doc(db, 'chats', chatId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  addMessage: async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const timestamp = serverTimestamp();
    const messageRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      timestamp,
    });

    // Update chat last message
    const chatRef = doc(db, 'chats', messageData.chatId);
    await updateDoc(chatRef, {
      lastMessage: {
        text: messageData.text || `[${messageData.type.toUpperCase()}]`,
        timestamp,
        type: messageData.type,
      },
      updatedAt: timestamp,
    });

    return messageRef.id;
  },

  markAsRead: async (chatId: string) => {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadCount: 0
    });
  },

  updateTags: async (chatId: string, tags: Tag[]) => {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      tags,
      updatedAt: serverTimestamp(),
    });
  },

  getQuickResponses: async (companyId: string): Promise<QuickResponse[]> => {
    const q = query(
      collection(db, 'companies', companyId, 'quickResponses')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as QuickResponse));
  },

  addQuickResponse: async (companyId: string, item: Omit<QuickResponse, 'id'>) => {
    const ref = doc(collection(db, 'companies', companyId, 'quickResponses'));
    await setDoc(ref, item);
  }
};
