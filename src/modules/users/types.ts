import { Timestamp } from 'firebase/firestore';

export type UserRole = 'global_admin' | 'admin' | 'operator' | 'viewer';

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export?: boolean;
  import?: boolean;
  admin?: boolean;
}

export interface UserPermissions {
  dashboard: ModulePermissions;
  clients: ModulePermissions;
  kanban: ModulePermissions;
  whatsapp: ModulePermissions;
  calendar: ModulePermissions;
  documents: ModulePermissions;
  tasks: ModulePermissions;
  reports: ModulePermissions;
  users: ModulePermissions;
}

export interface AppUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions?: UserPermissions;
  status: 'active' | 'inactive' | 'pending';
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: { view: true, create: false, edit: false, delete: false },
  clients: { view: true, create: true, edit: true, delete: false },
  kanban: { view: true, create: true, edit: true, delete: true },
  whatsapp: { view: true, create: true, edit: true, delete: false },
  calendar: { view: true, create: true, edit: true, delete: true },
  documents: { view: true, create: true, edit: true, delete: false },
  tasks: { view: true, create: true, edit: true, delete: true },
  reports: { view: true, create: false, edit: false, delete: false },
  users: { view: false, create: false, edit: false, delete: false },
};
