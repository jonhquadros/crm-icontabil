import React, { useState, useEffect } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Plus, 
  MoreVertical, 
  MessageCircle, 
  Phone, 
  Clock,
  AlertCircle,
  Flag
} from 'lucide-react';
import { kanbanService } from '../services/kanbanService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { KanbanCard, KanbanColumn } from '../../clients/types';
import { Button } from '../../../shared/components/ui/Button';
import { AddCardModal } from '../components/AddCardModal';
import { cn } from '../../../shared/utils/cn';
import toast from 'react-hot-toast';

const COLUMNS: { id: KanbanColumn; label: string; color: string }[] = [
  { id: 'lead', label: 'Prospecção', color: 'bg-slate-400' },
  { id: 'contact', label: 'Contato', color: 'bg-primary' },
  { id: 'meeting', label: 'Reunião', color: 'bg-warning' },
  { id: 'proposal', label: 'Proposta', color: 'bg-indigo-500' },
  { id: 'closing', label: 'Negociação', color: 'bg-purple-500' },
  { id: 'won', label: 'Ganho', color: 'bg-success' },
  { id: 'lost', label: 'Perdido', color: 'bg-danger' },
];

const DraggableComponent = Draggable as any;
const DroppableComponent = Droppable as any;

export function KanbanPage() {
  const { userData, user } = useAuth();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubscribe = kanbanService.subscribeToCards(userData.companyId, (data) => {
      setCards(data);
      setLoading(false);
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

  const getCardsByColumn = (colId: KanbanColumn) => {
    return cards.filter(card => card.column === colId);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CRM de Vendas</h2>
          <p className="text-muted-foreground text-sm">Acompanhe seus leads e oportunidades de negócio.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Novo Card
        </Button>
      </div>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={userData?.companyId || ''}
        userId={user?.uid || ''}
      />

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => (
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
                        <DraggableComponent key={card.id} draggableId={card.id} index={index}>
                          {(provided: any, snapshot: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all group",
                                snapshot.isDragging && "shadow-xl ring-2 ring-primary/20 border-primary"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                  card.priority === 'high' ? "bg-danger/10 text-danger" : 
                                  card.priority === 'medium' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                                )}>
                                  {card.priority === 'high' ? 'Alta' : card.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">{card.origin}</span>
                              </div>
                              
                              <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                                {card.companyName || card.clientName}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-4">{card.clientName}</p>

                              <div className="flex flex-wrap gap-1 mb-4">
                                {card.labels?.map(label => (
                                  <span key={label} className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-medium text-muted-foreground border border-border">
                                    {label}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                                <div className="flex items-center gap-3">
                                  {card.whatsapp && <MessageCircle size={14} className="text-success opacity-60 hover:opacity-100 cursor-pointer" />}
                                  {card.phone && <Phone size={14} className="text-primary opacity-60 hover:opacity-100 cursor-pointer" />}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock size={12} />
                                  <span>2d</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </DraggableComponent>
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
    </div>
  );
}
