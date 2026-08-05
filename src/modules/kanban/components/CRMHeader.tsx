import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  Settings, 
  Briefcase,
  Users,
  MessageCircle,
  CheckSquare,
  Pencil,
  Trash2
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Badge } from '../../../shared/components/ui/Badge';
import { usePermission } from '../../../shared/hooks/usePermission';
import { clientService } from '../../clients/services/clientService';
import { taskService } from '../../tasks/services/taskService';
import { whatsappService } from '../../whatsapp/services/whatsappService';
import { KanbanCard, Pipeline } from '../../clients/types';
import { useAuth } from '../../../app/providers/AuthProvider';

interface CRMHeaderProps {
  cards: KanbanCard[];
  onAddCard: () => void;
  pipelines: Pipeline[];
  selectedPipelineId: string | null;
  onPipelineChange: (id: string) => void;
  onConfigurePipelines?: (initialView?: 'list' | 'create' | 'edit', pipelineId?: string | null, initialDelete?: boolean) => void;
  viewMode?: 'kanban' | 'list' | 'agenda' | 'activities' | 'reports';
  onViewModeChange?: (mode: 'kanban' | 'list' | 'agenda' | 'activities' | 'reports') => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  selectedResponsible?: string;
  onResponsibleChange?: (val: string) => void;
  availableResponsibles?: string[];
  onOpenFilters?: () => void;
  activeFiltersCount?: number;
}

export function CRMHeader({ 
  cards = [], 
  onAddCard, 
  pipelines = [], 
  selectedPipelineId = null, 
  onPipelineChange = () => {}, 
  onConfigurePipelines = () => {},
  viewMode = 'kanban',
  onViewModeChange = () => {},
  searchTerm = '',
  onSearchChange = () => {},
  selectedResponsible = 'all',
  onResponsibleChange = () => {},
  availableResponsibles = [],
  onOpenFilters = () => {},
  activeFiltersCount = 0
}: CRMHeaderProps) {
  const { userData } = useAuth();
  const { isAdmin } = usePermission();
  
  const [totalClients, setTotalClients] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubClients = clientService.subscribeToClients(userData.companyId, (clients) => {
      setTotalClients(clients.length);
    });

    const unsubTasks = taskService.subscribeToTasks(userData.companyId, (tasks) => {
      setPendingTasks(tasks.filter(t => t.status !== 'completed').length);
    });

    const unsubChats = whatsappService.subscribeToChats(userData.companyId, (chats) => {
      setUnreadMessages(chats.filter(c => c.unreadCount > 0).length);
    });

    return () => {
      unsubClients();
      unsubTasks();
      unsubChats();
    };
  }, [userData?.companyId]);

  const openOpportunities = cards.filter(c => c.column !== 'won' && c.column !== 'lost').length;

  return (
    <div className="flex flex-col gap-4 mb-2">
      {/* Linha 1 — Título e indicadores rápidos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight">CRM</h2>
          <div className="h-6 w-[1px] bg-border hidden md:block"></div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 shadow-sm text-muted-foreground bg-background">
              <Users size={14} className="text-primary" />
              <span>{totalClients} clientes</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 shadow-sm text-muted-foreground bg-background">
              <Briefcase size={14} className="text-indigo-500" />
              <span>{openOpportunities} oportunidades</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 shadow-sm text-muted-foreground bg-background">
              <CheckSquare size={14} className={pendingTasks > 0 ? "text-warning" : "text-muted-foreground"} />
              <span>{pendingTasks} atividades</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 shadow-sm text-muted-foreground bg-background">
              <MessageCircle size={14} className={unreadMessages > 0 ? "text-danger" : "text-muted-foreground"} />
              <span>{unreadMessages} mensagens</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Linha 2 — Ações e filtros */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex items-center gap-1.5">
            <Select 
              value={selectedPipelineId || 'default'} 
              onChange={(e) => onPipelineChange(e.target.value)}
              className="w-48 bg-background"
            >
              {pipelines.length === 0 && <option value="default">Pipeline Padrão</option>}
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            {selectedPipelineId && selectedPipelineId !== 'default' && isAdmin && onConfigurePipelines && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onConfigurePipelines('edit', selectedPipelineId)}
                  className="p-2 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-lg border border-border bg-background transition-colors h-9 w-9 flex items-center justify-center"
                  title="Editar pipeline atual"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onConfigurePipelines('list', selectedPipelineId, true)}
                  className="p-2 hover:bg-danger/10 hover:text-danger text-muted-foreground rounded-lg border border-border bg-background transition-colors h-9 w-9 flex items-center justify-center"
                  title="Excluir pipeline atual"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
          
          <Select 
            value={selectedResponsible} 
            onChange={(e) => onResponsibleChange(e.target.value)}
            className="w-40 bg-background"
          >
            <option value="all">Todos responsáveis</option>
            {availableResponsibles.map(resp => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </Select>
          
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Buscar cliente, empresa, tel, email, CPF/CNPJ..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-background h-9"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          {onViewModeChange && viewMode && (
            <div className="bg-muted p-1 rounded-lg flex items-center gap-1 border border-border">
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => onViewModeChange('agenda')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'agenda' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Agenda
              </button>
              <button
                onClick={() => onViewModeChange('activities')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'activities' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Atividades
              </button>
              <button
                onClick={() => onViewModeChange('reports')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'reports' 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Relatórios
              </button>
            </div>
          )}

          <Button variant="outline" size="sm" className="gap-2 h-9 relative" onClick={onOpenFilters}>
            <Filter size={16} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => onConfigurePipelines('list')}>
              <Settings size={16} />
              Configurar Pipeline
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Plus size={16} />
            Novo Cliente
          </Button>
          
          <Button size="sm" className="gap-2 h-9" onClick={onAddCard}>
            <Plus size={16} />
            Nova Oportunidade
          </Button>
        </div>
      </div>
    </div>
  );
}
