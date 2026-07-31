export interface BaseDocument {
  id: string;
  companyId: string;
  active: boolean;
  createdAt: any; // Using any for Firebase Timestamp compatibility
  updatedAt: any;
  createdBy: string;
  updatedBy: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}
