import { Timestamp } from 'firebase/firestore';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: any;
  assignedTo?: any; // string or array of user IDs
  category?: string;
  clientId?: string;
  active: boolean;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}
