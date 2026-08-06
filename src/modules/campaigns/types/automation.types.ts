export interface AutomationTrigger {
  id: string;
  companyId: string;
  pipelineId: string;
  pipelineName?: string;
  columnName: string; // column id, e.g. "lead", "documentation", "waiting", "won"
  columnLabel?: string; // human readable column label
  templateId?: string;
  templateName?: string;
  templateText?: string;
  customMessage?: string;
  instanceId: string;
  instanceName?: string;
  delayMs: number; // 0 (imediato), 3600000 (1h), 21600000 (6h), 86400000 (24h), 172800000 (48h)
  active: boolean;
  triggerCount: number;
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
  updatedBy?: string;
}

export type DelayOption = {
  label: string;
  value: number; // in milliseconds
};

export const DELAY_OPTIONS: DelayOption[] = [
  { label: 'Imediato (Sem delay)', value: 0 },
  { label: '1 hora após mover', value: 3600000 },
  { label: '6 horas após mover', value: 21600000 },
  { label: '24 horas (1 dia) após mover', value: 86400000 },
  { label: '48 horas (2 dias) após mover', value: 172800000 },
];
