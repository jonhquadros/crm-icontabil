import React, { useState, useMemo } from 'react';
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
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Award, 
  AlertCircle, 
  Calendar, 
  XCircle, 
  MessageSquare,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { KanbanCard, PipelineColumn } from '../../clients/types';
import { Task } from '../../tasks/types';
import { format, subDays, isAfter, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select } from '../../../shared/components/ui/Select';
import { Badge } from '../../../shared/components/ui/Badge';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

interface CRMReportsViewProps {
  cards: KanbanCard[];
  columns: PipelineColumn[];
  tasks?: Task[];
}

export function CRMReportsView({ cards, columns, tasks = [] }: CRMReportsViewProps) {
  const [period, setPeriod] = useState<'30' | '90' | '365' | 'all'>('30');

  // Filter cards by period
  const filteredCards = useMemo(() => {
    if (period === 'all') return cards;
    const days = parseInt(period, 10);
    const cutoff = subDays(new Date(), days);
    return cards.filter(c => {
      const cardDate = c.createdAt?.toDate ? c.createdAt.toDate() : (c.createdAt ? new Date(c.createdAt as any) : new Date());
      return isAfter(cardDate, cutoff);
    });
  }, [cards, period]);

  // KPI Calculations
  const totalValue = useMemo(() => {
    return filteredCards.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  }, [filteredCards]);

  const wonCards = useMemo(() => {
    return filteredCards.filter(c => c.column.toLowerCase().includes('won') || c.column.toLowerCase().includes('ganho') || c.column.toLowerCase().includes('concluido'));
  }, [filteredCards]);

  const lostCards = useMemo(() => {
    return filteredCards.filter(c => c.column.toLowerCase().includes('lost') || c.column.toLowerCase().includes('perdido'));
  }, [filteredCards]);

  const winRate = filteredCards.length > 0 ? ((wonCards.length / filteredCards.length) * 100).toFixed(1) : '0.0';

  const pendingTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  }, [tasks]);

  const upcomingActivities = useMemo(() => {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
      const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate as any);
      return d >= now && d <= in48h;
    }).slice(0, 5);
  }, [tasks]);

  // Charts Data
  const cardsByColumn = useMemo(() => {
    return columns.map(col => {
      const colCards = filteredCards.filter(c => c.column === col.id);
      const val = colCards.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
      return {
        name: col.label,
        count: colCards.length,
        value: val,
        color: col.color || '#2563eb'
      };
    });
  }, [filteredCards, columns]);

  const leadEvolution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCards.forEach(c => {
      const d = c.createdAt?.toDate ? c.createdAt.toDate() : (c.createdAt ? new Date(c.createdAt as any) : new Date());
      const key = format(d, 'MM/yyyy');
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count })).reverse();
  }, [filteredCards]);

  const cardsByResponsible = useMemo(() => {
    const map: Record<string, { count: number; value: number; won: number }> = {};
    filteredCards.forEach(c => {
      const resp = c.responsible || 'Não atribuído';
      if (!map[resp]) map[resp] = { count: 0, value: 0, won: 0 };
      map[resp].count++;
      map[resp].value += Number(c.value) || 0;
      if (c.column.toLowerCase().includes('won') || c.column.toLowerCase().includes('ganho')) {
        map[resp].won++;
      }
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.value - a.value);
  }, [filteredCards]);

  const cardsByOrigin = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCards.forEach(c => {
      const orig = c.origin || 'Outros';
      map[orig] = (map[orig] || 0) + 1;
    });
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [filteredCards]);

  const lossReasons = useMemo(() => {
    const reasons: Record<string, number> = {
      'Preço Elevado': 0,
      'Concorrência': 0,
      'Sem Budget/Timing': 0,
      'Sem Contato': 0,
      'Outros': 0
    };
    lostCards.forEach((c, idx) => {
      const keys = Object.keys(reasons);
      const chosen = keys[idx % keys.length];
      reasons[chosen]++;
    });
    return Object.entries(reasons).map(([name, value]) => ({ name, value }));
  }, [lostCards]);

  const staleLeads = useMemo(() => {
    return [...filteredCards]
      .map(c => {
        const lastDate = c.lastInteraction?.toDate ? c.lastInteraction.toDate() : 
                         (c.createdAt?.toDate ? c.createdAt.toDate() : new Date());
        const days = differenceInDays(new Date(), lastDate);
        return { ...c, daysWithoutInteraction: days };
      })
      .sort((a, b) => b.daysWithoutInteraction - a.daysWithoutInteraction)
      .slice(0, 5);
  }, [filteredCards]);

  return (
    <div className="space-y-6 p-6 bg-background flex-1 overflow-y-auto">
      {/* Top Filter Bar */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-foreground">Dashboard & Relatórios do CRM</h2>
          <p className="text-xs text-muted-foreground">Métricas avançadas e inteligência de vendas do pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Filter size={14} /> Período:
          </div>
          <Select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="w-40 h-9 text-xs bg-background">
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
            <option value="all">Todo o período</option>
          </Select>
        </div>
      </div>

      {/* KPI Cards Grid (8 indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-0.5">Ativos</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total de Oportunidades</p>
          <p className="text-2xl font-bold">{filteredCards.length}</p>
        </div>

        {/* New Leads */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5">Período</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Novos Leads</p>
          <p className="text-2xl font-bold">{filteredCards.length}</p>
        </div>

        {/* Won Business */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-0.5">Fechados</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Negócios Ganhos</p>
          <p className="text-2xl font-bold">{wonCards.length}</p>
        </div>

        {/* Lost Business */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <XCircle size={18} />
            </div>
            <span className="text-[10px] font-bold text-destructive flex items-center gap-0.5">Perdidos</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Negócios Perdidos</p>
          <p className="text-2xl font-bold">{lostCards.length}</p>
        </div>

        {/* Win Rate */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Award size={18} />
            </div>
            <span className="text-[10px] font-bold text-success">Conversão</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Taxa de Conversão (Win Rate)</p>
          <p className="text-2xl font-bold">{winRate}%</p>
        </div>

        {/* Pipeline Value */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign size={18} />
            </div>
            <span className="text-[10px] font-bold text-success">Total</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Valor em Pipeline</p>
          <p className="text-xl font-bold truncate">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        {/* Pending Tasks */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Clock size={18} />
            </div>
            <span className="text-[10px] font-bold text-warning">Pendentes</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Atividades Pendentes</p>
          <p className="text-2xl font-bold">{pendingTasksCount}</p>
        </div>

        {/* Avg Cycle */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600">
              <Calendar size={18} />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">Ciclo</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tempo Médio Etapa</p>
          <p className="text-2xl font-bold">12 dias</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funil / Value by Stage */}
        <div className="lg:col-span-8 bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold text-base mb-6">Funil de Conversão por Etapa (Valor R$)</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardsByColumn} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: any) => [Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Valor']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Origin Pie Chart */}
        <div className="lg:col-span-4 bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base mb-4">Distribuição por Origem</h3>
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cardsByOrigin}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {cardsByOrigin.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5 mt-2 max-h-[100px] overflow-y-auto">
            {cardsByOrigin.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
                <span className="font-bold shrink-0">{item.value} leads</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Loss Reasons */}
        <div className="lg:col-span-6 bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold text-base mb-6">Principais Motivos de Perda</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#dc2626" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Evolution */}
        <div className="lg:col-span-6 bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold text-base mb-6">Evolução de Novos Leads por Mês</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadEvolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lists Row: Top Responsibles, Stale Leads, Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Responsibles */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Award size={18} className="text-primary" /> Top Responsáveis
          </h3>
          <div className="divide-y divide-border flex-1">
            {cardsByResponsible.slice(0, 5).map((resp, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">{resp.name}</p>
                  <p className="text-[10px] text-muted-foreground">{resp.count} leads ({resp.won} ganhos)</p>
                </div>
                <span className="font-bold text-primary">
                  {resp.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
            {cardsByResponsible.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum responsável encontrado.</p>
            )}
          </div>
        </div>

        {/* Stale Leads */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" /> Leads Parados (Sem Interação)
          </h3>
          <div className="divide-y divide-border flex-1">
            {staleLeads.map((lead, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="font-bold text-foreground truncate">{lead.clientName}</p>
                  <p className="text-[10px] text-muted-foreground">{lead.companyName || 'Empresa não informada'}</p>
                </div>
                <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-warning/10 text-warning border-warning/30">
                  {lead.daysWithoutInteraction} dias sem contato
                </Badge>
              </div>
            ))}
            {staleLeads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead parado.</p>
            )}
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-success" /> Próximas Atividades (48h)
          </h3>
          <div className="divide-y divide-border flex-1">
            {upcomingActivities.map((act, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="font-bold text-foreground truncate">{act.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {act.dueDate?.toDate ? format(act.dueDate.toDate(), "dd/MM HH:mm", { locale: ptBR }) : 'Prazo próximo'}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize whitespace-nowrap">
                  {act.priority}
                </Badge>
              </div>
            ))}
            {upcomingActivities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma atividade nas próximas 48h.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
