import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  DragDropContext, 
  Droppable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  MoreVertical
} from 'lucide-react';
import { kanbanService } from '../services/kanbanService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { db } from '../../../lib/firebase';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { KanbanCard, KanbanColumn, Pipeline, PipelineColumn } from '../../clients/types';
import { Button } from '../../../shared/components/ui/Button';
import { AddCardModal } from '../components/AddCardModal';
import { CRMHeader } from '../components/CRMHeader';
import { KanbanCardItem } from '../components/KanbanCardItem';
import { CardDrawer } from '../components/CardDrawer';
import { ManagePipelinesModal } from '../components/ManagePipelinesModal';
import { FilterModal, FilterState } from '../components/FilterModal';
import { KanbanTableView } from '../components/KanbanTableView';
import { CRMAgendaView } from '../components/CRMAgendaView';
import { ActivityTimelineFeed } from '../components/ActivityTimelineFeed';
import { CRMReportsView } from '../components/CRMReportsView';
import { taskService } from '../../tasks/services/taskService';
import { Task } from '../../tasks/types';
import { cn } from '../../../shared/utils/cn';
import toast from 'react-hot-toast';

const DEFAULT_COLUMNS: PipelineColumn[] = [
  { id: 'lead', label: 'Prospecção', color: 'bg-slate-400', order: 0 },
  { id: 'contact', label: 'Contato', color: 'bg-primary', order: 1 },
  { id: 'meeting', label: 'Reunião', color: 'bg-warning', order: 2 },
  { id: 'proposal', label: 'Proposta', color: 'bg-indigo-500', order: 3 },
  { id: 'closing', label: 'Negociação', color: 'bg-purple-500', order: 4 },
  { id: 'won', label: 'Ganho', color: 'bg-success', order: 5 },
  { id: 'lost', label: 'Perdido', color: 'bg-danger', order: 6 },
];

const DroppableComponent = Droppable as any;

