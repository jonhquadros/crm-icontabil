import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { clientService } from '../services/clientService';
import { Client, TaxRegime } from '../types';
import toast from 'react-hot-toast';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    document: '',
    email: '',
    phone: '',
    type: 'PJ' as 'PF' | 'PJ',
    taxRegime: 'Simples Nacional' as TaxRegime,
    status: 'active' as any
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        companyName: client.companyName || '',
        document: client.document || '',
        email: client.email || '',
        phone: client.phone || '',
        type: client.type || 'PJ',
        taxRegime: client.taxRegime || 'Simples Nacional',
        status: client.status || 'active'
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (!formData.name || !formData.document) {
      toast.error('Nome e Documento são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await clientService.updateClient(client.id, formData);
      toast.success('Cliente atualizado com sucesso');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo</label>
            <select 
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="PJ">Pessoa Jurídica</option>
              <option value="PF">Pessoa Física</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Regime Tributário</label>
            <select 
              className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm"
              value={formData.taxRegime}
              onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as any })}
            >
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
              <option value="Lucro Real">Lucro Real</option>
              <option value="MEI">MEI</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome / Responsável</label>
          <Input 
            placeholder="Nome completo" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Razão Social (Opcional)</label>
          <Input 
            placeholder="Nome da empresa" 
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">CNPJ / CPF</label>
          <Input 
            placeholder="00.000.000/0000-00" 
            value={formData.document}
            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">E-mail</label>
            <Input 
              type="email" 
              placeholder="email@exemplo.com" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Telefone</label>
            <Input 
              placeholder="(00) 00000-0000" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
          <select 
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="active">Ativo</option>
            <option value="pending">Pendente</option>
            <option value="inactive">Inativo</option>
            <option value="lead">Lead</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
        </div>
      </form>
    </Modal>
  );
}
