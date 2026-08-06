export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

export type ContactStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'opted_out'
  | 'skipped';

export type WarmthLevel = 'new' | 'warming' | 'warm' | 'hot';

export interface CampaignMetrics {
  total:    number;
  pending:  number;
  sent:     number;
  failed:   number;
  replied:  number;
  optedOut: number;
}

export interface CampaignFormData {
  name:          string;
  description:   string;
  instanceId:    string;
  templateId?:   string;
  templateText:  string;
  delayMinMs:    number;
  delayMaxMs:    number;
  batchSize:     number;
  scheduledAt?:  Date | null;
}

export interface CampaignContact {
  id:          string;
  campaignId:  string;
  companyId:   string;
  active:      boolean;
  createdAt:   any; // Timestamp or Date
  updatedAt:   any; // Timestamp or Date
  createdBy:   string;
  updatedBy:   string;

  phone:       string;
  name:        string;
  company?:    string;
  city?:       string;
  email?:      string;
  customVars?: Record<string, string>;

  status:      ContactStatus;
  sentAt:      any | null;
  failedAt:    any | null;
  failReason:  string | null;
  retries:     number;
  messageId:   string | null;
  optedOutAt:  any | null;
}

export interface Campaign {
  id:           string;
  companyId:    string;
  active:       boolean;
  createdAt:    any; // Timestamp or Date
  updatedAt:    any; // Timestamp or Date
  createdBy:    string;
  updatedBy:    string;

  name:         string;
  description:  string;
  status:       CampaignStatus;
  type:         'text' | 'image' | 'document';

  instanceId:   string;
  delayMinMs:   number;
  delayMaxMs:   number;
  batchSize:    number;
  dailyLimit:   number;
  nativeDelayMs: number;

  templateId?:  string;
  templateText: string;
  templateVariations?: string[];
  variables:    string[];

  scheduledAt:  any | null;
  startedAt:    any | null;
  completedAt:  any | null;
  pausedAt:     any | null;
  pauseReason?: string | null;

  metrics:      CampaignMetrics;
}

export interface CampaignQueueJob {
  id:               string;
  companyId:        string;
  active:           boolean;
  createdAt:        any;
  updatedAt:        any;
  createdBy:        string;
  updatedBy:        string;

  campaignId:       string;
  contactId:        string;
  instanceId:       string;

  status:           'pending' | 'processing' | 'done' | 'failed';
  scheduledAt:      any;
  processedAt:      any | null;
  attempts:         number;

  phone:            string;
  personalizedText: string;
  nativeDelayMs:    number;
  messageId?:       string | null;
}

export interface CampaignTemplate {
  id:           string;
  companyId:    string;
  active:       boolean;
  createdAt:    any;
  updatedAt:    any;
  createdBy:    string;
  updatedBy:    string;

  name:         string;
  category:     'prospecting' | 'followup' | 'reactivation' | 'announcement' | 'custom';
  text:         string;
  variables:    string[];
  usageCount:   number;
  variations:   string[];
}

export interface OptOut {
  id:           string;
  companyId:    string;
  phone:        string;
  name?:        string | null;
  optedOutAt:   any;
  source:       'reply_stop' | 'manual' | 'webhook';
  active:       boolean;
  createdAt:    any;
  updatedAt:    any;
  createdBy:    string;
  updatedBy:    string;
  reason?:      string | null;
}

export interface WhatsAppInstance {
  id:           string;
  companyId:    string;
  active:       boolean;
  createdAt:    any;
  updatedAt:    any;
  createdBy:    string;
  updatedBy:    string;

  instanceName: string;
  phone:        string;
  status:       'connected' | 'disconnected' | 'banned';

  warmth: {
    level:          WarmthLevel;
    dailyLimit:     number;
    sentToday:      number;
    lastResetAt:    any;
    registeredAt:   any;
  };
}
