import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  FileCheck, 
  AlertCircle,
  TrendingUp,
  Calendar,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../../shared/utils/cn';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { PermissionGuard } from '../../../shared/components/PermissionGuard';
import { taskService } from '../../tasks/services/taskService';
import { clientService } from '../../clients/services/clientService';
import { documentService } from '../../documents/services/documentService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Task } from '../../tasks/types';
import { Client, TaxRegime } from '../../clients/types';
import { DocumentFile } from '../../documents/types';
import { AddClientModal } from '../../clients/components/AddClientModal';
import { AddTaskModal } from '../../tasks/components/AddTaskModal';
import { EditTaskModal } from '../../tasks/components/EditTaskModal';
import { Button } from '../../../shared/components/ui/Button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format, isToday, isBefore, startOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6'];

export function DashboardPage() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubTasks = taskService.subscribeToTasks(userData.companyId, (data) => {
      setTasks(data);
    });

    const unsubClients = clientService.subscribeToClients(userData.companyId, (data) => {
      setClients(data);
      setLoading(false);
    });

    // Subscribing to all files for the company to count pending docs
    const unsubFiles = documentService.subscribeToFiles(userData.companyId, null, (data) => {
      setFiles(data);
    });

    return () => {
      unsubTasks();
      unsubClients();
      unsubFiles();
    };
  }, [userData?.companyId]);

  // Calculate Chart Data dynamically
  const getRegimeData = () => {
    const counts: Record<string, number> = {
      'Simples Nacional': 0,
      'Lucro Presumido': 0,
      'Lucro Real': 0,
      'MEI': 0,
    };

    clients.forEach(c => {
      const regime = c.taxRegime as string;
      if (counts[regime] !== undefined) {
        counts[regime]++;
      }
    });

    const total = clients.length || 1;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100)
    })).filter(d => d.value > 0);
  };

  const pieData = getRegimeData().length > 0 ? getRegimeData() : [
    { name: 'Sem Dados', value: 100 }
  ];

  // Calculate Evolution Data (Mocking evolution since we don't have historic snapshots yet, 
  // but we can simulate it based on createdAt if available)
  const getEvolutionData = () => {
    const months = Array.from({ length: 7 }).map((_, i) => {
      const d = subMonths(new Date(), 6 - i);
      return {
        name: format(d, 'MMM', { locale: ptBR }),
        date: d,
        value: 0
      };
    });

    months.forEach(m => {
      m.value = clients.filter(c => {
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

    return months;
  };

  const evolutionData = getEvolutionData();

  const activeClientsCount = clients.filter(c => c.status === 'active' || (!c.status && c.active !== false)).length;
  const totalClientsCount = clients.length;

  const kpis = [
    { 
      label: 'Clientes Ativos', 
      value: activeClientsCount.toString(), 
      trend: `${totalClientsCount} clientes cadastrados`, 
      icon: Users, 
      color: 'text-primary',
      path: '/dashboard/clients'
    },
    { 
      label: 'Tarefas Hoje', 
      value: tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        const date = t.dueDate?.toDate?.() || new Date();
        return isToday(date) || isBefore(date, startOfDay(new Date()));
      }).length.toString(), 
      trend: 'Pendentes', 
      icon: FileCheck, 
      color: 'text-primary',
      path: '/dashboard/tasks'
    },
    { 
      label: 'Documentos', 
      value: files.length.toString(), 
      trend: 'Total', 
      icon: FileCheck, 
      color: 'text-success',
      path: '/dashboard/documents'
    },
    { 
      label: 'Tarefas Urgentes', 
      value: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length.toString(), 
      trend: 'Atenção', 
      icon: AlertCircle, 
      color: 'text-danger',
      path: '/dashboard/tasks'
    },
  ];

  const handleToggleTask = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { 
        status: task.status === 'completed' ? 'todo' : 'completed' 
      });
    } catch (error) {
      console.error('Error updating task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await taskService.deleteTask(id);
    } catch (error) {
      console.error('Error deleting task');
    }
  };

  // Combined activity feed
  const activities = [
    ...clients.map(c => ({
      id: c.id,
      text: `Novo cliente: ${c.name}`,
      time: c.createdAt?.toDate?.() || new Date() || new Date(),
      type: 'client'
    })),
    ...tasks.filter(t => t.status === 'completed').map(t => ({
      id: t.id,
      text: `Tarefa concluída: ${t.title}`,
      time: t.updatedAt?.toDate?.() || new Date() || new Date(),
      type: 'task'
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painel de Controle</h2>
          <p className="text-muted-foreground">Bem-vindo ao seu resumo diário do iContábil CRM.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsAddTaskOpen(true)}>
            <Plus size={16} />
            Nova Tarefa
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsAddClientOpen(true)}>
            <Plus size={16} />
            Novo Cliente
          </Button>
        </div>
      </div>

      <AddClientModal 
        isOpen={isAddClientOpen} 
        onClose={() => setIsAddClientOpen(false)} 
        companyId={userData?.companyId || ''} 
      />

      <AddTaskModal 
        isOpen={isAddTaskOpen} 
        onClose={() => setIsAddTaskOpen(false)} 
        companyId={userData?.companyId || ''} 
        userId={user?.uid || ''}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => kpi.path && navigate(kpi.path)}
            className={cn(
              "bg-card p-6 rounded-xl border border-border shadow-sm flex items-start justify-between transition-all",
              kpi.path && "cursor-pointer hover:bg-muted/50 hover:border-primary/50 active:scale-[0.98]"
            )}
          >
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-bold">{kpi.value}</h3>
              <p className={cn("text-xs font-bold mt-1", kpi.color === 'text-primary' ? 'text-primary' : kpi.color)}>
                {kpi.trend}
              </p>
            </div>
            <div className={cn("p-3 rounded-lg bg-background", kpi.color)}>
              <kpi.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Evolution Chart */}
        <div className="lg:col-span-8 bg-card rounded-xl border border-border shadow-sm p-6">
          <PermissionGuard 
            module="reports" 
            fallback={
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-2 opacity-50">
                <ShieldAlert size={32} className="text-muted-foreground" />
                <p className="text-sm font-medium">Acesso restrito aos relatórios</p>
              </div>
            }
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Evolução da Carteira</h3>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <TrendingUp size={14} className="text-success" />
                <span>Baseado em cadastros reais</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Clientes"
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PermissionGuard>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-4 bg-card rounded-xl border border-border shadow-sm p-6">
          <PermissionGuard 
            module="reports" 
            fallback={
              <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-2 opacity-50">
                <ShieldAlert size={32} className="text-muted-foreground" />
                <p className="text-sm font-medium">Acesso restrito</p>
              </div>
            }
          >
            <h3 className="font-bold mb-6 text-sm">Distribuição por Regime</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Sem Dados' ? '#e2e8f0' : COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pieData[0]?.name !== 'Sem Dados' ? pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center">Nenhum cliente cadastrado.</p>
              )}
            </div>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Atividades Recentes</h3>
          </div>
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={`${activity.type}-${activity.id}`} className="flex gap-3">
                <div className={cn(
                  "mt-1 w-2 h-2 rounded-full shrink-0",
                  activity.type === 'client' ? 'bg-primary' : 'bg-success'
                )} />
                <div>
                  <p className="text-sm font-medium leading-none">{activity.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(activity.time, 'dd/MM HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sem atividades recentes.</p>
            )}
          </div>
        </div>

        {/* Next Events */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Agenda do Dia</h3>
            <button 
              onClick={() => navigate('/dashboard/tasks')}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Ver Tudo
            </button>
          </div>
          <div className="space-y-4">
            {tasks
              .filter(t => {
                if (!t.dueDate || t.status === 'completed') return false;
                const date = t.dueDate?.toDate?.() || new Date();
                return isToday(date) || isBefore(date, startOfDay(new Date()));
              })
              .sort((a, b) => (a.dueDate?.toMillis() || 0) - (b.dueDate?.toMillis() || 0))
              .slice(0, 4)
              .map((task, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-background">
                      <Calendar size={14} className="text-primary" />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[150px]">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.dueDate ? format(task.dueDate?.toDate?.() || new Date(), 'HH:mm') : '--:--'}
                  </span>
                </div>
              ))}
            {tasks.filter(t => t.dueDate && isToday(t.dueDate?.toDate?.() || new Date())).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sem compromissos para hoje.</p>
            )}
          </div>
        </div>

        {/* Task List Quick View */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <PermissionGuard module="tasks" fallback={<p className="text-sm text-muted-foreground">Você não tem permissão para ver tarefas.</p>}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Minhas Tarefas</h3>
              <button 
                onClick={() => navigate('/dashboard/tasks')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Ver Todas
              </button>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'completed').length > 0 ? (
                tasks.filter(t => t.status !== 'completed').slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 group">
                    <button 
                      onClick={() => handleToggleTask(task)}
                      className="w-4 h-4 rounded border border-border flex items-center justify-center transition-colors hover:border-primary"
                    >
                      {task.status === 'completed' && <CheckCircle2 size={10} className="text-success" />}
                    </button>
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingTask(task)}
                        className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 hover:bg-danger/10 rounded text-muted-foreground hover:text-danger transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      task.priority === 'urgent' ? 'bg-danger' : 
                      task.priority === 'high' ? 'bg-warning' : 'bg-primary'
                    )} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa pendente.</p>
              )}
            </div>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
}

