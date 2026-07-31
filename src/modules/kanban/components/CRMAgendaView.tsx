import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckSquare, 
  Briefcase, 
  Users, 
  FileText,
  Plus,
  Search
} from 'lucide-react';
import { KanbanCard } from '../../clients/types';
import { Task } from '../../tasks/types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../../shared/components/ui/Button';
import { Select } from '../../../shared/components/ui/Select';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { cn } from '../../../shared/utils/cn';

interface CRMAgendaViewProps {
  cards: KanbanCard[];
  tasks: Task[];
  onSelectCard: (card: KanbanCard) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
}

export function CRMAgendaView({ cards = [], tasks = [], onSelectCard, onSelectTask, onAddTask }: CRMAgendaViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Combine tasks and card interactions into calendar events
  const events = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: Date;
      type: 'task' | 'meeting' | 'followup' | 'fiscal';
      priority?: string;
      card?: KanbanCard;
      task?: Task;
      description?: string;
    }> = [];

    // Add tasks
    tasks.forEach(t => {
      if (t.dueDate) {
        const d = t.dueDate?.toDate ? t.dueDate.toDate() : (typeof t.dueDate === 'string' ? new Date(t.dueDate) : new Date());
        const card = cards.find(c => c.id === t.clientId || c.clientName === (t as any).clientName);
        list.push({
          id: `task_${t.id}`,
          title: t.title,
          date: d,
          type: t.title.toLowerCase().includes('reunião') ? 'meeting' : 
                t.title.toLowerCase().includes('fiscal') ? 'fiscal' : 'task',
          priority: t.priority,
          card,
          task: t,
          description: t.description
        });
      }
    });

    // Add follow-ups or meetings from card timelines or stubbed card dates
    cards.forEach(c => {
      if (c.updatedAt) {
        const d = c.updatedAt?.toDate ? c.updatedAt.toDate() : new Date();
        // If column is meeting, add a meeting event
        if (c.column === 'meeting') {
          list.push({
            id: `card_meeting_${c.id}`,
            title: `Reunião com ${c.clientName} (${c.companyName || 'Empresa'})`,
            date: d,
            type: 'meeting',
            priority: c.priority,
            card: c,
            description: `Reunião agendada no pipeline ${c.column}`
          });
        }
      }
    });

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks, cards]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchClient = ev.card?.clientName?.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchDesc) return false;
      }
      if (filterType !== 'all' && ev.type !== filterType) return false;
      return true;
    });
  }, [events, searchTerm, filterType]);

  // Date Navigation Handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  // Calendar ranges
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const monthCalendarDays = eachDayOfInterval({ 
    start: startOfWeek(monthStart), 
    end: endOfWeek(monthEnd) 
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate)
  });

  const dayEvents = events.filter(ev => isSameDay(ev.date, currentDate));

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'meeting': return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">Reunião</Badge>;
      case 'fiscal': return <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-[10px]">Prazo Fiscal</Badge>;
      case 'followup': return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Follow-up</Badge>;
      default: return <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Tarefa</Badge>;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/10">
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 hover:bg-muted rounded-lg transition-colors border border-border">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold bg-muted rounded-lg hover:bg-muted-hover transition-colors">
              Hoje
            </button>
            <button onClick={handleNext} className="p-2 hover:bg-muted rounded-lg transition-colors border border-border">
              <ChevronRight size={16} />
            </button>
          </div>
          <h3 className="font-bold text-base capitalize">
            {viewMode === 'day' ? format(currentDate, "dd 'de' MMMM yyyy", { locale: ptBR }) :
             viewMode === 'week' ? `Semana de ${format(weekDays[0], 'dd/MM')} a ${format(weekDays[6], 'dd/MM/yyyy')}` :
             format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input 
              placeholder="Pesquisar compromissos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-background h-8 text-xs"
            />
          </div>

          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-32 bg-background h-8 text-xs">
            <option value="all">Todos tipos</option>
            <option value="task">Tarefas</option>
            <option value="meeting">Reuniões</option>
            <option value="fiscal">Prazos Fiscais</option>
            <option value="followup">Follow-ups</option>
          </Select>

          {/* View Mode Tabs */}
          <div className="bg-muted p-1 rounded-lg flex items-center gap-1 border border-border text-xs font-semibold">
            {(['month', 'week', 'day', 'list'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors capitalize",
                  viewMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === 'month' ? 'Mês' : m === 'week' ? 'Semana' : m === 'day' ? 'Dia' : 'Lista'}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={onAddTask} className="gap-1.5 h-8 text-xs">
            <Plus size={14} /> Novo Evento
          </Button>
        </div>
      </div>

      {/* View Render */}
      <div className="flex-1 overflow-y-auto">
        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-border bg-muted/20">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase border-r border-border last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
              {monthCalendarDays.map((day, idx) => {
                const dayEvs = filteredEvents.filter(ev => isSameDay(ev.date, day));
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "min-h-[110px] p-2 border-b border-r border-border transition-colors hover:bg-muted/10 flex flex-col",
                      !isSameMonth(day, monthStart) && "bg-muted/5 opacity-40",
                      isSameDay(day, new Date()) && "bg-primary/5"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                        isSameDay(day, new Date()) && "bg-primary text-white"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1 flex-1 overflow-y-auto">
                      {dayEvs.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          onClick={() => {
                            if (ev.card) onSelectCard(ev.card);
                            else if (ev.task) onSelectTask(ev.task);
                          }}
                          className={cn(
                            "text-[10px] font-semibold p-1.5 rounded border truncate cursor-pointer transition-transform hover:scale-[1.02]",
                            ev.type === 'meeting' ? "bg-warning/10 text-warning border-warning/30" :
                            ev.type === 'fiscal' ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" :
                            "bg-primary/10 text-primary border-primary/30"
                          )}
                          title={ev.title}
                        >
                          {format(ev.date, 'HH:mm')} {ev.title}
                        </div>
                      ))}
                      {dayEvs.length > 3 && (
                        <div className="text-[10px] text-muted-foreground text-center font-bold">
                          +{dayEvs.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 h-full divide-x divide-border">
            {weekDays.map((day, idx) => {
              const dayEvs = filteredEvents.filter(ev => isSameDay(ev.date, day));
              return (
                <div key={idx} className={cn("flex flex-col h-full", isSameDay(day, new Date()) && "bg-primary/5")}>
                  <div className="p-3 text-center border-b border-border bg-muted/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className={cn("text-lg font-bold mt-0.5", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</p>
                  </div>
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {dayEvs.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (ev.card) onSelectCard(ev.card);
                          else if (ev.task) onSelectTask(ev.task);
                        }}
                        className="bg-card border border-border rounded-lg p-2.5 shadow-xs cursor-pointer hover:border-primary transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground">{format(ev.date, 'HH:mm')}</span>
                          {getTypeBadge(ev.type)}
                        </div>
                        <p className="text-xs font-bold text-foreground">{ev.title}</p>
                        {ev.card && <p className="text-[10px] text-muted-foreground truncate">Cliente: {ev.card.clientName}</p>}
                      </div>
                    ))}
                    {dayEvs.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-8">Nenhum evento</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <div className="max-w-2xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-bold text-lg">{format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h4>
                <p className="text-xs text-muted-foreground">{dayEvents.length} compromissos agendados para este dia.</p>
              </div>
            </div>
            <div className="space-y-3">
              {dayEvents.map(ev => (
                <div 
                  key={ev.id}
                  onClick={() => {
                    if (ev.card) onSelectCard(ev.card);
                    else if (ev.task) onSelectTask(ev.task);
                  }}
                  className="bg-card border border-border rounded-xl p-4 shadow-xs hover:border-primary cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center bg-muted/30 p-2 rounded-lg border border-border">
                      <span className="text-xs font-bold text-foreground block">{format(ev.date, 'HH:mm')}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-foreground">{ev.title}</span>
                        {getTypeBadge(ev.type)}
                      </div>
                      {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                      {ev.card && <p className="text-xs font-medium text-primary mt-1">Cliente: {ev.card.clientName} ({ev.card.companyName || 'Empresa'})</p>}
                    </div>
                  </div>
                </div>
              ))}
              {dayEvents.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Clock size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Nenhum evento agendado para hoje.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Data / Hora</th>
                  <th className="py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Compromisso / Tarefa</th>
                  <th className="py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente Relacionado</th>
                  <th className="py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEvents.map(ev => (
                  <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-foreground whitespace-nowrap">
                      {format(ev.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-bold text-foreground">{ev.title}</p>
                      {ev.description && <p className="text-[10px] text-muted-foreground truncate max-w-xs">{ev.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      {getTypeBadge(ev.type)}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {ev.card ? <span className="font-medium text-foreground">{ev.card.clientName}</span> : 'Nenhum'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-2.5"
                        onClick={() => {
                          if (ev.card) onSelectCard(ev.card);
                          else if (ev.task) onSelectTask(ev.task);
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground text-xs">
                      Nenhum compromisso encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
