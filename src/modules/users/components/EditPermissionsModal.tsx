import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { userService } from '../services/userService';
import { AppUser, UserRole, UserPermissions, DEFAULT_PERMISSIONS } from '../types';
import toast from 'react-hot-toast';
import { Shield, RotateCcw } from 'lucide-react';

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
}

const MODULE_LABELS: Record<keyof UserPermissions, string> = {
  dashboard: 'Dashboard / Métricas',
  clients: 'Clientes / CRM',
  kanban: 'CRM / Pipeline',
  whatsapp: 'WhatsApp Integrado',
  calendar: 'Agenda / Calendário',
  documents: 'Documentos / Arquivos',
  tasks: 'Tarefas / Projetos',
  reports: 'Relatórios',
  users: 'Gestão de Usuários'
};

export function EditPermissionsModal({ isOpen, onClose, user }: EditPermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('viewer');
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'viewer');
      setPermissions(user.permissions || DEFAULT_PERMISSIONS);
    }
  }, [user]);

  const handleToggle = (moduleKey: keyof UserPermissions, permKey: 'view' | 'create' | 'edit' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [permKey]: !prev[moduleKey]?.[permKey]
      }
    }));
  };

  const handleResetToDefault = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    toast.success('Permissões restauradas para os valores padrão');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await userService.saveUserPermissions(user.id, role, permissions);
      toast.success('Nível de acesso e permissões atualizados');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissões de Acesso - ${user?.name || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <div>
              <p className="text-xs font-bold">Função Principal</p>
              <p className="text-[11px] text-muted-foreground">Define o nível geral de autorização do usuário</p>
            </div>
          </div>
          <select 
            className="bg-background border border-border rounded-lg py-1.5 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="viewer">Visualizador</option>
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
            <option value="global_admin">Global Admin</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permissões por Módulo</h4>
          <button 
            type="button" 
            onClick={handleResetToDefault}
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw size={12} />
            Restaurar Padrão
          </button>
        </div>

        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card">
          <div className="grid grid-cols-5 p-3 text-[10px] font-bold text-muted-foreground uppercase bg-muted/20">
            <span className="col-span-2">Módulo</span>
            <span className="text-center">Ver</span>
            <span className="text-center">Criar</span>
            <span className="text-center">Editar</span>
          </div>

          {(Object.keys(MODULE_LABELS) as Array<keyof UserPermissions>).map((moduleKey) => {
            const modPerms = permissions[moduleKey] || { view: false, create: false, edit: false, delete: false };
            return (
              <div key={moduleKey} className="grid grid-cols-5 p-3 items-center hover:bg-muted/10 transition-colors text-xs">
                <span className="col-span-2 font-medium">{MODULE_LABELS[moduleKey]}</span>
                
                <div className="flex justify-center">
                  <input 
                    type="checkbox" 
                    checked={modPerms.view} 
                    onChange={() => handleToggle(moduleKey, 'view')}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex justify-center">
                  <input 
                    type="checkbox" 
                    checked={modPerms.create} 
                    onChange={() => handleToggle(moduleKey, 'create')}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex justify-center">
                  <input 
                    type="checkbox" 
                    checked={modPerms.edit} 
                    onChange={() => handleToggle(moduleKey, 'edit')}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Salvar Permissões</Button>
        </div>
      </form>
    </Modal>
  );
}
