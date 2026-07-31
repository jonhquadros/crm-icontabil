import { Timestamp } from 'firebase/firestore';

export type TaxRegime = 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
export type ClientStatus = 'lead' | 'active' | 'inactive' | 'blocked';
export type ClientType = 'PJ' | 'PF';

export interface Client {
  id: string;
  companyId: string;
  type: ClientType;
  taxRegime: TaxRegime;
  name: string;
  companyName?: string;
  document: string; // CNPJ or CPF
  phone: string;
  whatsapp?: string;
  email: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  responsible: string;
  status: ClientStatus;
  observations?: string;
  kanbanCardId?: string;
  tags?: string[];
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface PipelineColumn {
  id: string; // The same as KanbanColumn used to be, or a custom string
  label: string;
  color: string;
  order: number;
}

export interface Pipeline {
  id: string;
  companyId: string;
  name: string;
  isDefault?: boolean;
  columns: PipelineColumn[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type KanbanColumn = 'lead' | 'contact' | 'meeting' | 'proposal' | 'closing' | 'won' | 'lost' | string;

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: any;
  completedBy?: string;
}

export interface NoteItem {
  id: string;
  text: string;
  author: string;
  createdAt: any;
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'stage_change' | 'message' | 'document' | 'task' | 'note' | 'responsible_change' | 'checklist' | 'system';
  title: string;
  description: string;
  author: string;
  createdAt: any;
  meta?: any;
}

export interface KanbanCard {
  id: string;
  companyId: string;
  pipelineId?: string; // Phase 05: Added pipelineId
  clientName: string;
  companyName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  document?: string;
  clientType?: 'PF' | 'PJ' | 'MEI';
  taxRegime?: TaxRegime;
  address?: string | {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  responsible: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  origin: string; // e.g. "Google", "Indicação"
  stuckSince?: Timestamp;
  lastInteraction?: Timestamp;
  labels: string[];
  column: KanbanColumn;
  position: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  // Counters for CRM features (Phase 03)
  messagesCount?: number;
  documentsCount?: number;
  tasksCount?: number;
  tasksCompleted?: number;
  notesCount?: number;
  // Extended fields (Phase 04)
  checklist?: ChecklistItem[];
  notesList?: NoteItem[];
  timeline?: TimelineEvent[];
  value?: number;
}
