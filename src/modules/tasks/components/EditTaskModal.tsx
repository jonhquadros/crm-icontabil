import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { taskService } from '../services/taskService';
import { Task, TaskPriority } from '../types';
import toast from 'react-hot-toast';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function EditTaskModal({ isOpen, onClose, task }: EditTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate?.toDate?.() || new Date()).toISOString().split('T')[0] : '',
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await taskService.updateTask(task.id, {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate + 'T00:00:00') : undefined
      } as any);
      toast.success('Tarefa atualizada com sucesso');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Tarefa">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Título</label>
          <Input 
            placeholder="Ex: Conciliação Bancária" 
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Descrição</label>
          <textarea 
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Detalhes da tarefa..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Prioridade</label>
            <select 
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Data de Entrega</label>
            <Input 
              type="date" 
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
        </div>
      </form>
    </Modal>
  );
}
