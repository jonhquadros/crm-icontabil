import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { clientService } from '../services/clientService';
import { TaxRegime } from '../types';
import toast from 'react-hot-toast';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function AddClientModal({ isOpen, onClose, companyId }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    document: '',
    email: '',
    phone: '',
    type: 'PJ' as 'PF' | 'PJ',
    taxRegime: 'Simples Nacional' as TaxRegime,
    status: 'active' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.document) {
      toast.error('Nome e Documento são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await clientService.createClient({
        ...formData,
        companyId
      });
      toast.success('Cliente cadastrado com sucesso');
      onClose();
      setFormData({
        name: '',
        companyName: '',
        document: '',
        email: '',
        phone: '',
        type: 'PJ',
        taxRegime: 'Simples Nacional',
        status: 'active'
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Cliente">
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

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Cadastrar Cliente</Button>
        </div>
      </form>
    </Modal>
  );
}
