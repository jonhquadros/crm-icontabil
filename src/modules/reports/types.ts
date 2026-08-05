export type ReportStatus = 'all' | 'lead' | 'active' | 'inactive' | 'blocked';
export type TaxRegimeFilter = 'all' | 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';

export interface ReportFilters {
  status?: string;
  regime?: string;
  responsible?: string;
  startDate?: string;
  endDate?: string;
}

export interface ClientReportRow {
  id: string;
  name: string;
  document: string;
  status: string;
  regime: string;
  responsible: string;
  createdAt: string;
}

export interface ClientReportSummary {
  rows: ClientReportRow[];
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  leadClients: number;
  blockedClients: number;
  byRegime: Record<string, number>;
}

export interface ProductivityReportRow {
  userId: string;
  userName: string;
  userRole: string;
  meetings: number;
  tasksCompleted: number;
  messagesSent: number;
  totalScore: number;
}

export interface ProductivityReportSummary {
  rows: ProductivityReportRow[];
  totalMeetings: number;
  totalTasksCompleted: number;
  totalMessagesSent: number;
}

export interface PipelineColumnMetric {
  columnId: string;
  columnLabel: string;
  cardCount: number;
  totalValue: number;
  avgDaysInColumn: number;
}

export interface PipelineReportSummary {
  columnsMetrics: PipelineColumnMetric[];
  totalCards: number;
  totalValue: number;
  conversionRate: number; // percentage
  wonCount: number;
  lostCount: number;
  lostValue: number;
  rows: Array<{
    id: string;
    clientName: string;
    columnLabel: string;
    responsible: string;
    value: number;
    daysInStage: number;
    status: string;
    createdAt: string;
  }>;
}

export interface WhatsappReportRow {
  attendant: string;
  sent: number;
  received: number;
  answered: number;
  avgResponseTimeMin: number;
}

export interface WhatsappReportSummary {
  rows: WhatsappReportRow[];
  totalSent: number;
  totalReceived: number;
  totalAnswered: number;
  avgResponseTimeMin: number;
}

export interface TaxReportRow {
  id: string;
  clientName: string;
  taxName: string;
  regime: string;
  dueDate: string;
  amount: number;
  status: 'vencido' | 'a_vencer' | 'pago';
  paymentDate?: string;
}

export interface TaxReportSummary {
  rows: TaxReportRow[];
  totalAmount: number;
  vencidosCount: number;
  vencidosAmount: number;
  aVencerCount: number;
  aVencerAmount: number;
  pagosCount: number;
  pagosAmount: number;
}
