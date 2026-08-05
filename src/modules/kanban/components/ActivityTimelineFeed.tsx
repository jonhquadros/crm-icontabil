import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  User, 
  ArrowRight, 
  MessageCircle, 
  Paperclip, 
  CheckSquare, 
  FileText, 
  ListChecks,
  Search,
  Filter
} from 'lucide-react';
import { KanbanCard, TimelineEvent } from '../../clients/types';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select } from '../../../shared/components/ui/Select';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { cn } from '../../../shared/utils/cn';
import { useAuth } from '../../../app/providers/AuthProvider';
import { getFormattedUserName } from '../../../shared/utils/userUtils';

interface ActivityTimelineFeedProps {
  cards: KanbanCard[];
  onSelectCard: (card: KanbanCard) => void;
}

export function ActivityTimelineFeed({ cards = [], onSelectCard }: ActivityTimelineFeedProps) {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Flatten all timeline events from all cards, adding card reference
  const allEvents = useMemo(() => {
    const list: Array<TimelineEvent & { card: KanbanCard }> = [];

    cards.forEach(card => {
      // Add initial creation event
      if (card.createdAt) {
        list.push({
          id: `init_${card.id}`,
          type: 'created',
          title: `Oportunidade Criada: ${card.clientName}`,
          description: `Lead cadastrado na etapa "${card.column}" (${card.companyName || 'Empresa não informada'})`,
          author: getFormattedUserName(card.createdBy || card.responsible, [], userData),
          createdAt: card.createdAt?.toDate ? card.createdAt.toDate().toISOString() : new Date().toISOString(),
          card
        });
      }

      // Add timeline array items
      if (card.timeline && Array.isArray(card.timeline)) {
        card.timeline.forEach(evt => {
          list.push({
            ...evt,
            title: `${card.clientName}: ${evt.title}`,
            card
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cards]);

  const availableUsers = useMemo(() => {
    return Array.from(new Set(allEvents.map(e => e.author).filter(Boolean)));
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(evt => {
      // Search term (client name, description, author)
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchTitle = evt.title?.toLowerCase().includes(query);
        const matchDesc = evt.description?.toLowerCase().includes(query);
        const matchAuthor = evt.author?.toLowerCase().includes(query);
        const matchClient = evt.card.clientName?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchAuthor && !matchClient) return false;
      }

      // User filter
      if (selectedUser !== 'all' && evt.author !== selectedUser) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && evt.type !== selectedType) {
        return false;
      }

      // Period filter
      if (selectedPeriod !== 'all') {
        const evtDate = new Date(evt.createdAt);
        const now = new Date();
        if (selectedPeriod === 'today') {
          const isToday = evtDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (selectedPeriod === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (isBefore(evtDate, weekAgo)) return false;
        } else if (selectedPeriod === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          if (isBefore(evtDate, monthAgo)) return false;
        }
      }

      return true;
    });
  }, [allEvents, searchTerm, selectedUser, selectedType, selectedPeriod]);

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created': return <User className="text-primary" size={16} />;
      case 'stage_change': return <ArrowRight className="text-warning" size={16} />;
      case 'message': return <MessageCircle className="text-success" size={16} />;
      case 'document': return <Paperclip className="text-indigo-500" size={16} />;
      case 'task': return <CheckSquare className="text-purple-500" size={16} />;
      case 'note': return <FileText className="text-amber-500" size={16} />;
      case 'checklist': return <ListChecks className="text-emerald-500" size={16} />;
      default: return <Clock className="text-muted-foreground" size={16} />;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
      {/* Filters Header */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3 items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3 flex-wrap flex-1 w-full">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Buscar em atividades, clientes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background h-9 text-xs"
            />
          </div>

          <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-40 bg-background text-xs h-9">
            <option value="all">Todos usuários</option>
            {availableUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>

          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-40 bg-background text-xs h-9">
            <option value="all">Todas ações</option>
            <option value="created">Criação</option>
            <option value="stage_change">Mudança de Etapa</option>
            <option value="message">Mensagens</option>
            <option value="task">Tarefas</option>
            <option value="note">Anotações</option>
            <option value="document">Documentos</option>
            <option value="checklist">Checklist</option>
          </Select>

          <Select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-36 bg-background text-xs h-9">
            <option value="all">Todo período</option>
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Último mês</option>
          </Select>
        </div>

        <div className="text-xs font-bold text-muted-foreground whitespace-nowrap">
          {filteredEvents.length} atividades encontradas
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Nenhuma atividade encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {filteredEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="relative flex items-start gap-4 text-xs group cursor-pointer"
                onClick={() => onSelectCard(evt.card)}
              >
                <div className="absolute -left-8 top-0 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-xs group-hover:border-primary transition-colors">
                  {getTimelineIcon(evt.type)}
                </div>
                
                <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-xs group-hover:border-primary/50 transition-all">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{evt.title}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-2">
                        {evt.card.clientName}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(evt.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} ({formatDistanceToNow(new Date(evt.createdAt), { locale: ptBR, addSuffix: true })})
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{evt.description}</p>
                  <div className="mt-3 text-[10px] text-muted-foreground/80 flex items-center gap-1">
                    <User size={10} /> Registrado por <span className="font-medium text-foreground">{getFormattedUserName(evt.author, [], userData)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
