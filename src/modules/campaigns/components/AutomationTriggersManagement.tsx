import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Clock, 
  MessageSquare, 
  Smartphone, 
  Layers, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Pencil
} from 'lucide-react';
import { useAutomationTriggers } from '../hooks/useAutomationTriggers';
import { DELAY_OPTIONS, AutomationTrigger } from '../types/automation.types';
import { kanbanService } from '../../kanban/services/kanbanService';
import { CampaignRepository } from '../repository/CampaignRepository';
import { CampaignTemplate } from '../types/campaign.types';
import { Pipeline } from '../../clients/types';
import { useAuth } from '../../../app/providers/AuthProvider';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import toast from 'react-hot-toast';

export function AutomationTriggersManagement() {
  const { userData } = useAuth();
  const companyId = userData?.companyId || '';

  const {
    triggers,
    loading,
    createTrigger,
    toggleTriggerActive,
    deleteTrigger,
    updateTrigger,
    seedDefaultTriggers
  } = useAutomationTriggers();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AutomationTrigger | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [instances, setInstances] = useState<Array<{ id: string; name: string }>>([]);

  // Form Fields State
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('inst_principal');
  const [selectedDelayMs, setSelectedDelayMs] = useState<number>(0);
  const [customMessageText, setCustomMessageText] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Delete confirmation state
  const [triggerToDelete, setTriggerToDelete] = useState<AutomationTrigger | null>(null);

  // Fetch Pipelines, Templates, and Instances when modal opens
  useEffect(() => {
    if (!companyId) return;

    // Subscribe to pipelines
    const unsubPipes = kanbanService.subscribeToPipelines(companyId, (pipes) => {
      setPipelines(pipes);
      if (pipes.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(pipes[0].id);
        if (pipes[0].columns && pipes[0].columns.length > 0) {
          setSelectedColumnId(pipes[0].columns[0].id);
        }
      }
    });

    // Fetch Templates
    CampaignRepository.getTemplates(companyId).then(tmps => {
      setTemplates(tmps);
    }).catch(console.error);

    // Fetch Instances
    const fetchInstances = async () => {
      try {
        const q = query(collection(db, 'evolutionConfig'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const instList = snap.docs.map(d => ({
            id: d.id,
            name: d.data().name || d.data().instanceName || 'WhatsApp Instância'
          }));
          setInstances(instList);
          if (instList.length > 0) setSelectedInstanceId(instList[0].id);
        } else {
          setInstances([{ id: 'inst_principal', name: 'WhatsApp Principal' }]);
        }
      } catch (e) {
        setInstances([{ id: 'inst_principal', name: 'WhatsApp Principal' }]);
      }
    };

    fetchInstances();

    return () => unsubPipes();
  }, [companyId]);

  // Handle pipeline change in modal
  const handlePipelineChange = (pipeId: string) => {
    setSelectedPipelineId(pipeId);
    const found = pipelines.find(p => p.id === pipeId);
    if (found && found.columns && found.columns.length > 0) {
      setSelectedColumnId(found.columns[0].id);
    } else {
      setSelectedColumnId('');
    }
  };

  // Handle template selection in modal
  const handleTemplateChange = (tmpId: string) => {
    setSelectedTemplateId(tmpId);
    const found = templates.find(t => t.id === tmpId);
    if (found) {
      setCustomMessageText(found.content || '');
    }
  };

  // Open modal for new trigger
  const handleOpenCreateModal = () => {
    setEditingTrigger(null);
    if (pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id);
      if (pipelines[0].columns && pipelines[0].columns.length > 0) {
        setSelectedColumnId(pipelines[0].columns[0].id);
      } else {
        setSelectedColumnId('');
      }
    } else {
      setSelectedPipelineId('');
      setSelectedColumnId('');
    }
    setSelectedTemplateId('');
    setCustomMessageText('');
    setSelectedDelayMs(0);
    if (instances.length > 0) setSelectedInstanceId(instances[0].id);
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing trigger
  const handleOpenEditModal = (trigger: AutomationTrigger) => {
    setEditingTrigger(trigger);
    setSelectedPipelineId(trigger.pipelineId || 'default_pipeline');
    setSelectedColumnId(trigger.columnName || '');
    setSelectedTemplateId(trigger.templateId || '');
    setCustomMessageText(trigger.customMessage || trigger.templateText || '');
    setSelectedDelayMs(trigger.delayMs || 0);
    setSelectedInstanceId(trigger.instanceId || 'inst_principal');
    setIsActive(trigger.active ?? true);
    setIsModalOpen(true);
  };

  // Submit Trigger (Create or Update)
  const handleSubmitTrigger = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedColumnId) {
      toast.error('Selecione uma coluna do CRM.');
      return;
    }

    const currentPipe = pipelines.find(p => p.id === selectedPipelineId);
    const currentCol = currentPipe?.columns?.find(c => c.id === selectedColumnId);
    const currentTmp = templates.find(t => t.id === selectedTemplateId);
    const currentInst = instances.find(i => i.id === selectedInstanceId);

    const messageToUse = customMessageText.trim() || currentTmp?.content || 'Olá {{nome}}, recebemos seu contato na {{empresa}}!';

    const payload = {
      pipelineId: selectedPipelineId || 'default_pipeline',
      pipelineName: currentPipe?.name || 'Pipeline Geral',
      columnName: selectedColumnId,
      columnLabel: currentCol?.label || selectedColumnId,
      templateId: selectedTemplateId || null,
      templateName: currentTmp?.name || (selectedTemplateId ? 'Template' : 'Mensagem Personalizada'),
      templateText: messageToUse,
      customMessage: messageToUse,
      instanceId: selectedInstanceId || 'inst_principal',
      instanceName: currentInst?.name || 'WhatsApp Principal',
      delayMs: selectedDelayMs,
      active: isActive
    };

    let success = false;
    if (editingTrigger) {
      success = await updateTrigger(editingTrigger.id, payload);
    } else {
      success = await createTrigger(payload);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingTrigger(null);
      setCustomMessageText('');
      setSelectedTemplateId('');
    }
  };

  const getDelayBadgeText = (ms: number) => {
    const found = DELAY_OPTIONS.find(d => d.value === ms);
    return found ? found.label : `${ms / 3600000} horas`;
  };

  return (
    <div className="space-y-6" id="automations-management-container">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Automações CRM & Gatilhos de Disparo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispare mensagens automáticas de WhatsApp quando uma oportunidade mudar de estágio no Kanban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {triggers.length === 0 && (
            <button
              onClick={() => seedDefaultTriggers()}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold py-2 px-3.5 rounded-lg text-xs transition-all border border-amber-200 shadow-sm"
              id="seed-default-triggers-btn"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Gerar Gatilhos Sugeridos
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-sm"
            id="add-new-trigger-btn"
          >
            <Plus className="w-4 h-4" />
            Novo Gatilho
          </button>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-blue-900">Como funcionam as automações anti-ban:</p>
          <p>
            1. Quando um card é arrastado para a coluna configurada, a mensagem é enfileirada e verifica a lista de <strong>Opt-Out</strong>.
          </p>
          <p>
            2. Se o número estiver bloqueado, o envio é cancelado automaticamente. Se liberado, é enviado respeitando o delay configurado e registrado na <strong>linha do tempo (timeline)</strong> do card.
          </p>
        </div>
      </div>

      {/* TRIGGERS GRID LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-48 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : triggers.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
          <Zap className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum gatilho de automação cadastrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Crie seu primeiro gatilho ou clique em "Gerar Gatilhos Sugeridos" para criar os fluxos padrões do seu escritório.
          </p>
          <button
            onClick={() => seedDefaultTriggers()}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Criar Gatilhos Sugeridos Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="triggers-grid">
          {triggers.map(trigger => (
            <div 
              key={trigger.id} 
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                trigger.active ? 'border-slate-200 hover:border-blue-300 hover:shadow-md' : 'border-slate-200 bg-slate-50/60 opacity-75'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Stage Badge + Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-600" />
                      {trigger.columnLabel || trigger.columnName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]" title={trigger.pipelineName}>
                      {trigger.pipelineName || 'Pipeline'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleTriggerActive(trigger.id, trigger.active)}
                    title={trigger.active ? 'Desativar gatilho' : 'Ativar gatilho'}
                    className="text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    {trigger.active ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Template / Message preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{trigger.templateName || 'Mensagem Automática'}</span>
                  </div>
                  <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed italic">
                    "{trigger.templateText || trigger.customMessage || 'Sem texto definido'}"
                  </p>
                </div>

                {/* Details Badges */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 gap-2 pt-1 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px]">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {getDelayBadgeText(trigger.delayMs)}
                  </span>

                  <span className="inline-flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                    <Smartphone className="w-3 h-3 text-slate-500" />
                    {trigger.instanceName || 'WhatsApp'}
                  </span>
                </div>
              </div>

              {/* Footer: Trigger Count, Edit & Delete */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-600 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {trigger.triggerCount || 0} disparos realizados
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(trigger)}
                    className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Gatilho"
                    id={`edit-trigger-btn-${trigger.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriggerToDelete(trigger)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir Gatilho"
                    id={`delete-trigger-btn-${trigger.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE OR EDIT TRIGGER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                {editingTrigger ? 'Editar Gatilho de Automação' : 'Criar Novo Gatilho do CRM'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTrigger(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTrigger} className="space-y-4 mt-4">
              {/* 1. Select Pipeline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Selecionar Pipeline / Funil do CRM
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={selectedPipelineId || ''}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  id="trigger-pipeline-select"
                >
                  {pipelines.map(pipe => (
                    <option key={pipe.id} value={pipe.id}>
                      {pipe.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Select Column / Stage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Coluna / Estágio Gatilho (ao mover para)
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={selectedColumnId || ''}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  id="trigger-column-select"
                >
                  {pipelines
                    .find(p => p.id === selectedPipelineId)
                    ?.columns?.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* 3. Select Template or Custom Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Template de Mensagem Registrado
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={selectedTemplateId || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  id="trigger-template-select"
                >
                  <option value="">-- Usar mensagem personalizada abaixo --</option>
                  {templates.map(tmp => (
                    <option key={tmp.id} value={tmp.id}>
                      {tmp.name} ({tmp.category || 'Geral'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Text Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto da Mensagem (com suporte a variáveis)
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                  placeholder="Ex: Olá {{nome}}, recebemos seu interesse na {{empresa}}! Como podemos ajudar hoje?"
                  value={customMessageText || ''}
                  onChange={(e) => setCustomMessageText(e.target.value)}
                  id="trigger-custom-message-input"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Variáveis disponíveis: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{"{{nome}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{"{{empresa}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{"{{saudacao}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">{"{{fechamento}}"}</code>.
                </p>
              </div>

              {/* 4. Select Delay */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Temporização / Delay do Disparo
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={selectedDelayMs ?? 0}
                  onChange={(e) => setSelectedDelayMs(Number(e.target.value))}
                  id="trigger-delay-select"
                >
                  {DELAY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Select Instance */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  5. Instância de WhatsApp Conectada
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={selectedInstanceId || ''}
                  onChange={(e) => setSelectedInstanceId(e.target.value)}
                  id="trigger-instance-select"
                >
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Ativar Gatilho Imediatamente</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  id="trigger-active-checkbox"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTrigger(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  id="save-trigger-submit-btn"
                >
                  {editingTrigger ? 'Salvar Alterações' : 'Salvar Gatilho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {triggerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Remover Gatilho de Automação?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação não afetará os envios já enfileirados, mas desativará novos disparos automáticos para esta coluna.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTriggerToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deleteTrigger(triggerToDelete.id);
                  setTriggerToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm"
                id="confirm-delete-trigger-btn"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
