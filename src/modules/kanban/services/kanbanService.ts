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
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { KanbanCard, KanbanColumn, Pipeline, ChecklistItem, NoteItem, TimelineEvent } from '../../clients/types';

export const kanbanService = {
  subscribeToPipelines: (companyId: string, callback: (pipelines: Pipeline[]) => void) => {
    const q = query(
      collection(db, 'pipelines'),
      where('companyId', '==', companyId)
    );

    return onSnapshot(q, (snapshot) => {
      const pipelines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pipeline[];
      
      callback(pipelines);
    });
  },

  createPipeline: async (pipeline: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addDoc(collection(db, 'pipelines'), {
      ...pipeline,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  subscribeToCards: (companyId: string, pipelineId: string | null, callback: (cards: KanbanCard[]) => void) => {
    let q = query(
      collection(db, 'kanban'),
      where('companyId', '==', companyId),
      where('active', '==', true)
    );

    if (pipelineId) {
      q = query(q, where('pipelineId', '==', pipelineId));
    }

    // Sort client-side if we can't do it server-side with multiple wheres
    return onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KanbanCard[];
      
      // Sort by position ascending
      cards.sort((a, b) => (a.position || 0) - (b.position || 0));
      
      callback(cards);
    });
  },

  updateCardPosition: async (cardId: string, newColumn: KanbanColumn, newPosition: number) => {
    const cardRef = doc(db, 'kanban', cardId);
    return updateDoc(cardRef, {
      column: newColumn,
      position: newPosition,
      updatedAt: serverTimestamp(),
      stuckSince: serverTimestamp(),
      lastInteraction: serverTimestamp(),
    });
  },

  updateCard: async (cardId: string, data: Partial<KanbanCard>) => {
    const cardRef = doc(db, 'kanban', cardId);
    return updateDoc(cardRef, {
      ...data,
      updatedAt: serverTimestamp(),
      lastInteraction: serverTimestamp(),
    });
  },

  deleteCard: async (cardId: string) => {
    const cardRef = doc(db, 'kanban', cardId);
    return deleteDoc(cardRef);
  },

  addTimelineEvent: async (cardId: string, event: Omit<TimelineEvent, 'id' | 'createdAt'>, existingTimeline: TimelineEvent[] = []) => {
    const cardRef = doc(db, 'kanban', cardId);
    const newEvent: TimelineEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...event,
      createdAt: new Date().toISOString(),
    };

    const updatedTimeline = [newEvent, ...existingTimeline];

    return updateDoc(cardRef, {
      timeline: updatedTimeline,
      lastInteraction: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  updateChecklist: async (cardId: string, checklist: ChecklistItem[]) => {
    const cardRef = doc(db, 'kanban', cardId);
    return updateDoc(cardRef, {
      checklist,
      lastInteraction: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  addNote: async (cardId: string, text: string, author: string, existingNotes: NoteItem[] = []) => {
    const cardRef = doc(db, 'kanban', cardId);
    const newNote: NoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text,
      author,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...existingNotes];

    return updateDoc(cardRef, {
      notesList: updatedNotes,
      notesCount: updatedNotes.length,
      lastInteraction: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Create new Kanban Card
  createCard: async (card: Omit<KanbanCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addDoc(collection(db, 'kanban'), {
      ...card,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stuckSince: serverTimestamp(),
      lastInteraction: serverTimestamp(),
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
