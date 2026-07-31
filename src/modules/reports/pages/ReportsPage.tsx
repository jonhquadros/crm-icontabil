import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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
  FileText, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subMonths, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { reportService } from '../services/reportService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/ui/Button';
import { cn } from '../../../shared/utils/cn';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6'];

export function ReportsPage() {
  const { userData } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.companyId) return;

    const fetchStats = async () => {
      try {
        const clientStats = await reportService.getClientStats(userData.companyId);
        const taskStats = await reportService.getTaskStats(userData.companyId);
        
        // Calculate dynamic growth data over the last 6 months based on actual client records
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
            } else if (c.createdAt?.seconds) {
              created = new Date(c.createdAt.seconds * 1000);
            } else if (typeof c.createdAt === 'string') {
              created = new Date(c.createdAt);
            } else if (c.createdAt instanceof Date) {
              created = c.createdAt;
            }

            if (!created || isNaN(created.getTime())) {
              return true;
            }
            return created <= endOfMonth(m.date);
          }).length;
        });

        // Transform stats for distribution chart
        const totalClients = clientStats.total || 1;
        const transformedTypeData = Object.entries(clientStats.byType).map(([name, value]: [string, any]) => ({
          name,
          value: Math.round((value / totalClients) * 100),
          count: value
        }));

        setStats({ 
          clients: clientStats, 
          tasks: taskStats,
          growthData: months,
          typeData: transformedTypeData 
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userData?.companyId]);

  const growthData = stats?.growthData || [];
  const displayClientTypesData = stats?.typeData || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios e Business Intelligence</h2>
          <p className="text-muted-foreground text-sm">Acompanhe o crescimento e performance da sua empresa.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter size={18} />
            Filtros
          </Button>
          <Button className="gap-2">
            <Download size={18} />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Clientes', value: stats?.clients?.total.toString() || '0', icon: Users, trend: 'up', color: 'text-primary' },
          { label: 'Clientes Ativos', value: stats?.clients?.active.toString() || '0', icon: CheckSquare, trend: 'up', color: 'text-success' },
          { label: 'Tarefas Pendentes', value: stats?.tasks?.todo.toString() || '0', icon: Calendar, trend: 'down', color: 'text-warning' },
          { label: 'Eficiência (Concluídas)', value: stats?.tasks?.total > 0 ? `${Math.round((stats.tasks.completed / stats.tasks.total) * 100)}%` : '0%', icon: TrendingUp, trend: 'up', color: 'text-purple-500' },
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
        {/* Revenue Growth Area Chart */}
        <div className="lg:col-span-8 bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Projeção de Crescimento</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <TrendingUp size={14} className="text-success" />
              <span>Baseado em histórico de cadastros</span>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clients" 
                  name="Clientes"
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold mb-6">Distribuição de Clientes</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayClientTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayClientTypesData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {displayClientTypesData.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground font-medium">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Performance Bar Chart */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold mb-6 text-sm">Status Geral de Tarefas</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { 
                  name: 'Tarefas', 
                  concluidas: stats?.tasks?.completed || 0, 
                  pendentes: stats?.tasks?.todo || 0 
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="concluidas" fill="#16a34a" radius={[4, 4, 0, 0]} name="Concluídas" />
                <Bar dataKey="pendentes" fill="#d97706" radius={[4, 4, 0, 0]} name="Pendentes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Conversion Funnel or List */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-bold mb-6">Principais Insights</h3>
          <div className="space-y-6">
            {[
              { 
                title: 'Aumento na Eficiência', 
                desc: 'A equipe de DP concluiu 15% mais tarefas do que a média do último trimestre.',
                icon: CheckSquare,
                color: 'text-success bg-success/10'
              },
              { 
                title: 'Alerta de Inatividade', 
                desc: '3 clientes não enviaram documentos fiscais nos últimos 15 dias.',
                icon: AlertCircle,
                color: 'text-danger bg-danger/10'
              },
              { 
                title: 'Oportunidade de Upsell', 
                desc: '8 clientes MEI atingiram 80% do teto de faturamento anual.',
                icon: TrendingUp,
                color: 'text-warning bg-warning/10'
              },
            ].map((insight, i) => (
              <div key={i} className="flex gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", insight.color)}>
                  <insight.icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
