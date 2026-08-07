export interface CompanyProfile {
  id?: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface SecuritySettings {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  twoFactor: boolean;
  sessionTimeout: string;
}

export interface NotificationSettings {
  emailOpportunities: boolean;
  emailTasks: boolean;
  emailReports: boolean;
  whatsappStatus: boolean;
  whatsappReminders: boolean;
  pushChat: boolean;
  soundNotifications?: boolean;
}

export interface PersonalizationSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: 'blue' | 'emerald' | 'indigo' | 'amber' | 'coral';
  sidebarStyle?: 'default' | 'compact';
}

export interface WhatsAppIntegration {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastConnectedAt?: string;
}

export interface GoogleIntegration {
  enabled: boolean;
  calendarSync: boolean;
  driveSync: boolean;
  connectedAccount?: string;
}

export interface WebhookIntegration {
  enabled: boolean;
  endpointUrl: string;
  secretKey: string;
  events: string[];
}

export interface SmtpIntegration {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  secure: boolean;
  senderEmail: string;
}

export interface IntegrationConfig {
  whatsapp: WhatsAppIntegration;
  google: GoogleIntegration;
  webhook: WebhookIntegration;
  smtp: SmtpIntegration;
}

export interface AuditLogEntry {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'created' | 'updated' | 'deleted' | 'security' | 'integration';
  author: string;
  createdAt?: any;
}
