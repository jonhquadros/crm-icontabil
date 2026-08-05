import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, Check, Edit2 } from 'lucide-react';
import { kanbanService } from '../services/kanbanService';
import { Pipeline, PipelineColumn } from '../../clients/types';
import toast from 'react-hot-toast';
import { db } from '../../../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { useAuth } from '../../../app/providers/AuthProvider';

interface ManagePipelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: Pipeline[];
  companyId: string;
  userId: string;
  onPipelineCreated?: (newPipelineId: string) => void;
  initialView?: 'list' | 'create' | 'edit';
  initialPipelineId?: string | null;
  initialDelete?: boolean;
}

const PRESET_COLORS = [
  { class: 'bg-slate-400', name: 'Cinza' },
  { class: 'bg-primary', name: 'Azul (Padrão)' },
  { class: 'bg-warning', name: 'Amarelo' },
  { class: 'bg-indigo-500', name: 'Índigo' },
  { class: 'bg-purple-500', name: 'Roxo' },
  { class: 'bg-success', name: 'Verde' },
  { class: 'bg-danger', name: 'Vermelho' },
];

export function ManagePipelinesModal({ 
  isOpen, 
  onClose, 
  pipelines, 
  companyId, 
  userId, 
  onPipelineCreated,
  initialView,
  initialPipelineId,
  initialDelete
}: ManagePipelinesModalProps) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');

  // Editing state
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);

  // New/Edit Pipeline form state
  const [pipelineName, setPipelineName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [columns, setColumns] = useState<Omit<PipelineColumn, 'order'>[]>([
    { id: 'lead', label: 'Novo Lead', color: 'bg-slate-400' },
    { id: 'contact', label: 'Primeiro Contato', color: 'bg-primary' },
    { id: 'won', label: 'Ganho', color: 'bg-success' },
  ]);

  const resetForm = () => {
    setPipelineName('');
    setIsDefault(false);
    setColumns([
      { id: 'lead', label: 'Novo Lead', color: 'bg-slate-400' },
      { id: 'contact', label: 'Primeiro Contato', color: 'bg-primary' },
      { id: 'won', label: 'Ganho', color: 'bg-success' },
    ]);
    setEditingPipelineId(null);
  };

  const handleStartEdit = (pipeline: Pipeline) => {
    setEditingPipelineId(pipeline.id);
    setPipelineName(pipeline.name);
    setIsDefault(pipeline.isDefault || false);
    const sortedCols = pipeline.columns ? [...pipeline.columns].sort((a, b) => a.order - b.order) : [];
    setColumns(sortedCols.map(col => ({
      id: col.id,
      label: col.label,
      color: col.color
    })));
    setView('create');
  };

  const handleStartDelete = (pipeline: Pipeline) => {
    if (pipelines.length <= 1) {
      toast.error('Você deve manter pelo menos um pipeline ativo.');
      return;
    }
    setPipelineToDelete(pipeline);
    setDeleteConfirmOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialView === 'edit' && initialPipelineId) {
        const pipe = pipelines.find(p => p.id === initialPipelineId);
        if (pipe) {
          handleStartEdit(pipe);
          return;
        }
      } else if (initialView === 'list' && initialPipelineId && initialDelete) {
        const pipe = pipelines.find(p => p.id === initialPipelineId);
        if (pipe) {
          setView('list');
          handleStartDelete(pipe);
          return;
        }
      }
      setView(initialView || 'list');
      resetForm();
    }
  }, [isOpen, initialView, initialPipelineId, initialDelete]);

  const handleDeletePipeline = async () => {
    if (!pipelineToDelete) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Delete the pipeline document
      const pipelineRef = doc(db, 'pipelines', pipelineToDelete.id);
      batch.delete(pipelineRef);

      // Delete stages subcollection documents
      if (pipelineToDelete.columns) {
        pipelineToDelete.columns.forEach(col => {
          const stageRef = doc(db, 'pipelines', pipelineToDelete.id, 'stages', col.id);
          batch.delete(stageRef);
        });
      }

      // If we are deleting the default pipeline, make another remaining pipeline default
      if (pipelineToDelete.isDefault) {
        const otherPipelines = pipelines.filter(p => p.id !== pipelineToDelete.id);
        if (otherPipelines.length > 0) {
          const newDefaultRef = doc(db, 'pipelines', otherPipelines[0].id);
          batch.update(newDefaultRef, { isDefault: true });
        }
      }

      await batch.commit();
      toast.success('Pipeline excluído com sucesso!');
      setPipelineToDelete(null);
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir pipeline');
    } finally {
      setLoading(false);
    }
  };

  // Temporary column additions
  const [newColLabel, setNewColLabel] = useState('');
  const [newColColor, setNewColColor] = useState('bg-primary');

  const handleAddColumn = () => {
    if (!newColLabel.trim()) {
      toast.error('O nome da etapa é obrigatório');
      return;
    }
    const id = `col_${Date.now()}`;
    setColumns([...columns, { id, label: newColLabel.trim(), color: newColColor }]);
    setNewColLabel('');
  };

  const handleRemoveColumn = (id: string) => {
    if (columns.length <= 1) {
      toast.error('O pipeline deve conter pelo menos uma etapa');
      return;
    }
    setColumns(columns.filter(col => col.id !== id));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= columns.length) return;

    const newColumns = [...columns];
    const temp = newColumns[index];
    newColumns[index] = newColumns[nextIndex];
    newColumns[nextIndex] = temp;
    setColumns(newColumns);
  };

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineName.trim()) {
      toast.error('O nome do pipeline é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const formattedColumns: PipelineColumn[] = columns.map((col, idx) => ({
        ...col,
        order: idx
      }));

      const pipelineId = editingPipelineId || `pipe_${Date.now()}`;
      const batch = writeBatch(db);

      // Write/update pipeline document
      const pipelineRef = doc(db, 'pipelines', pipelineId);
      const pipelineData: any = {
        id: pipelineId,
        companyId,
        name: pipelineName.trim(),
        isDefault,
        columns: formattedColumns,
        active: true,
        updatedAt: serverTimestamp(),
      };

      const creatorName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Administrador';
      if (!editingPipelineId) {
        pipelineData.createdAt = serverTimestamp();
        pipelineData.createdBy = creatorName;
        pipelineData.createdById = userId;
      }

      batch.set(pipelineRef, pipelineData, { merge: true });

      // If we are editing, delete any stages that were removed
      if (editingPipelineId) {
        const oldPipeline = pipelines.find(p => p.id === editingPipelineId);
        if (oldPipeline && oldPipeline.columns) {
          const newColIds = new Set(formattedColumns.map(c => c.id));
          oldPipeline.columns.forEach(oldCol => {
            if (!newColIds.has(oldCol.id)) {
              const deletedStageRef = doc(db, 'pipelines', editingPipelineId, 'stages', oldCol.id);
              batch.delete(deletedStageRef);
            }
          });
        }
      }

      // Write/update stages subcollection
      formattedColumns.forEach((col) => {
        const stageRef = doc(db, 'pipelines', pipelineId, 'stages', col.id);
        batch.set(stageRef, {
          id: col.id,
          pipelineId,
          companyId,
          name: col.label,
          color: col.color,
          position: col.order,
          isWon: col.id === 'won' || col.label.toLowerCase().includes('ganho') || col.label.toLowerCase().includes('concluido') || col.label.toLowerCase().includes('concluído') || col.label.toLowerCase().includes('ativo') || col.label.toLowerCase().includes('entregue'),
          isLost: col.id === 'lost' || col.label.toLowerCase().includes('perdido') || col.label.toLowerCase().includes('cancelado') || col.label.toLowerCase().includes('fechado') || col.label.toLowerCase().includes('encerrado'),
          active: true,
          updatedAt: serverTimestamp(),
          ...(editingPipelineId ? {} : { createdAt: serverTimestamp(), createdBy: creatorName, createdById: userId })
        }, { merge: true });
      });

      // If this is set as default, unset other defaults of the same company
      if (isDefault) {
        pipelines.forEach(p => {
          if (p.isDefault && p.id !== pipelineId) {
            const oldDefaultRef = doc(db, 'pipelines', p.id);
            batch.update(oldDefaultRef, { isDefault: false });
          }
        });
      }

      await batch.commit();

      toast.success(editingPipelineId ? 'Pipeline atualizado com sucesso!' : 'Pipeline e etapas criados com sucesso!');
      resetForm();
      setView('list');
      if (onPipelineCreated && !editingPipelineId) {
        onPipelineCreated(pipelineId);
      }
    } catch (err) {
      console.error(err);
      toast.error(editingPipelineId ? 'Erro ao atualizar pipeline' : 'Erro ao criar pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Configuração de Pipelines">
        {view === 'list' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pipelines Ativos</h4>
              <Button size="sm" onClick={() => { resetForm(); setView('create'); }}>
                Criar Novo Pipeline
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {pipelines.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Nenhum pipeline criado.</p>
              ) : (
                pipelines.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{p.name}</span>
                      {p.isDefault && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          Padrão
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">
                        {p.columns?.length || 0} etapas
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground transition-colors"
                        title="Editar pipeline"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDelete(p)}
                        className="p-1.5 hover:bg-danger/10 hover:text-danger rounded text-muted-foreground transition-colors"
                        title="Excluir pipeline"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreatePipeline} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                {editingPipelineId ? 'Nome do Pipeline (Edição)' : 'Nome do Pipeline'}
              </label>
              <Input 
                placeholder="Ex: Consultoria, Abertura..." 
                value={pipelineName}
                onChange={e => setPipelineName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input 
                type="checkbox" 
                id="isDefault" 
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-xs font-semibold cursor-pointer">Definir como Pipeline Padrão</label>
            </div>

            {/* Seção Etapas */}
            <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/20">
              <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Etapas do Pipeline</h5>
              
              {/* Lista atual */}
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {columns.map((col, index) => (
                  <div key={col.id} className="flex items-center justify-between p-2 bg-card border border-border rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${col.color}`} />
                      <span className="font-semibold">{col.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveColumn(index, 'up')}
                        className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-40"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button 
                        type="button"
                        disabled={index === columns.length - 1}
                        onClick={() => moveColumn(index, 'down')}
                        className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-40"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleRemoveColumn(col.id)}
                        className="p-1 hover:bg-danger/10 hover:text-danger rounded text-muted-foreground"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inserção de nova etapa */}
              <div className="pt-2 border-t border-border flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Nova Etapa</label>
                  <Input 
                    placeholder="Nome da etapa..." 
                    value={newColLabel}
                    onChange={e => setNewColLabel(e.target.value)}
                    className="bg-background h-8 text-xs"
                  />
                </div>
                
                <div className="space-y-1 shrink-0">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Cor</label>
                  <select 
                    value={newColColor}
                    onChange={e => setNewColColor(e.target.value)}
                    className="bg-background border border-border rounded-lg text-xs h-8 px-2 focus:outline-none"
                  >
                    {PRESET_COLORS.map(c => (
                      <option key={c.class} value={c.class}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1 text-xs"
                  onClick={handleAddColumn}
                >
                  <Plus size={13} /> Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setView('list'); resetForm(); }}>Voltar</Button>
              <Button type="submit" loading={loading}>{editingPipelineId ? 'Salvar Alterações' : 'Criar Pipeline'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPipelineToDelete(null);
        }}
        onConfirm={handleDeletePipeline}
        title="Excluir Pipeline"
        message={`Tem certeza que deseja excluir o pipeline "${pipelineToDelete?.name}" e todas as suas etapas? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={loading}
      />
    </>
  );
}
