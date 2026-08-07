import React, { useState, useEffect } from 'react';
import { 
  Kanban, 
  User, 
  Clock, 
  ExternalLink, 
  Plus, 
  ArrowRight,
  Activity,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Chat } from '../../../types';
import { KanbanCard, Pipeline, PipelineColumn } from '../../../../clients/types';
import { kanbanService } from '../../../../kanban/services/kanbanService';
import { useAuth } from '../../../../../app/providers/AuthProvider';
import { Button } from '../../../../../shared/components/ui/Button';

interface CRMTabProps {
  chat: Chat;
}

export function CRMTab({ chat }: CRMTabProps) {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  useEffect(() => {
    let unsubscribeCards: () => void = () => {};
    let unsubscribePipelines: () => void = () => {};

    unsubscribePipelines = kanbanService.subscribeToPipelines(companyId, (pipList) => {
      setPipelines(pipList);
    });

    unsubscribeCards = kanbanService.subscribeToCards(companyId, null, (cardList) => {
      // Filter cards related to this chat (by phone, clientName or companyName)
      const matching = cardList.filter(card => {
        if (chat.contactPhone && (card.phone === chat.contactPhone || card.whatsapp === chat.contactPhone)) return true;
        if (chat.contactName && card.clientName?.toLowerCase().includes(chat.contactName.toLowerCase())) return true;
        if (chat.companyName && card.companyName?.toLowerCase() === chat.companyName.toLowerCase()) return true;
        return false;
      });
      setCards(matching);
      setLoading(false);
    });

    return () => {
      unsubscribeCards();
      unsubscribePipelines();
    };
  }, [companyId, chat.contactPhone, chat.contactName, chat.companyName]);

  const activeCard = cards[0]; // Primary card for this contact
  const currentPipeline = pipelines.find(p => p.id === activeCard?.pipelineId) || pipelines[0];

  // Pipeline columns can come from pipeline or default columns
  const availableColumns: PipelineColumn[] = currentPipeline?.columns || [
    { id: 'lead', label: 'Lead Novo', color: '#3b82f6', order: 1 },
    { id: 'contact', label: 'Em Contato', color: '#8b5cf6', order: 2 },
    { id: 'proposal', label: 'Proposta', color: '#f59e0b', order: 3 },
    { id: 'closing', label: 'Fechamento', color: '#10b981', order: 4 },
  ];

  const currentColumn = availableColumns.find(c => c.id === activeCard?.column);

  const handleStageChange = async (newColumnId: string) => {
    if (!activeCard) return;
    try {
      await kanbanService.updateCard(activeCard.id, { column: newColumnId });
    } catch (err) {
      console.error('Error updating card column:', err);
    }
  };

  const handleCreateNewCard = async () => {
    setIsCreatingCard(true);
    try {
      const defaultPipeline = pipelines[0];
      const defaultCol = availableColumns[0]?.id || 'lead';

      await kanbanService.createCard({
        companyId,
        pipelineId: defaultPipeline?.id || 'pipeline_1',
        column: defaultCol,
        clientName: chat.contactName,
        companyName: chat.companyName || '',
        phone: chat.contactPhone,
        whatsapp: chat.contactPhone,
        email: chat.email || '',
        responsible: chat.assignedUser || userData?.name || 'Atendente',
        priority: 'medium',
        origin: 'WhatsApp Web',
        labels: (chat.tags || []).map(t => t.name),
        position: 0,
        active: true,
        createdBy: user?.uid || 'user_demo',
      } as any);
    } catch (err) {
      console.error('Error creating CRM card:', err);
    } finally {
      setIsCreatingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground space-y-2">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="text-xs">Carregando dados do CRM...</span>
      </div>
    );
  }

  if (!activeCard) {
    return (
      <div className="space-y-4 p-4 text-center bg-muted/20 rounded-xl border border-dashed border-border animate-in fade-in">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <Kanban size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-foreground">Nenhuma oportunidade ativa</h4>
          <p className="text-[11px] text-muted-foreground">
            Este contato ainda não possui um card de oportunidade no Funil do CRM.
          </p>
        </div>
        <Button 
          onClick={handleCreateNewCard} 
          disabled={isCreatingCard}
          className="w-full text-xs h-8 gap-1.5"
        >
          {isCreatingCard ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          <span>Criar Oportunidade no CRM</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Current Stage Card */}
      <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Funil Ativo</span>
            <span className="text-xs font-bold text-foreground">{currentPipeline?.name || 'Funil do CRM'}</span>
          </div>
          <span 
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs"
            style={{ 
              backgroundColor: `${currentColumn?.color || '#3b82f6'}20`, 
              color: currentColumn?.color || '#3b82f6',
              border: `1px solid ${currentColumn?.color || '#3b82f6'}40`
            }}
          >
            {currentColumn?.label || activeCard.column || 'Em Andamento'}
          </span>
        </div>

        {/* Card Details */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User size={13} className="shrink-0 text-primary" />
            <span className="truncate text-foreground font-medium">{activeCard.responsible || 'Sem responsável'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={13} className="shrink-0 text-amber-500" />
            <span className="text-foreground font-medium">Na etapa ativo</span>
          </div>
        </div>

        {/* Value if present */}
        {activeCard.value ? (
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Valor Estimado:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              R$ {activeCard.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : null}
      </div>

      {/* Move Stage Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <ArrowRight size={12} /> Mover de Etapa
        </label>
        <select
          value={activeCard.column}
          onChange={(e) => handleStageChange(e.target.value)}
          className="w-full bg-background border border-border rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {availableColumns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mini Activity Timeline */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <Activity size={12} /> Últimas Atividades
        </label>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-muted/30 p-2 rounded-lg text-xs">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Mensagem recebida via WhatsApp</p>
              <p className="text-[10px] text-muted-foreground">Hoje</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-muted/30 p-2 rounded-lg text-xs">
            <Activity size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Card ativo no CRM</p>
              <p className="text-[10px] text-muted-foreground">Atendimento em tempo real</p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Card Link */}
      <a
        href={`/crm/pipeline?cardId=${activeCard.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
      >
        <ExternalLink size={13} />
        <span>Ver Oportunidade Completa no CRM</span>
      </a>
    </div>
  );
}
