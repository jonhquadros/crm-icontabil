import { Timestamp } from 'firebase/firestore';

export type FileCategory = 'invoice' | 'contract' | 'receipt' | 'tax' | 'other';

export interface DocumentFolder {
  id: string;
  companyId: string;
  parentId: string | null; // null for root
  name: string;
  path: string; // e.g. "/Contratos"
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentFile {
  id: string;
  companyId: string;
  folderId: string | null;
  name: string;
  size: number;
  type: string; // mime type
  url: string;
  category: FileCategory;
  clientId?: string; // Optional link to a client
  uploadedBy: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
