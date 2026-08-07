import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  AlertTriangle, 
  X,
  Users
} from 'lucide-react';
import { Chat } from '../../../types';
import { Task } from '../../../../tasks/types';
import { taskService } from '../../../../tasks/services/taskService';
import { useAuth } from '../../../../../app/providers/AuthProvider';
import { Button } from '../../../../../shared/components/ui/Button';

interface AgendaTabProps {
  chat: Chat;
}

export function AgendaTab({ chat }: AgendaTabProps) {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [events, setEvents] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('Reunião');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = taskService.subscribeToTasks(companyId, (taskList) => {
      // Filter agenda/commitments for this contact or general upcoming events
      const matching = taskList.filter(t => {
        if (chat.clientId && t.clientId === chat.clientId) return true;
        if (t.title?.toLowerCase().includes(chat.contactName.toLowerCase())) return true;
        if (t.category === 'Compromisso' || t.category === 'Reunião' || t.category === 'Agenda') return true;
        return true;
      });
      setEvents(matching.slice(0, 5));
    });

    return () => unsubscribe();
  }, [companyId, chat.clientId, chat.contactName]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSaving(true);
    try {
      await taskService.createTask({
        companyId,
        title: `[${type}] ${title} - ${chat.contactName}`,
        description: `Agendado via WhatsApp para ${chat.contactName} (${chat.contactPhone})`,
        dueDate: `${date}T${time}:00` as any,
        status: 'todo',
        priority: 'medium',
        assignedTo: userData?.name || 'Atendente',
        category: 'Compromisso',
        clientId: chat.clientId || undefined,
        createdBy: user?.uid || 'user_demo',
      } as any);

      setTitle('');
      setDate('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setSaving(false);
    }
  };

  // Tax deadlines based on company tags/regime
  const isSimples = (chat.tags || []).some(t => t.name.toLowerCase().includes('simples'));
  const isLucro = (chat.tags || []).some(t => t.name.toLowerCase().includes('lucro'));

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & New Event Trigger */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <CalendarIcon size={12} /> Próximos Compromissos
        </label>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          {isAdding ? <X size={12} /> : <Plus size={12} />}
          <span>{isAdding ? 'Cancelar' : 'Novo'}</span>
        </button>
      </div>

      {/* Tax Regime Fiscal Alert */}
      {(isSimples || isLucro) && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-700 dark:text-amber-400 text-xs">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Atenção ao Prazo Fiscal ({isSimples ? 'Simples Nacional' : 'Lucro Presumido'})</p>
            <p className="text-[10px] leading-tight opacity-90">
              Vencimento da guia {isSimples ? 'DAS (dia 20)' : 'DCTFWeb / DARF (dia 15)'} nos próximos dias.
            </p>
          </div>
        </div>
      )}

      {/* Inline Form */}
      {isAdding && (
        <form onSubmit={handleCreateEvent} className="p-3 bg-muted/30 border border-border rounded-xl space-y-2.5 text-xs animate-in slide-in-from-top-2">
          <input
            type="text"
            required
            placeholder="Título do compromisso..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-background border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="Reunião">Reunião</option>
            <option value="Ligação">Ligação / Call</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Prazo Fiscal">Prazo Fiscal</option>
            <option value="Visita">Visita Técnica</option>
          </select>
          <div className="flex justify-end gap-1.5 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-7 text-xs">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs">
              {saving ? 'Agendando...' : 'Salvar Compromisso'}
            </Button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="p-4 text-center bg-muted/20 rounded-xl border border-dashed border-border space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Nenhum compromisso agendado.</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-2.5 bg-card border border-border rounded-xl space-y-1 text-xs shadow-2xs hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground truncate">{event.title}</span>
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full shrink-0">
                  {event.category || 'Reunião'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-primary" />
                  {event.dueDate ? (typeof event.dueDate === 'string' ? event.dueDate.split('T')[0] : 'Data agendada') : 'A definir'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {event.assignedTo || 'Atendente'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
