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

export type KanbanColumn = 'lead' | 'contact' | 'meeting' | 'proposal' | 'closing' | 'won' | 'lost';

export interface KanbanCard {
  id: string;
  companyId: string;
  clientName: string;
  companyName?: string;
  phone: string;
  whatsapp?: string;
  responsible: string;
  priority: 'low' | 'medium' | 'high';
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
}
