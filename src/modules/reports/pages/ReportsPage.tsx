import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  Filter, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Calendar,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Clock,
  Send,
  Kanban,
  MessageSquare,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { format, subMonths, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { reportService } from '../services/reportService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/ui/Button';
import { cn } from '../../../shared/utils/cn';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { 
  ReportFilters, 
  ClientReportSummary, 
  ProductivityReportSummary, 
  PipelineReportSummary, 
  WhatsappReportSummary, 
  TaxReportSummary 
} from '../types';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4'];

export function ReportsPage() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Overview stats
  const [overviewStats, setOverviewStats] = useState<any>(null);

  // Filters State
  const [filters, setFilters] = useState<ReportFilters>({
    status: 'all',
    regime: 'all',
    responsible: 'all',
    startDate: '',
    endDate: ''
  });

  // Individual Report Data States
  const [clientReportData, setClientReportData] = useState<ClientReportSummary | null>(null);
  const [productivityData, setProductivityData] = useState<ProductivityReportSummary | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineReportSummary | null>(null);
  const [whatsappData, setWhatsappData] = useState<WhatsappReportSummary | null>(null);
  const [taxData, setTaxData] = useState<TaxReportSummary | null>(null);

  // Load Report Data according to Active Tab & Filters
  const loadReportData = async () => {
    if (!userData?.companyId) return;
    setLoading(true);

    try {
      if (activeTab === 'overview') {
        const clientStats = await reportService.getClientStats(userData.companyId);
        const taskStats = await reportService.getTaskStats(userData.companyId);

        const months = Array.from({ length: 6 }).map((_, i) => {
          const d = subMonths(new Date(), 5 - i);
          return {
            month: format(d, 'MMM', { locale: ptBR }),
            date: d,
            clients: 0
          };
        });

        const rawClients = clientStats.rawClients || [];
        months.forEach(m => {
          m.clients = rawClients.filter((c: any) => {
            let created: Date | null = null;
            if (c.createdAt?.toDate) {
              created = c.createdAt.toDate();
            } else if (c.createdAt) {
              created = new Date(c.createdAt);
            }
            if (!created || isNaN(created.getTime())) return true;
            return created <= endOfMonth(m.date);
          }).length;
        });

        const totalClients = clientStats.total || 1;
        const transformedTypeData = Object.entries(clientStats.byType || {}).map(([name, value]: [string, any]) => ({
          name,
          value: Math.round((value / totalClients) * 100),
          count: value
        }));

        setOverviewStats({ 
          clients: clientStats, 
          tasks: taskStats,
          growthData: months,
          typeData: transformedTypeData 
        });
      } else if (activeTab === 'clients') {
        const data = await reportService.getClientReport(userData.companyId, filters);
        setClientReportData(data);
      } else if (activeTab === 'productivity') {
        const data = await reportService.getProductivityReport(userData.companyId, filters);
        setProductivityData(data);
      } else if (activeTab === 'pipeline') {
        const data = await reportService.getPipelineReport(userData.companyId, filters);
        setPipelineData(data);
      } else if (activeTab === 'whatsapp') {
        const data = await reportService.getWhatsappReport(userData.companyId, filters);
        setWhatsappData(data);
      } else if (activeTab === 'tax') {
        const data = await reportService.getTaxReport(userData.companyId, filters);
        setTaxData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [userData?.companyId, activeTab, filters]);

  const reportsList = [
    { id: 'overview', name: 'Visão Geral' },
    { id: 'clients', name: '1. Carteira de Clientes' },
    { id: 'productivity', name: '2. Produtividade Equipe' },
    { id: 'pipeline', name: '3. Pipeline Kanban' },
    { id: 'whatsapp', name: '4. Mensagens WhatsApp' },
    { id: 'tax', name: '5. Impostos e Vencimentos' },
  ];

  // Export handlers
  const handleExportPDF = () => {
    if (activeTab === 'clients' && clientReportData) {
      const headers = ['Nome / Razão Social', 'Documento', 'Status', 'Regime Tributário', 'Responsável', 'Data Cadastro'];
      const rows = clientReportData.rows.map(r => [r.name, r.document, r.status.toUpperCase(), r.regime, r.responsible, r.createdAt]);
      exportToPDF('Relatório de Carteira de Clientes', headers, rows, 'carteira_clientes');
    } else if (activeTab === 'productivity' && productivityData) {
      const headers = ['Membro da Equipe', 'Cargo', 'Atendimentos', 'Tarefas Concluídas', 'Mensagens Enviadas', 'Pontuação'];
      const rows = productivityData.rows.map(r => [r.userName, r.userRole, r.meetings, r.tasksCompleted, r.messagesSent, r.totalScore]);
      exportToPDF('Relatório de Produtividade da Equipe', headers, rows, 'produtividade_equipe');
    } else if (activeTab === 'pipeline' && pipelineData) {
      const headers = ['Oportunidade / Cliente', 'Etapa Atual', 'Responsável', 'Valor (R$)', 'Dias na Etapa', 'Data'];
      const rows = pipelineData.rows.map(r => [
        r.clientName, 
        r.columnLabel, 
        r.responsible, 
        r.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        `${r.daysInStage} dias`, 
        r.createdAt
      ]);
      exportToPDF('Relatório do Pipeline Kanban', headers, rows, 'pipeline_kanban');
    } else if (activeTab === 'whatsapp' && whatsappData) {
      const headers = ['Atendente', 'Mensagens Enviadas', 'Mensagens Recebidas', 'Respondidas', 'Tempo Misto Reposta (min)'];
      const rows = whatsappData.rows.map(r => [r.attendant, r.sent, r.received, r.answered, `${r.avgResponseTimeMin} min`]);
      exportToPDF('Relatório de Mensagens WhatsApp', headers, rows, 'relatorio_whatsapp');
    } else if (activeTab === 'tax' && taxData) {
      const headers = ['Cliente', 'Obrigação / Imposto', 'Regime', 'Vencimento', 'Valor (R$)', 'Status', 'Data Pagamento'];
      const rows = taxData.rows.map(r => [
        r.clientName,
        r.taxName,
        r.regime,
        r.dueDate,
        r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        r.status.toUpperCase(),
        r.paymentDate || '-'
      ]);
      exportToPDF('Relatório de Impostos e Vencimentos', headers, rows, 'impostos_vencimentos');
    }
  };

  const handleExportExcel = () => {
    if (activeTab === 'clients' && clientReportData) {
      const data = clientReportData.rows.map(r => ({
        'Nome/Razão Social': r.name,
        'Documento': r.document,
        'Status': r.status,
        'Regime Tributário': r.regime,
        'Responsável': r.responsible,
        'Data Cadastro': r.createdAt
      }));
      exportToExcel(data, 'Clientes', 'carteira_clientes');
    } else if (activeTab === 'productivity' && productivityData) {
      const data = productivityData.rows.map(r => ({
        'Membro': r.userName,
        'Cargo': r.userRole,
        'Atendimentos': r.meetings,
        'Tarefas Concluídas': r.tasksCompleted,
        'Mensagens Enviadas': r.messagesSent,
        'Pontuação Total': r.totalScore
      }));
      exportToExcel(data, 'Produtividade', 'produtividade_equipe');
    } else if (activeTab === 'pipeline' && pipelineData) {
      const data = pipelineData.rows.map(r => ({
        'Cliente/Oportunidade': r.clientName,
        'Etapa': r.columnLabel,
        'Responsável': r.responsible,
        'Valor (R$)': r.value,
        'Dias na Etapa': r.daysInStage,
        'Data': r.createdAt
      }));
      exportToExcel(data, 'Pipeline', 'pipeline_kanban');
    } else if (activeTab === 'whatsapp' && whatsappData) {
      const data = whatsappData.rows.map(r => ({
        'Atendente': r.attendant,
        'Enviadas': r.sent,
        'Recebidas': r.received,
        'Respondidas': r.answered,
        'Tempo Médio Resposta (min)': r.avgResponseTimeMin
      }));
      exportToExcel(data, 'WhatsApp', 'relatorio_whatsapp');
    } else if (activeTab === 'tax' && taxData) {
      const data = taxData.rows.map(r => ({
        'Cliente': r.clientName,
        'Imposto/Obrigação': r.taxName,
        'Regime': r.regime,
        'Vencimento': r.dueDate,
        'Valor (R$)': r.amount,
        'Status': r.status,
        'Data Pagamento': r.paymentDate || ''
      }));
      exportToExcel(data, 'Impostos', 'impostos_vencimentos');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios e Business Intelligence</h2>
          <p className="text-muted-foreground text-sm">Gere relatórios gerenciais completos, exportáveis em PDF e Excel.</p>
        </div>
        {activeTab !== 'overview' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
              <FileSpreadsheet size={18} className="text-emerald-600" />
              Exportar Excel
            </Button>
            <Button className="gap-2" onClick={handleExportPDF}>
              <Download size={18} />
              Exportar PDF
            </Button>
          </div>
        )}
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-1">
        {reportsList.map(report => (
          <button
            key={report.id}
            onClick={() => setActiveTab(report.id)}
            className={cn(
              "px-4 py-2 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap",
              activeTab === report.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {report.name}
          </button>
        ))}
      </div>

      {/* Filter Bar for non-overview reports */}
      {activeTab !== 'overview' && (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Status Filter */}
          {(activeTab === 'clients' || activeTab === 'tax') && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Status
              </label>
              <select 
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Todos os Status</option>
                {activeTab === 'clients' ? (
                  <>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="lead">Lead</option>
                    <option value="blocked">Bloqueado</option>
                  </>
                ) : (
                  <>
                    <option value="a_vencer">A Vencer</option>
                    <option value="vencido">Vencido</option>
                    <option value="pago">Pago</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Regime Filter */}
          {(activeTab === 'clients' || activeTab === 'tax') && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Regime Tributário
              </label>
              <select 
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.regime}
                onChange={(e) => setFilters(prev => ({ ...prev, regime: e.target.value }))}
              >
                <option value="all">Todos os Regimes</option>
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
                <option value="MEI">MEI</option>
              </select>
            </div>
          )}

          {/* Responsible Filter */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Responsável / Atendente
            </label>
            <select 
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.responsible}
              onChange={(e) => setFilters(prev => ({ ...prev, responsible: e.target.value }))}
            >
              <option value="all">Todos os Responsáveis</option>
              <option value="Carlos Silva">Carlos Silva</option>
              <option value="Ana Souza">Ana Souza</option>
              <option value="Mariana Costa">Mariana Costa</option>
              <option value="João Pedro">João Pedro</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Período (Início - Fim)
            </label>
            <div className="flex gap-2">
              <input 
                type="date"
                className="w-1/2 bg-background border border-input rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
              <input 
                type="date"
                className="w-1/2 bg-background border border-input rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <RefreshCw className="animate-spin text-primary" size={28} />
          <p className="text-sm font-medium">Carregando dados do relatório...</p>
        </div>
      ) : (
        <>
          {/* TAB 0: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total de Clientes', value: overviewStats?.clients?.total.toString() || '0', icon: Users, color: 'text-primary' },
                  { label: 'Clientes Ativos', value: overviewStats?.clients?.active.toString() || '0', icon: CheckSquare, color: 'text-emerald-600' },
                  { label: 'Tarefas Pendentes', value: overviewStats?.tasks?.todo.toString() || '0', icon: Calendar, color: 'text-amber-600' },
                  { label: 'Taxa de Conclusão', value: overviewStats?.tasks?.total > 0 ? `${Math.round((overviewStats.tasks.completed / overviewStats.tasks.total) * 100)}%` : '0%', icon: TrendingUp, color: 'text-purple-600' },
                ].map((kpi, i) => (
                  <div key={i} className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 rounded-lg bg-muted/50", kpi.color)}>
                        <kpi.icon size={20} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Growth Area Chart */}
                <div className="lg:col-span-8 bg-card rounded-xl border border-border shadow-sm p-6">
                  <h3 className="font-bold mb-6">Projeção de Crescimento da Carteira</h3>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewStats?.growthData || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="clients" name="Clientes Totais" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Regime Pie Chart */}
                <div className="lg:col-span-4 bg-card rounded-xl border border-border shadow-sm p-6">
                  <h3 className="font-bold mb-6">Distribuição por Regime</h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overviewStats?.typeData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {(overviewStats?.typeData || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(overviewStats?.typeData || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold">{item.count} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: CARTEIRA DE CLIENTES */}
          {activeTab === 'clients' && clientReportData && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Total na Carteira</p>
                  <p className="text-2xl font-bold mt-1">{clientReportData.totalClients}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-emerald-600 font-medium uppercase">Clientes Ativos</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{clientReportData.activeClients}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-amber-600 font-medium uppercase">Leads em Prospecção</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">{clientReportData.leadClients}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-rose-600 font-medium uppercase">Inativos / Bloqueados</p>
                  <p className="text-2xl font-bold mt-1 text-rose-600">{clientReportData.inactiveClients + clientReportData.blockedClients}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-sm">Listagem de Clientes Filtrada</h3>
                  <span className="text-xs text-muted-foreground">{clientReportData.rows.length} registros</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Nome / Razão Social</th>
                        <th className="p-3">Documento (CNPJ/CPF)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Regime Tributário</th>
                        <th className="p-3">Responsável</th>
                        <th className="p-3">Data Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clientReportData.rows.map(row => (
                        <tr key={row.id} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{row.name}</td>
                          <td className="p-3 font-mono text-muted-foreground">{row.document}</td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              row.status === 'active' && "bg-emerald-100 text-emerald-700",
                              row.status === 'lead' && "bg-amber-100 text-amber-700",
                              row.status === 'inactive' && "bg-slate-100 text-slate-700",
                              row.status === 'blocked' && "bg-rose-100 text-rose-700"
                            )}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-3">{row.regime}</td>
                          <td className="p-3">{row.responsible}</td>
                          <td className="p-3 text-muted-foreground">{row.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUTIVIDADE DA EQUIPE */}
          {activeTab === 'productivity' && productivityData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><Users size={22} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total de Atendimentos</p>
                    <p className="text-2xl font-bold">{productivityData.totalMeetings}</p>
                  </div>
                </div>
                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600"><CheckSquare size={22} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Tarefas Concluídas</p>
                    <p className="text-2xl font-bold">{productivityData.totalTasksCompleted}</p>
                  </div>
                </div>
                <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600"><Send size={22} /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Mensagens Enviadas</p>
                    <p className="text-2xl font-bold">{productivityData.totalMessagesSent}</p>
                  </div>
                </div>
              </div>

              {/* Bar Chart Productivity */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-bold text-sm mb-6">Comparativo de Produtividade por Colaborador</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityData.rows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="userName" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="tasksCompleted" name="Tarefas Concluídas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="meetings" name="Atendimentos" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="messagesSent" name="Mensagens Enviadas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Membro da Equipe</th>
                        <th className="p-3">Cargo</th>
                        <th className="p-3 text-center">Atendimentos</th>
                        <th className="p-3 text-center">Tarefas Concluídas</th>
                        <th className="p-3 text-center">Mensagens Enviadas</th>
                        <th className="p-3 text-right">Pontuação de Produtividade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {productivityData.rows.map(row => (
                        <tr key={row.userId} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{row.userName}</td>
                          <td className="p-3 text-muted-foreground">{row.userRole}</td>
                          <td className="p-3 text-center font-mono">{row.meetings}</td>
                          <td className="p-3 text-center font-mono text-emerald-600 font-bold">{row.tasksCompleted}</td>
                          <td className="p-3 text-center font-mono">{row.messagesSent}</td>
                          <td className="p-3 text-right font-bold text-primary">{row.totalScore} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PIPELINE KANBAN */}
          {activeTab === 'pipeline' && pipelineData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Total Oportunidades</p>
                  <p className="text-2xl font-bold mt-1">{pipelineData.totalCards}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-emerald-600 font-medium uppercase">Taxa de Conversão</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{pipelineData.conversionRate}%</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-primary font-medium uppercase">Valor em Negociação</p>
                  <p className="text-xl font-bold mt-1 text-primary">
                    {pipelineData.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-rose-600 font-medium uppercase">Leads Perdidos</p>
                  <p className="text-2xl font-bold mt-1 text-rose-600">{pipelineData.lostCount}</p>
                </div>
              </div>

              {/* Table Column Metrics */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-bold text-sm mb-4">Tempo Médio por Etapa do Funil</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {pipelineData.columnsMetrics.map(col => (
                    <div key={col.columnId} className="bg-muted/40 p-3 rounded-lg border border-border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">{col.columnLabel}</p>
                      <p className="text-lg font-extrabold my-1">{col.cardCount} cards</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Clock size={12} /> {col.avgDaysInColumn} dias
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Opportunities Table */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm">Oportunidades do Funil</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Oportunidade / Cliente</th>
                        <th className="p-3">Etapa Atual</th>
                        <th className="p-3">Responsável</th>
                        <th className="p-3">Valor Estimado</th>
                        <th className="p-3 text-center">Dias na Etapa</th>
                        <th className="p-3">Data Criado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pipelineData.rows.map(row => (
                        <tr key={row.id} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{row.clientName}</td>
                          <td className="p-3">{row.columnLabel}</td>
                          <td className="p-3">{row.responsible}</td>
                          <td className="p-3 font-mono font-bold text-primary">
                            {row.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-3 text-center font-mono">{row.daysInStage} dias</td>
                          <td className="p-3 text-muted-foreground">{row.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MENSAGENS WHATSAPP */}
          {activeTab === 'whatsapp' && whatsappData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Mensagens Enviadas</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{whatsappData.totalSent}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Mensagens Recebidas</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{whatsappData.totalReceived}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Mensagens Respondidas</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{whatsappData.totalAnswered}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Tempo Misto de Resposta</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">{whatsappData.avgResponseTimeMin} min</p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm">Métricas por Atendente</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Atendente</th>
                        <th className="p-3 text-center">Enviadas</th>
                        <th className="p-3 text-center">Recebidas</th>
                        <th className="p-3 text-center">Respondidas</th>
                        <th className="p-3 text-right">Tempo Médio de Resposta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {whatsappData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{row.attendant}</td>
                          <td className="p-3 text-center font-mono">{row.sent}</td>
                          <td className="p-3 text-center font-mono">{row.received}</td>
                          <td className="p-3 text-center font-mono text-emerald-600 font-bold">{row.answered}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600">{row.avgResponseTimeMin} minutos</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IMPOSTOS E VENCIMENTOS */}
          {activeTab === 'tax' && taxData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-5 rounded-xl border border-border border-l-4 border-l-rose-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-rose-600 uppercase">Impostos Vencidos</span>
                    <AlertTriangle size={18} className="text-rose-500" />
                  </div>
                  <p className="text-2xl font-bold text-rose-600">
                    {taxData.vencidosAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{taxData.vencidosCount} obrigações em atraso</p>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border border-l-4 border-l-amber-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-amber-600 uppercase">A Vencer no Período</span>
                    <Clock size={18} className="text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    {taxData.aVencerAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{taxData.aVencerCount} obrigações pendentes</p>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border border-l-4 border-l-emerald-500">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-emerald-600 uppercase">Pagos no Período</span>
                    <CheckSquare size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {taxData.pagosAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{taxData.pagosCount} obrigações quita das</p>
                </div>
              </div>

              {/* Tax Obligations Table */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm">Obrigações Fiscais e Impostos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Obrigação / Imposto</th>
                        <th className="p-3">Regime</th>
                        <th className="p-3">Data Vencimento</th>
                        <th className="p-3">Valor (R$)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Data Pagamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {taxData.rows.map(row => (
                        <tr key={row.id} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{row.clientName}</td>
                          <td className="p-3">{row.taxName}</td>
                          <td className="p-3">{row.regime}</td>
                          <td className="p-3 font-mono">{row.dueDate}</td>
                          <td className="p-3 font-mono font-bold">
                            {row.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              row.status === 'pago' && "bg-emerald-100 text-emerald-700",
                              row.status === 'a_vencer' && "bg-amber-100 text-amber-700",
                              row.status === 'vencido' && "bg-rose-100 text-rose-700"
                            )}>
                              {row.status === 'a_vencer' ? 'A Vencer' : row.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{row.paymentDate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
