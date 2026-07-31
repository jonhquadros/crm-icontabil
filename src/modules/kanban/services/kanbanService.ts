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
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { KanbanCard, KanbanColumn } from '../../clients/types';

export const kanbanService = {
  subscribeToCards: (companyId: string, callback: (cards: KanbanCard[]) => void) => {
    const q = query(
      collection(db, 'kanban'),
      where('companyId', '==', companyId),
      where('active', '==', true),
      orderBy('position', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KanbanCard[];
      callback(cards);
    });
  },

  updateCardPosition: async (cardId: string, newColumn: KanbanColumn, newPosition: number) => {
    const cardRef = doc(db, 'kanban', cardId);
    return updateDoc(cardRef, {
      column: newColumn,
      position: newPosition,
      updatedAt: serverTimestamp(),
    });
  },

  // Batch update for reordering multiple cards
  reorderCards: async (updates: { id: string, position: number, column?: KanbanColumn }[]) => {
    const batch = writeBatch(db);
    updates.forEach(({ id, position, column }) => {
      const ref = doc(db, 'kanban', id);
      const updateData: any = { position, updatedAt: serverTimestamp() };
      if (column) updateData.column = column;
      batch.update(ref, updateData);
    });
    return batch.commit();
  }
};
