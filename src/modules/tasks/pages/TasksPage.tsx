import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List as ListIcon, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  User,
  Flag,
  Pencil,
  Trash2
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Task, TaskPriority, TaskStatus } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { cn } from '../../../shared/utils/cn';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function TasksPage() {
  const { userData, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubscribe = taskService.subscribeToTasks(userData.companyId, (data) => {
      setTasks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.companyId]);

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await taskService.updateTask(task.id, { status: newStatus });
      toast.success(newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta');
    } catch (error) {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'text-danger bg-danger/10 border-danger/20';
      case 'high': return 'text-warning bg-warning/10 border-warning/20';
      case 'medium': return 'text-primary bg-primary/10 border-primary/20';
      case 'low': return 'text-slate-500 bg-slate-100 border-slate-200';
      default: return '';
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await taskService.deleteTask(id);
      toast.success('Tarefa removida com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tarefas e Agenda</h2>
          <p className="text-muted-foreground text-sm">Organize suas atividades diárias e compromissos.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted p-1 rounded-lg flex items-center mr-2">
            <button 
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={cn("p-1.5 rounded-md transition-all", view === 'calendar' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
            >
              <CalendarIcon size={18} />
            </button>
          </div>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <AddTaskModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        companyId={userData?.companyId || ''} 
        userId={user?.uid || ''}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />

      {view === 'list' ? (
        <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar tarefas..." 
                className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-12"></th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tarefa</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prioridade</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Limite</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-16 bg-muted/10"></td>
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhuma tarefa encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className={cn("hover:bg-muted/30 transition-colors group", task.status === 'completed' && "opacity-60")}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleStatus(task)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            task.status === 'completed' ? "bg-success border-success text-white" : "border-border hover:border-primary"
                          )}
                        >
                          {task.status === 'completed' && <CheckCircle2 size={12} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className={cn("text-sm font-bold", task.status === 'completed' && "line-through")}>{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border", getPriorityColor(task.priority))}>
                          {task.priority === 'urgent' ? 'Urgente' : 
                           task.priority === 'high' ? 'Alta' : 
                           task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={14} />
                          {task.dueDate ? format(task.dueDate?.toDate?.() || new Date(), 'dd/MM/yyyy HH:mm') : 'Sem data'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingTask(task)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                            title="Editar Tarefa"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-danger/10 rounded-lg transition-colors text-muted-foreground hover:text-danger"
                            title="Excluir Tarefa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-xs font-bold bg-muted rounded-md hover:bg-muted-hover transition-colors"
              >
                Hoje
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase bg-muted/20 border-b border-border">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate?.toDate?.() || new Date(), day));
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r border-border transition-colors hover:bg-muted/10",
                    !isSameMonth(day, monthStart) && "bg-muted/5 opacity-40",
                    isSameDay(day, new Date()) && "bg-primary/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      isSameDay(day, new Date()) && "bg-primary text-white"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id}
                        className={cn(
                          "text-[9px] font-bold p-1 rounded border truncate",
                          task.priority === 'urgent' ? "bg-danger/10 text-danger border-danger/20" :
                          task.priority === 'high' ? "bg-warning/10 text-warning border-warning/20" :
                          "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] text-muted-foreground text-center font-bold">
                        +{dayTasks.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
