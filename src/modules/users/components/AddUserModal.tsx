import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { userService } from '../services/userService';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentUserId: string;
  onSuccess?: (user: { name: string; email: string; phone?: string }) => void;
}

export function AddUserModal({ isOpen, onClose, companyId, currentUserId, onSuccess }: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'viewer' as UserRole,
    status: 'pending' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Nome e E-mail são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await userService.inviteUser(companyId, formData, currentUserId);
      toast.success('Usuário convidado com sucesso');
      const invited = { name: formData.name, email: formData.email, phone: formData.phone };
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'viewer',
        status: 'pending'
      });
      if (onSuccess) {
        onSuccess(invited);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao convidar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convidar Usuário">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome</label>
          <Input 
            placeholder="Nome completo" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">E-mail</label>
          <Input 
            type="email"
            placeholder="email@exemplo.com" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Função</label>
            <select 
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="viewer">Visualizador</option>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Enviar Convite</Button>
        </div>
      </form>
    </Modal>
  );
}
