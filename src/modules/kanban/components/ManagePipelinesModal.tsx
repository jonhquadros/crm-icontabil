import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, Check } from 'lucide-react';
import { kanbanService } from '../services/kanbanService';
import { Pipeline, PipelineColumn } from '../../clients/types';
import toast from 'react-hot-toast';
import { db } from '../../../lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

interface ManagePipelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: Pipeline[];
  companyId: string;
  userId: string;
  onPipelineCreated?: (newPipelineId: string) => void;
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
  onPipelineCreated 
}: ManagePipelinesModalProps) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');

  // New Pipeline form state
  const [pipelineName, setPipelineName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [columns, setColumns] = useState<Omit<PipelineColumn, 'order'>[]>([
    { id: 'lead', label: 'Novo Lead', color: 'bg-slate-400' },
    { id: 'contact', label: 'Primeiro Contato', color: 'bg-primary' },
    { id: 'won', label: 'Ganho', color: 'bg-success' },
  ]);

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

      const pipelineId = `pipe_${Date.now()}`;
      const batch = writeBatch(db);

      // Write pipeline document
      const pipelineRef = doc(db, 'pipelines', pipelineId);
      batch.set(pipelineRef, {
        id: pipelineId,
        companyId,
        name: pipelineName.trim(),
        isDefault,
        columns: formattedColumns,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      });

      // Write stages subcollection
      formattedColumns.forEach((col) => {
        const stageRef = doc(db, 'pipelines', pipelineId, 'stages', col.id);
        batch.set(stageRef, {
          id: col.id,
          pipelineId,
          companyId,
          name: col.label,
          color: col.color,
          position: col.order,
          isWon: col.id === 'won' || col.label.toLowerCase().includes('ganho') || col.label.toLowerCase().includes('concluido'),
          isLost: col.id === 'lost' || col.label.toLowerCase().includes('perdido') || col.label.toLowerCase().includes('cancelado'),
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId,
        });
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

      toast.success('Pipeline e etapas criados com sucesso!');
      setPipelineName('');
      setIsDefault(false);
      setColumns([
        { id: 'lead', label: 'Novo Lead', color: 'bg-slate-400' },
        { id: 'contact', label: 'Primeiro Contato', color: 'bg-primary' },
        { id: 'won', label: 'Ganho', color: 'bg-success' },
      ]);
      setView('list');
      if (onPipelineCreated) {
        onPipelineCreated(pipelineId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuração de Pipelines">
      {view === 'list' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pipelines Ativos</h4>
            <Button size="sm" onClick={() => setView('create')}>
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
                    <span className="text-xs text-muted-foreground mr-2">
                      {p.columns?.length || 0} etapas
                    </span>
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
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Pipeline</label>
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
            <Button type="button" variant="outline" onClick={() => setView('list')}>Voltar</Button>
            <Button type="submit" loading={loading}>Criar Pipeline</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
