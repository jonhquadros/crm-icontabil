import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Shield, 
  Mail, 
  Phone, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Settings,
  ShieldAlert,
  User,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { AppUser, UserRole } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { AddUserModal } from '../components/AddUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { EditPermissionsModal } from '../components/EditPermissionsModal';
import { InviteModal } from '../components/InviteModal';
import { cn } from '../../../shared/utils/cn';
import toast from 'react-hot-toast';

export function UsersPage() {
  const { userData, user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Modals for editing & invitations
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AppUser | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<AppUser | null>(null);
  const [inviteTarget, setInviteTarget] = useState<{ name: string; email: string; phone?: string } | null>(null);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuUserId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubscribe = userService.subscribeToCompanyUsers(userData.companyId, (data) => {
      setUsers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.companyId]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Administrador
          </span>
        );
      case 'global_admin':
        return (
          <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Global Admin
          </span>
        );
      case 'operator':
        return (
          <span className="bg-success/10 text-success border border-success/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Operador
          </span>
        );
      case 'viewer':
        return (
          <span className="bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Visualizador
          </span>
        );
      default:
        return null;
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    try {
      await userService.updateUser(user.id, { 
        status: user.status === 'active' ? 'inactive' : 'active' 
      });
      toast.success(`Usuário ${user.status === 'active' ? 'desativado' : 'ativado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleResendInvite = async (user: AppUser) => {
    setActiveMenuUserId(null);
    try {
      await userService.updateUser(user.id, { status: 'pending' });
      setInviteTarget({
        name: user.name,
        email: user.email,
        phone: user.phone
      });
      toast.success(`Convite gerado para ${user.email}`);
    } catch (error) {
      toast.error('Erro ao reenviar convite');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    setActiveMenuUserId(null);
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${user.name}?`)) return;

    try {
      await userService.deleteUser(user.id);
      toast.success(`Usuário ${user.name} removido com sucesso`);
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários e Permissões</h2>
          <p className="text-muted-foreground text-sm">Gerencie quem tem acesso ao CRM e seus níveis de permissão.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Convidar Usuário
        </Button>
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        companyId={userData?.companyId || ''}
        currentUserId={user?.uid || ''}
        onSuccess={(newUser) => setInviteTarget(newUser)}
      />

      <EditUserModal
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        user={selectedUserForEdit}
      />

      <EditPermissionsModal
        isOpen={!!selectedUserForPermissions}
        onClose={() => setSelectedUserForPermissions(null)}
        user={selectedUserForPermissions}
      />

      {inviteTarget && (
        <InviteModal
          isOpen={!!inviteTarget}
          onClose={() => setInviteTarget(null)}
          userName={inviteTarget.name}
          userEmail={inviteTarget.email}
          userPhone={inviteTarget.phone}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de Usuários</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativos</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center text-warning">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendentes</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome / E-mail</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Função</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-16 bg-muted/10"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <p>Nenhum usuário encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          user.status === 'active' ? "bg-success" : 
                          user.status === 'pending' ? "bg-warning" : "bg-danger"
                        )} />
                        <span className="text-xs font-medium">
                          {user.status === 'active' ? 'Ativo' : 
                           user.status === 'pending' ? 'Pendente' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative" ref={activeMenuUserId === user.id ? menuRef : null}>
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            user.status === 'active' ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"
                          )}
                          title={user.status === 'active' ? "Desativar Acesso" : "Reativar Acesso"}
                        >
                          {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>

                        <button 
                          onClick={() => setSelectedUserForPermissions(user)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Permissões / Nível de Acesso"
                        >
                          <Settings size={18} />
                        </button>

                        <button 
                          onClick={() => setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Mais Opções"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuUserId === user.id && (
                          <div className="absolute right-0 top-11 z-50 w-48 bg-card rounded-xl border border-border shadow-xl py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                            <button 
                              onClick={() => {
                                setActiveMenuUserId(null);
                                setSelectedUserForEdit(user);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                            >
                              <Pencil size={15} className="text-muted-foreground" />
                              Editar Dados
                            </button>

                            <button 
                              onClick={() => {
                                setActiveMenuUserId(null);
                                setSelectedUserForPermissions(user);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                            >
                              <Shield size={15} className="text-muted-foreground" />
                              Permissões
                            </button>

                            <button 
                              onClick={() => handleResendInvite(user)}
                              className="w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                            >
                              <RefreshCw size={15} className="text-muted-foreground" />
                              Reenviar Convite
                            </button>

                            <div className="my-1 border-t border-border" />

                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="w-full px-4 py-2.5 text-xs font-medium text-danger hover:bg-danger/10 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 size={15} />
                              Excluir Usuário
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
