import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { kanbanService } from '../services/kanbanService';
import toast from 'react-hot-toast';
import { serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { KanbanColumn } from '../../clients/types';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  userId: string;
}

export function AddCardModal({ isOpen, onClose, companyId, userId }: AddCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    phone: '',
    origin: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName) {
      toast.error('O nome do cliente ou oportunidade é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'kanban'), {
        ...formData,
        companyId,
        responsible: userId, // assigning to current user initially
        column: 'lead' as KanbanColumn,
        position: Date.now(), // put at the bottom of the list
        labels: [],
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      });

      toast.success('Card criado com sucesso!');
      onClose();
      setFormData({
        clientName: '',
        companyName: '',
        phone: '',
        origin: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Lead / Oportunidade">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Cliente / Oportunidade</label>
          <Input 
            placeholder="Ex: Consultoria Contábil" 
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome da Empresa (Opcional)</label>
          <Input 
            placeholder="Razão Social ou Fantasia" 
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Telefone</label>
            <Input 
              placeholder="(00) 00000-0000" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Origem</label>
            <Input 
              placeholder="Ex: Google, Indicação..." 
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Prioridade</label>
          <select 
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Criar Card</Button>
        </div>
      </form>
    </Modal>
  );
}
