import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { 
  MoreVertical, 
  MessageCircle, 
  Phone, 
  Clock,
  Paperclip,
  CheckSquare,
  FileText,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { KanbanCard } from '../../clients/types';
import { cn } from '../../../shared/utils/cn';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Badge } from '../../../shared/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardItemProps {
  card: KanbanCard;
  index: number;
  key?: React.Key;
  onClick?: () => void;
  onDelete?: () => void;
}

const DraggableComponent = Draggable as any;

export function KanbanCardItem({ card, index, onClick, onDelete }: KanbanCardItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-danger/10 text-danger border-danger/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  // Tempo parado na etapa
  const stuckDate = card.stuckSince?.toDate?.() || card.updatedAt?.toDate?.() || new Date();
  const timeStuck = formatDistanceToNow(stuckDate, { locale: ptBR, addSuffix: false });

  // Data da última interação
  const interactionDate = card.lastInteraction?.toDate?.() || card.updatedAt?.toDate?.() || new Date();
  const lastInteraction = formatDistanceToNow(interactionDate, { locale: ptBR, addSuffix: true });

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <DraggableComponent draggableId={card.id} index={index}>
      {(provided: any, snapshot: any) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all group relative cursor-pointer",
            snapshot.isDragging && "shadow-xl ring-2 ring-primary/20 border-primary"
          )}
        >
          {/* Topo do card: Badges e Menu */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-wrap gap-1.5 flex-1 pr-4">
              <Badge variant="outline" className={cn("border font-bold uppercase tracking-wider", getPriorityColor(card.priority))}>
                {getPriorityLabel(card.priority)}
              </Badge>
              {card.labels?.map((label, idx) => (
                <Badge key={`${card.id}-label-${idx}`} variant="default" className="font-medium">
                  {label}
                </Badge>
              ))}
            </div>
            
            <div className="relative">
              <button 
                onClick={(e) => {
                  stopPropagation(e);
                  setShowMenu(!showMenu);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { stopPropagation(e); setShowMenu(false); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-md shadow-lg z-50 py-1 overflow-hidden">
                    <button className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                      <Edit2 size={12} /> Editar
                    </button>
                    <button className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                      <ArrowRight size={12} /> Mover
                    </button>
                    <div className="h-px bg-border my-1"></div>
                    <button 
                      onClick={(e) => {
                        stopPropagation(e);
                        setShowMenu(false);
                        if (onDelete) onDelete();
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-danger/10 text-danger flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Corpo do card */}
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1" title={card.companyName || card.clientName}>
              {card.companyName || card.clientName}
            </h4>
            {card.companyName && (
              <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{card.clientName}</p>
            )}
            
            {card.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Phone size={12} />
                <span>{card.phone}</span>
              </div>
            )}
          </div>

          {/* Rodapé do card: Avatar e Tempos */}
          <div className="flex items-center justify-between py-3 border-t border-b border-border/50 mb-3">
            <div className="flex items-center gap-2">
              <Avatar 
                size="sm" 
                fallback={card.responsible.substring(0, 2)} 
                className="w-6 h-6 border-slate-200 dark:border-slate-800"
              />
              <span className="text-[10px] font-medium max-w-[80px] truncate" title={card.responsible}>
                {card.responsible}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Tempo parado na etapa">
                <Clock size={10} />
                <span>{timeStuck}</span>
              </div>
              <div className="text-[9px] text-muted-foreground/70 mt-0.5" title="Última interação">
                {lastInteraction}
              </div>
            </div>
          </div>

          {/* Ícones de contagem */}
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] hover:text-foreground transition-colors" title="Mensagens do WhatsApp">
                <MessageCircle size={12} className={card.messagesCount ? "text-success" : ""} />
                <span>{card.messagesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] hover:text-foreground transition-colors" title="Documentos anexados">
                <Paperclip size={12} />
                <span>{card.documentsCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] hover:text-foreground transition-colors" title="Tarefas vinculadas">
                <CheckSquare size={12} className={card.tasksCompleted === card.tasksCount && card.tasksCount! > 0 ? "text-success" : ""} />
                <span>{card.tasksCompleted || 0}/{card.tasksCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] hover:text-foreground transition-colors" title="Observações/Notas internas">
                <FileText size={12} />
                <span>{card.notesCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DraggableComponent>
  );
}
