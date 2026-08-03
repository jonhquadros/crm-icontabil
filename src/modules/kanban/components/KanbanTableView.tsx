import React, { useState } from 'react';
import { KanbanCard, KanbanColumn } from '../../clients/types';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { 
  ArrowUpDown, 
  MoreVertical, 
  CheckSquare, 
  Clock, 
  Trash2, 
  ArrowRight,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanTableViewProps {
  cards: KanbanCard[];
  columns: { id: string; label: string; color: string; order?: number }[];
  onSelectCard: (card: KanbanCard) => void;
  onBulkMove: (cardIds: string[], targetColumnId: string) => void;
  onBulkDelete: (cardIds: string[]) => void;
  onBulkResponsible: (cardIds: string[], responsible: string) => void;
}

type SortField = 'clientName' | 'companyName' | 'column' | 'responsible' | 'priority' | 'lastInteraction';
type SortOrder = 'asc' | 'desc';

export function KanbanTableView({
  cards,
  columns,
  onSelectCard,
  onBulkMove,
  onBulkDelete,
  onBulkResponsible
}: KanbanTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('lastInteraction');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeMenuCardId, setActiveMenuCardId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cards.map(c => c.id));
    }
  };

  const toggleSelectCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    let valA: any = a[sortField as keyof KanbanCard] || '';
    let valB: any = b[sortField as keyof KanbanCard] || '';

    if (sortField === 'lastInteraction') {
      valA = a.lastInteraction?.toMillis ? a.lastInteraction.toMillis() : (a.lastInteraction ? new Date(a.lastInteraction as any).getTime() : 0);
      valB = b.lastInteraction?.toMillis ? b.lastInteraction.toMillis() : (b.lastInteraction ? new Date(b.lastInteraction as any).getTime() : 0);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getColumnBadge = (colId: string) => {
    const col = columns.find(c => c.id === colId);
    return (
      <Badge variant="outline" className={`text-xs gap-1.5 font-semibold ${col?.color || 'bg-slate-100'} text-white border-transparent`}>
        {col?.label || colId}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <span className="text-danger font-bold text-xs">Urgente</span>;
      case 'high': return <span className="text-warning font-bold text-xs">Alta</span>;
      case 'medium': return <span className="text-primary font-bold text-xs">Média</span>;
      default: return <span className="text-muted-foreground text-xs">Baixa</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk actions bar if items selected */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center justify-between animate-fade-in text-xs">
          <span className="font-semibold text-primary">
            {selectedIds.length} oportunidade(s) selecionada(s)
          </span>
          <div className="flex items-center gap-2">
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  onBulkMove(selectedIds, e.target.value);
                  setSelectedIds([]);
                }
              }}
              defaultValue=""
              className="bg-background border border-border rounded-md px-2 py-1 text-xs"
            >
              <option value="" disabled>Mover para etapa...</option>
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <Button 
              variant="destructive" 
              size="sm" 
              className="h-7 text-xs gap-1"
              onClick={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
            >
              <Trash2 size={12} /> Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold text-[10px]">
                <th className="p-3 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={cards.length > 0 && selectedIds.length === cards.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('clientName')}>
                  <div className="flex items-center gap-1">Cliente / Empresa <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('column')}>
                  <div className="flex items-center gap-1">Etapa Atual <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('responsible')}>
                  <div className="flex items-center gap-1">Responsável <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1">Prioridade <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 text-center">Tarefas</th>
                <th className="p-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('lastInteraction')}>
                  <div className="flex items-center gap-1">Última Interação <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhuma oportunidade encontrada neste pipeline.
                  </td>
                </tr>
              ) : (
                sortedCards.map((card) => {
                  const isSelected = selectedIds.includes(card.id);
                  return (
                    <tr 
                      key={card.id}
                      onClick={() => onSelectCard(card)}
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectCard(card.id, e as any)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{card.companyName || card.clientName}</div>
                        {card.companyName && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User size={10} /> {card.clientName}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {getColumnBadge(card.column)}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Avatar size="sm" fallback={(card.responsible || 'Atendente').substring(0, 2)} className="w-5 h-5 text-[10px]" />
                          <span>{card.responsible || 'Não atribuído'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {getPriorityBadge(card.priority)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground">
                          <CheckSquare size={12} className={card.tasksCompleted === card.tasksCount ? 'text-success' : ''} />
                          {card.tasksCompleted || 0}/{card.tasksCount || 0}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {card.lastInteraction?.toDate ? (
                          formatDistanceToNow(card.lastInteraction.toDate(), { locale: ptBR, addSuffix: true })
                        ) : (
                          'Recentemente'
                        )}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button 
                            onClick={() => setActiveMenuCardId(activeMenuCardId === card.id ? null : card.id)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuCardId === card.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveMenuCardId(null)} />
                              <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-50 py-1 text-left">
                                <button 
                                  onClick={() => { setActiveMenuCardId(null); onSelectCard(card); }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-muted text-xs"
                                >
                                  Ver Detalhes
                                </button>
                                <button 
                                  onClick={() => { setActiveMenuCardId(null); onBulkDelete([card.id]); }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-danger/10 text-danger text-xs"
                                >
                                  Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