export function KanbanPage() {
  const { userData, user } = useAuth();
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManagePipelinesOpen, setIsManagePipelinesOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Derive viewMode from location.pathname
  const viewMode = useMemo(() => {
    if (location.pathname.includes('/lista')) return 'list';
    if (location.pathname.includes('/agenda')) return 'agenda';
    if (location.pathname.includes('/atividades')) return 'activities';
    if (location.pathname.includes('/relatorios')) return 'reports';
    return 'kanban';
  }, [location.pathname]);

  const handleViewModeChange = (mode: string) => {
    if (mode === 'kanban') navigate('/dashboard/crm/pipeline');
    else if (mode === 'list') navigate('/dashboard/crm/lista');
    else if (mode === 'agenda') navigate('/dashboard/crm/agenda');
    else if (mode === 'activities') navigate('/dashboard/crm/atividades');
    else if (mode === 'reports') navigate('/dashboard/crm/relatorios');
  };

  // URL search params for search and responsible filter
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const selectedResponsible = searchParams.get('responsible') || 'all';

  // Advanced filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    responsible: [],
    stages: [],
    priorities: [],
    origins: [],
    labels: [],
    city: ''
  });

  const handleSearchChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('search', val);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

  const handleResponsibleChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== 'all') newParams.set('responsible', val);
    else newParams.delete('responsible');
    setSearchParams(newParams);
  };

  const availableResponsibles = useMemo(() => {
    return Array.from(new Set(cards.map(c => c.responsible).filter(Boolean)));
  }, [cards]);

  const availableOrigins = useMemo(() => {
    return Array.from(new Set(cards.map(c => c.origin).filter(Boolean)));
  }, [cards]);

  const availableLabels = useMemo(() => {
    return Array.from(new Set(cards.flatMap(c => c.labels || []).filter(Boolean)));
  }, [cards]);

  const activeFiltersCount = useMemo(() => {
    return (
      (filters.responsible.length > 0 ? filters.responsible.length : 0) +
      (filters.stages.length > 0 ? filters.stages.length : 0) +
      (filters.priorities.length > 0 ? filters.priorities.length : 0) +
      (filters.origins.length > 0 ? filters.origins.length : 0) +
      (filters.labels.length > 0 ? filters.labels.length : 0) +
      (filters.city ? 1 : 0) +
      (selectedResponsible !== 'all' ? 1 : 0) +
      (searchTerm ? 1 : 0)
    );
  }, [filters, selectedResponsible, searchTerm]);

  // Memoized filtered cards (filters both Kanban and List simultaneously)
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchClient = card.clientName?.toLowerCase().includes(query);
        const matchCompany = card.companyName?.toLowerCase().includes(query);
        const matchPhone = card.phone?.toLowerCase().includes(query);
        const matchEmail = card.email?.toLowerCase().includes(query);
        const matchDoc = card.document?.toLowerCase().includes(query);
        if (!matchClient && !matchCompany && !matchPhone && !matchEmail && !matchDoc) {
          return false;
        }
      }

      if (selectedResponsible !== 'all' && card.responsible !== selectedResponsible) {
        return false;
      }

      if (filters.responsible.length > 0 && !filters.responsible.includes(card.responsible)) {
        return false;
      }

      if (filters.stages.length > 0 && !filters.stages.includes(card.column)) {
        return false;
      }

      if (filters.priorities.length > 0 && !filters.priorities.includes(card.priority)) {
        return false;
      }

      if (filters.origins.length > 0 && !filters.origins.includes(card.origin)) {
        return false;
      }

      if (filters.labels.length > 0 && !card.labels?.some(l => filters.labels.includes(l))) {
        return false;
      }

      if (filters.city) {
        const cardCity = typeof card.address === 'object' ? card.address?.city : '';
        if (!cardCity?.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [cards, searchTerm, selectedResponsible, filters]);

  // Subscribe to pipelines
  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubscribe = kanbanService.subscribeToPipelines(userData.companyId, (data) => {
      setPipelines(data);
      if (data.length > 0 && !selectedPipelineId) {
        // Set default pipeline
        const defaultPipeline = data.find(p => p.isDefault) || data[0];
        setSelectedPipelineId(defaultPipeline.id);
      } else if (data.length === 0) {
        // Seed the 5 default pipelines as requested by Phase 05
        const seedPipelines = async () => {
          const batch = writeBatch(db);
          const defaultPipes = [
            {
              id: `pipe_prospeccao_${Date.now()}`,
              name: 'Prospecção',
              isDefault: true,
              columns: [
                { id: 'lead', label: 'Novo Lead', color: 'bg-slate-400', order: 0 },
                { id: 'contact', label: 'Primeiro Contato', color: 'bg-primary', order: 1 },
                { id: 'proposal', label: 'Proposta', color: 'bg-indigo-500', order: 2 },
                { id: 'negotiation', label: 'Negociação', color: 'bg-purple-500', order: 3 },
                { id: 'won', label: 'Ganho', color: 'bg-success', order: 4 },
                { id: 'lost', label: 'Perdido', color: 'bg-danger', order: 5 },
              ]
            },
            {
              id: `pipe_abertura_${Date.now()}`,
              name: 'Abertura de Empresa',
              isDefault: false,
              columns: [
                { id: 'solicitation', label: 'Solicitação', color: 'bg-slate-400', order: 0 },
                { id: 'documentation', label: 'Documentação', color: 'bg-primary', order: 1 },
                { id: 'analysis', label: 'Análise', color: 'bg-warning', order: 2 },
                { id: 'protocol', label: 'Protocolo', color: 'bg-indigo-500', order: 3 },
                { id: 'waiting', label: 'Aguardando', color: 'bg-purple-500', order: 4 },
                { id: 'completed', label: 'Concluído', color: 'bg-success', order: 5 },
              ]
            },
            {
              id: `pipe_troca_${Date.now()}`,
              name: 'Troca de Contador',
              isDefault: false,
              columns: [
                { id: 'contact', label: 'Contato', color: 'bg-slate-400', order: 0 },
                { id: 'distrato', label: 'Distrato', color: 'bg-primary', order: 1 },
                { id: 'transfer', label: 'Transferência', color: 'bg-warning', order: 2 },
                { id: 'active', label: 'Ativo', color: 'bg-success', order: 3 },
                { id: 'closed', label: 'Encerrado', color: 'bg-danger', order: 4 },
              ]
            },
            {
              id: `pipe_fiscal_${Date.now()}`,
              name: 'Departamento Fiscal',
              isDefault: false,
              columns: [
                { id: 'receiving', label: 'Recebimento', color: 'bg-slate-400', order: 0 },
                { id: 'analysis', label: 'Análise', color: 'bg-primary', order: 1 },
                { id: 'entry', label: 'Lançamento', color: 'bg-warning', order: 2 },
                { id: 'review', label: 'Revisão', color: 'bg-purple-500', order: 3 },
                { id: 'delivered', label: 'Entregue', color: 'bg-success', order: 4 },
              ]
            },
            {
              id: `pipe_consultoria_${Date.now()}`,
              name: 'Consultoria',
              isDefault: false,
              columns: [
                { id: 'diagnosis', label: 'Diagnóstico', color: 'bg-slate-400', order: 0 },
                { id: 'proposal', label: 'Proposta', color: 'bg-primary', order: 1 },
                { id: 'execution', label: 'Execução', color: 'bg-warning', order: 2 },
                { id: 'delivery', label: 'Entrega', color: 'bg-purple-500', order: 3 },
                { id: 'closed', label: 'Fechado', color: 'bg-success', order: 4 },
              ]
            }
          ];

          defaultPipes.forEach((pipe) => {
            const pRef = doc(db, 'pipelines', pipe.id);
            batch.set(pRef, {
              id: pipe.id,
              companyId: userData.companyId,
              name: pipe.name,
              isDefault: pipe.isDefault,
              columns: pipe.columns,
              active: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              createdBy: user?.uid || 'system'
            });

            pipe.columns.forEach((col) => {
              const sRef = doc(db, 'pipelines', pipe.id, 'stages', col.id);
              batch.set(sRef, {
                id: col.id,
                pipelineId: pipe.id,
                companyId: userData.companyId,
                name: col.label,
                color: col.color,
                position: col.order,
                isWon: col.id === 'won' || col.id === 'completed' || col.id === 'active' || col.id === 'delivered',
                isLost: col.id === 'lost' || col.id === 'closed',
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user?.uid || 'system'
              });
            });
          });

          await batch.commit();
        };

        seedPipelines().catch(err => {
          console.error("Error creating default pipelines", err);
        });
      }
    });

    return () => unsubscribe();
  }, [userData?.companyId, selectedPipelineId, user?.uid]);

  // Subscribe to cards of selected pipeline
  useEffect(() => {
    if (!userData?.companyId || !selectedPipelineId) return;

    const unsubscribe = kanbanService.subscribeToCards(userData.companyId, selectedPipelineId, (data) => {
      setCards(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.companyId, selectedPipelineId]);

  // Subscribe to tasks for agenda view
  useEffect(() => {
    if (!userData?.companyId) return;
    const unsubscribe = taskService.subscribeToTasks(userData.companyId, (data) => {
      setTasks(data);
    });
    return () => unsubscribe();
  }, [userData?.companyId]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceCol = source.droppableId as KanbanColumn;
    const destCol = destination.droppableId as KanbanColumn;
    
    // Optimistic update
    const updatedCards = [...cards] as any[];
    const movedCardIndex = updatedCards.findIndex(c => c.id === draggableId);
    if (movedCardIndex !== -1) {
      const movedCard = { ...updatedCards[movedCardIndex] };
      updatedCards.splice(movedCardIndex, 1);
      movedCard.column = destCol;
      updatedCards.splice(destination.index, 0, movedCard);
      setCards(updatedCards as KanbanCard[]);
    }

    try {
      await kanbanService.updateCardPosition(draggableId, destCol, destination.index);
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error('Erro ao mover card. Sincronizando...');
    }
  };

  const handleBulkMove = async (cardIds: string[], targetColumnId: string) => {
    try {
      const batch = writeBatch(db);
      cardIds.forEach(id => {
        const ref = doc(db, 'kanban', id);
        batch.update(ref, { column: targetColumnId, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      toast.success('Oportunidades movidas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao mover oportunidades');
    }
  };

  const handleBulkDelete = async (cardIds: string[]) => {
    try {
      const batch = writeBatch(db);
      cardIds.forEach(id => {
        const ref = doc(db, 'kanban', id);
        batch.delete(ref);
      });
      await batch.commit();
      toast.success('Oportunidades excluídas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir oportunidades');
    }
  };

  const getCardsByColumn = (colId: KanbanColumn) => {
    return filteredCards.filter(card => card.column === colId);
  };

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const currentColumns = currentPipeline?.columns?.sort((a, b) => a.order - b.order) || DEFAULT_COLUMNS;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <CRMHeader 
        cards={cards} 
        onAddCard={() => setIsAddModalOpen(true)}
        pipelines={pipelines}
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={setSelectedPipelineId}
        onConfigurePipelines={() => setIsManagePipelinesOpen(true)}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedResponsible={selectedResponsible}
        onResponsibleChange={handleResponsibleChange}
        availableResponsibles={availableResponsibles}
        onOpenFilters={() => setIsFilterModalOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={userData?.companyId || ''}
        userId={user?.uid || ''}
        pipelineId={selectedPipelineId}
      />

      <ManagePipelinesModal
        isOpen={isManagePipelinesOpen}
        onClose={() => setIsManagePipelinesOpen(false)}
        pipelines={pipelines}
        companyId={userData?.companyId || ''}
        userId={user?.uid || ''}
        onPipelineCreated={(newId) => setSelectedPipelineId(newId)}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        onClearFilters={() => setFilters({
          responsible: [],
          stages: [],
          priorities: [],
          origins: [],
          labels: [],
          city: ''
        })}
        columns={currentColumns}
        availableResponsibles={availableResponsibles}
        availableOrigins={availableOrigins}
        availableLabels={availableLabels}
      />

      {viewMode === 'agenda' ? (
        <div className="flex-1 overflow-y-auto pb-4">
          <CRMAgendaView
            cards={cards}
            tasks={tasks}
            onSelectCard={(card) => setSelectedCard(card)}
            onSelectTask={(task) => {}}
            onAddTask={() => {}}
          />
        </div>
      ) : viewMode === 'activities' ? (
        <div className="flex-1 overflow-y-auto pb-4">
          <ActivityTimelineFeed
            cards={cards}
            onSelectCard={(card) => setSelectedCard(card)}
          />
        </div>
      ) : viewMode === 'reports' ? (
        <div className="flex-1 overflow-y-auto pb-4">
          <CRMReportsView
            cards={cards}
            columns={currentColumns}
            tasks={tasks}
          />
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex-1 overflow-y-auto pb-4">
          <KanbanTableView
            cards={filteredCards}
            columns={currentColumns}
            onSelectCard={(card) => setSelectedCard(card)}
            onBulkMove={handleBulkMove}
            onBulkDelete={handleBulkDelete}
            onBulkResponsible={() => {}}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full min-w-max">
              {currentColumns.map((column) => (
                <div key={column.id} className="w-72 flex flex-col bg-muted/30 rounded-xl border border-border">
                  <div className="p-4 flex items-center justify-between border-b border-border bg-card rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", column.color)} />
                      <h3 className="font-bold text-sm">{column.label}</h3>
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">
                        {getCardsByColumn(column.id).length}
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  <DroppableComponent droppableId={column.id}>
                    {(provided: any, snapshot: any) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 p-3 space-y-3 overflow-y-auto transition-colors",
                          snapshot.isDraggingOver && "bg-primary/5"
                        )}
                      >
                        {getCardsByColumn(column.id).map((card, index) => (
                          <KanbanCardItem key={card.id} card={card} index={index} onClick={() => setSelectedCard(card)} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </DroppableComponent>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      <CardDrawer 
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        columns={currentColumns}
      />
    </div>
  );
}
