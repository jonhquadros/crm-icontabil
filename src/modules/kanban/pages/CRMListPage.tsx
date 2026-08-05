import React, { useState, useEffect } from 'react';
import { CRMHeader } from '../components/CRMHeader';
import { CardDrawer } from '../components/CardDrawer';
import { AddCardModal } from '../components/AddCardModal';
import { KanbanCard, Pipeline, PipelineColumn } from '../../clients/types';
import { useAuth } from '../../../app/providers/AuthProvider';
import { kanbanService } from '../services/kanbanService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../../shared/utils/cn';
import { 
  MessageCircle, 
  Phone, 
  MoreHorizontal,
  Clock,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import { Avatar } from '../../../shared/components/ui/Avatar';

const DEFAULT_COLUMNS: PipelineColumn[] = [
  { id: 'lead', label: 'Prospecção', color: 'bg-slate-400', order: 0 },
  { id: 'contact', label: 'Contato', color: 'bg-primary', order: 1 },
  { id: 'meeting', label: 'Reunião', color: 'bg-warning', order: 2 },
  { id: 'proposal', label: 'Proposta', color: 'bg-indigo-500', order: 3 },
  { id: 'closing', label: 'Negociação', color: 'bg-purple-500', order: 4 },
  { id: 'won', label: 'Ganho', color: 'bg-success', order: 5 },
  { id: 'lost', label: 'Perdido', color: 'bg-danger', order: 6 },
];

export function CRMListPage() {
  const { userData, user } = useAuth();
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to pipelines
  useEffect(() => {
    if (!userData?.companyId) return;
    const unsubscribe = kanbanService.subscribeToPipelines(userData.companyId, (data) => {
      setPipelines(data);
      if (data.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(data.find(p => p.isDefault)?.id || data[0].id);
      }
    });
    return () => unsubscribe();
  }, [userData?.companyId, selectedPipelineId]);

  // Subscribe to cards of selected pipeline
  useEffect(() => {
    if (!userData?.companyId || !selectedPipelineId) return;
    const unsubscribe = kanbanService.subscribeToCards(userData.companyId, selectedPipelineId, (data) => {
      setCards(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.companyId, selectedPipelineId]);

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const currentColumns = currentPipeline?.columns?.sort((a, b) => a.order - b.order) || DEFAULT_COLUMNS;

  // Sorting & Filtering
  const getPriorityWeight = (p: string) => {
    if (p === 'urgent') return 4;
    if (p === 'high') return 3;
    if (p === 'medium') return 2;
    return 1;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-danger/10 text-danger border-danger/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredAndSortedCards = cards
    .filter(c => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.clientName.toLowerCase().includes(term) ||
        c.companyName?.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.origin?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        const nameA = a.companyName || a.clientName;
        const nameB = b.companyName || b.clientName;
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'priority') {
        comparison = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      } else if (sortField === 'column') {
        const colA = currentColumns.findIndex(c => c.id === a.column);
        const colB = currentColumns.findIndex(c => c.id === b.column);
        comparison = colA - colB;
      } else if (sortField === 'updatedAt') {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        comparison = timeA - timeB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, label }: { field: string, label: string }) => (
    <th 
      className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <ArrowUpDown size={12} className={cn("transition-transform", sortDirection === 'desc' && "rotate-180")} />
        )}
      </div>
    </th>
  );

  return (
    <div className="h-[calc(100vh-190px)] flex flex-col gap-4">
      <CRMHeader 
        cards={cards} 
        onAddCard={() => setIsAddModalOpen(true)}
        pipelines={pipelines}
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={setSelectedPipelineId}
      />

      <div className="flex-1 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Filtros em linha específicos da tabela */}
        <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar nesta lista..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredAndSortedCards.length} registro(s) encontrado(s)
          </span>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 sticky top-0 z-10 shadow-sm border-b border-border">
              <tr>
                <SortableHeader field="name" label="Cliente / Oportunidade" />
                <SortableHeader field="column" label="Etapa Atual" />
                <SortableHeader field="priority" label="Prioridade" />
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</th>
                <SortableHeader field="updatedAt" label="Última Atualização" />
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando dados...
                  </td>
                </tr>
              ) : filteredAndSortedCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Search size={24} className="text-muted-foreground/50" />
                      </div>
                      <p>Nenhuma oportunidade encontrada.</p>
                      {searchTerm && <p className="text-xs mt-1">Tente mudar os filtros de pesquisa.</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedCards.map(card => {
                  const col = currentColumns.find(c => c.id === card.column);
                  
                  return (
                    <tr 
                      key={card.id} 
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCard(card)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {card.companyName || card.clientName}
                          </span>
                          {card.companyName && (
                            <span className="text-xs text-muted-foreground">{card.clientName}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-background">
                          <div className={cn("w-2 h-2 rounded-full mr-2", col?.color)} />
                          {col?.label || 'Desconhecido'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn("border font-medium capitalize", getPriorityColor(card.priority))}>
                          {card.priority === 'urgent' ? 'Urgente' : card.priority === 'high' ? 'Alta' : card.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {card.whatsapp && <MessageCircle size={16} className="text-success cursor-pointer hover:opacity-80" onClick={(e) => e.stopPropagation()} />}
                          {card.phone && <Phone size={16} className="text-primary cursor-pointer hover:opacity-80" onClick={(e) => e.stopPropagation()} />}
                          <span className="text-xs text-muted-foreground">{card.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm" fallback={card.responsible.substring(0,2)} className="w-6 h-6" />
                          <span className="text-xs font-medium">{card.responsible}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {card.updatedAt?.toDate ? format(card.updatedAt.toDate(), "dd/MM/yyyy HH:mm") : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={userData?.companyId || ''}
        userId={user?.uid || ''}
        pipelineId={selectedPipelineId}
      />

      <CardDrawer 
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        columns={currentColumns}
      />
    </div>
  );
}
