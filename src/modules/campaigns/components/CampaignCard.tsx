import React, { useState } from 'react';
import { Campaign } from '../types/campaign.types';
import { 
  Play, 
  Pause, 
  Trash2, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  UserX,
  MessageSquare,
  AlertOctagon
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CampaignCardProps {
  campaign: Campaign;
  onStart: (id: string) => any;
  onPause: (id: string) => any;
  onResume: (id: string) => any;
  onDelete: (id: string) => any;
  onSelect: (campaign: Campaign) => any;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onStart,
  onPause,
  onResume,
  onDelete,
  onSelect
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const metrics = campaign.metrics || { total: 0, sent: 0, pending: 0, failed: 0, optedOut: 0 };
  const totalContacts = Math.max(0, metrics.total || 0);
  const sentCount = Math.max(0, metrics.sent || 0);
  const failedCount = Math.max(0, metrics.failed || 0);
  const optedOutCount = Math.max(0, metrics.optedOut || 0);
  const pendingCount = Math.max(0, metrics.pending || 0);

  // Calculate percentage
  const completedPct = totalContacts > 0 
    ? Math.round(((sentCount + failedCount + optedOutCount) / totalContacts) * 100) 
    : 0;

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            <Clock className="w-3.5 h-3.5" /> Rascunho
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="w-3.5 h-3.5" /> Agendada
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ativa
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Pause className="w-3.5 h-3.5" /> Pausada
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Falhou
          </span>
        );
      default:
        return null;
    }
  };

  const handleAction = async (actionFn: () => void | Promise<any>) => {
    setIsActionLoading(true);
    try {
      await actionFn();
    } finally {
      setIsActionLoading(false);
    }
  };

  const formattedDate = campaign.scheduledAt
    ? format(campaign.scheduledAt instanceof Date ? campaign.scheduledAt : (campaign.scheduledAt as any).toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : campaign.createdAt
    ? format(campaign.createdAt instanceof Date ? campaign.createdAt : (campaign.createdAt as any).toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    : '';

  return (
    <div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col justify-between relative overflow-hidden"
      id={`campaign-card-${campaign.id}`}
    >
      {/* Background Accent for Active Status */}
      {campaign.status === 'running' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
      )}

      <div>
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="cursor-pointer flex-1" onClick={() => onSelect(campaign)}>
            <h3 className="font-semibold text-gray-900 text-lg hover:text-blue-600 transition-colors">
              {campaign.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {campaign.description || 'Sem descrição cadastrada'}
            </p>
          </div>
          <div>{getStatusBadge(campaign.status)}</div>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-500 mb-4 border-b border-gray-50 pb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <strong>{totalContacts}</strong> contatos
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {campaign.status === 'scheduled' ? `Agendada para ${formattedDate}` : `Criada em ${formattedDate}`}
          </span>
        </div>

        {/* Template message text preview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100 text-xs text-gray-600 line-clamp-3">
          <div className="font-medium text-gray-500 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Template da Mensagem
          </div>
          <p className="italic font-mono leading-relaxed">{campaign.templateText}</p>
        </div>

        {/* Progress & Metrics */}
        {campaign.status !== 'draft' && (
          <div className="space-y-2.5 mb-5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700">Progresso de envio</span>
              <span className="font-semibold text-gray-900">{completedPct}% ({sentCount + failedCount + optedOutCount}/{totalContacts})</span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(sentCount / totalContacts) * 100}%` }} title={`Sucesso: ${sentCount}`} />
              <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(optedOutCount / totalContacts) * 100}%` }} title={`Opt-out: ${optedOutCount}`} />
              <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${(failedCount / totalContacts) * 100}%` }} title={`Falhas: ${failedCount}`} />
            </div>

            {/* Minor metrics pills */}
            <div className="grid grid-cols-4 gap-1 text-center pt-1">
              <div className="bg-emerald-50/50 rounded p-1.5 border border-emerald-100/50">
                <span className="block text-xs font-bold text-emerald-700">{sentCount}</span>
                <span className="text-[10px] text-emerald-600/80">Enviados</span>
              </div>
              <div className="bg-gray-50/50 rounded p-1.5 border border-gray-100">
                <span className="block text-xs font-bold text-gray-700">{pendingCount}</span>
                <span className="text-[10px] text-gray-500/80">Pendente</span>
              </div>
              <div className="bg-rose-50/50 rounded p-1.5 border border-rose-100/50">
                <span className="block text-xs font-bold text-rose-700">{failedCount}</span>
                <span className="text-[10px] text-rose-600/80">Falhas</span>
              </div>
              <div className="bg-amber-50/50 rounded p-1.5 border border-amber-100/50">
                <span className="block text-xs font-bold text-amber-700">{optedOutCount}</span>
                <span className="text-[10px] text-amber-600/80">Opt-outs</span>
              </div>
            </div>
          </div>
        )}

        {/* If paused, show reason */}
        {campaign.status === 'paused' && campaign.pauseReason && (
          <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100 flex items-start gap-1.5 mb-5 text-xs text-amber-800 leading-normal">
            <AlertOctagon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Motivo da pausa:</strong> {campaign.pauseReason}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls & Actions */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-1 gap-2">
        <button
          onClick={() => onSelect(campaign)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50/50"
          id={`campaign-view-details-${campaign.id}`}
        >
          Ver Detalhes
        </button>

        <div className="flex items-center gap-2">
          {/* Action trigger button */}
          {campaign.status === 'draft' && (
            <button
              onClick={() => handleAction(() => onStart(campaign.id))}
              disabled={isActionLoading || totalContacts === 0}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 rounded-lg text-white shadow-sm transition-all ${
                totalContacts === 0 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow active:scale-95'
              }`}
              title={totalContacts === 0 ? 'Adicione contatos antes de iniciar a campanha' : 'Iniciar Campanha'}
              id={`campaign-start-btn-${campaign.id}`}
            >
              {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              Disparar
            </button>
          )}

          {campaign.status === 'running' && (
            <button
              onClick={() => handleAction(() => onPause(campaign.id))}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95"
              id={`campaign-pause-btn-${campaign.id}`}
            >
              {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
              Pausar
            </button>
          )}

          {campaign.status === 'paused' && (
            <button
              onClick={() => handleAction(() => onResume(campaign.id))}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
              id={`campaign-resume-btn-${campaign.id}`}
            >
              {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              Retomar
            </button>
          )}

          {/* Delete Action (with micro confirmation popover) */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Excluir Campanha"
              id={`campaign-delete-trigger-${campaign.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1 animate-fade-in">
              <button
                onClick={() => handleAction(() => onDelete(campaign.id))}
                className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 py-1 px-2 rounded-md"
                id={`campaign-delete-confirm-${campaign.id}`}
              >
                Sim
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 py-1 px-2 rounded-md"
                id={`campaign-delete-cancel-${campaign.id}`}
              >
                Não
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
