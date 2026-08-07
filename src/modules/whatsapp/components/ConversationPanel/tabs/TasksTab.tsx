import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Plus, 
  X, 
  User, 
  Clock, 
  Loader2
} from 'lucide-react';
import { Chat } from '../../../types';
import { Task } from '../../../../tasks/types';
import { taskService } from '../../../../tasks/services/taskService';
import { useAuth } from '../../../../../app/providers/AuthProvider';
import { Button } from '../../../../../shared/components/ui/Button';

interface TasksTabProps {
  chat: Chat;
}

export function TasksTab({ chat }: TasksTabProps) {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assignedTo, setAssignedTo] = useState(userData?.name || 'Atendente');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = taskService.subscribeToTasks(companyId, (taskList) => {
      // Filter tasks related to this client/contact
      const matching = taskList.filter(t => {
        if (chat.clientId && t.clientId === chat.clientId) return true;
        if (t.title?.toLowerCase().includes(chat.contactName.toLowerCase())) return true;
        if (t.description?.toLowerCase().includes(chat.contactName.toLowerCase())) return true;
        return false;
      });
      setTasks(matching);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId, chat.clientId, chat.contactName]);

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await taskService.updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await taskService.createTask({
        companyId,
        title: `${title} - ${chat.contactName}`,
        description: `Criado no WhatsApp para o cliente ${chat.contactName} (${chat.companyName || ''})`,
        dueDate: (dueDate || new Date().toISOString().split('T')[0]) as any,
        status: 'todo',
        priority,
        assignedTo,
        category: 'Geral',
        clientId: chat.clientId || undefined,
        createdBy: user?.uid || 'user_demo',
      } as any);

      setTitle('');
      setDueDate('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setSaving(false);
    }
  };

  const openTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const getPriorityBadge = (p: 'low' | 'medium' | 'high' | 'urgent') => {
    switch (p) {
      case 'high':
      case 'urgent':
        return <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-600 font-bold rounded">Alta</span>;
      case 'medium':
        return <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 font-bold rounded">Média</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 font-bold rounded">Baixa</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & New Task Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <CheckSquare size={12} /> Tarefas Pendentes
          </label>
          <p className="text-[10px] text-muted-foreground font-medium">
            {openTasks.length} abertas · {completedTasks.length} concluídas
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          {isAdding ? <X size={12} /> : <Plus size={12} />}
          <span>{isAdding ? 'Cancelar' : 'Nova'}</span>
        </button>
      </div>

      {/* Inline New Task Form */}
      {isAdding && (
        <form onSubmit={handleCreateTask} className="p-3 bg-muted/30 border border-border rounded-xl space-y-2.5 text-xs animate-in slide-in-from-top-2">
          <input
            type="text"
            required
            placeholder="Título da tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-background border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="bg-background border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Responsável (nome)..."
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-7 text-xs">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs">
              {saving ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-6 text-muted-foreground space-y-2">
          <Loader2 size={20} className="animate-spin text-primary" />
          <span className="text-xs">Carregando tarefas...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-4 text-center bg-muted/20 rounded-xl border border-dashed border-border space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Nenhuma tarefa vinculada a este contato.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-2.5 bg-card border rounded-xl space-y-1 text-xs transition-all shadow-2xs ${
                  isCompleted ? 'opacity-60 border-border/50 bg-muted/20' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-foreground leading-snug ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : 'Com prazo') : 'Sem prazo'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {typeof task.assignedTo === 'string' ? task.assignedTo : 'Atendente'}
                      </span>
                    </div>
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
