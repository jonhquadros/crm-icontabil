import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { taskService } from '../services/taskService';
import { TaskPriority } from '../types';
import toast from 'react-hot-toast';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  userId: string;
}

export function AddTaskModal({ isOpen, onClose, companyId, userId }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    clientId: '', // Could be a select if we fetch clients
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await taskService.createTask({
        ...formData,
        companyId,
        assignedTo: userId,
        status: 'todo',
        dueDate: formData.dueDate ? new Date(formData.dueDate + 'T00:00:00') : undefined
      } as any);
      toast.success('Tarefa criada com sucesso');
      onClose();
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        clientId: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Tarefa">
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
          <Button type="submit" loading={loading}>Criar Tarefa</Button>
        </div>
      </form>
    </Modal>
  );
}
