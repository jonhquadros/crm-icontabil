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
  RefreshCw,
  Download,
  ShieldCheck,
  History,
  Eye,
  Lock
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/components/ui/Tabs';
import { rbacLogger, RbacLog } from '../../../shared/utils/rbacLogger';
import toast from 'react-hot-toast';

export function UsersPage() {
  const { userData, user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // RBAC log states
  const [rbacLogs, setRbacLogs] = useState<RbacLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

  // Load RBAC logs when entering the logs tab
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchRbacLogs();
    }
  }, [activeTab]);

  const fetchRbacLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await rbacLogger.getRecentLogs(50);
      setRbacLogs(logs);
    } catch (err) {
      toast.error('Erro ao buscar logs de RBAC');
    } finally {
      setLoadingLogs(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleToggleStatus = async (targetUser: AppUser) => {
    try {
      await userService.updateUser(targetUser.id, { 
        status: targetUser.status === 'active' ? 'inactive' : 'active' 
      });
      toast.success(`Usuário ${targetUser.status === 'active' ? 'desativado' : 'ativado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleResendInvite = async (targetUser: AppUser) => {
    setActiveMenuUserId(null);
    try {
      await userService.updateUser(targetUser.id, { status: 'pending' });
      setInviteTarget({
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone
      });
      toast.success(`Convite gerado para ${targetUser.email}`);
    } catch (error) {
      toast.error('Erro ao reenviar convite');
    }
  };

  const handleDeleteUser = async (targetUser: AppUser) => {
    setActiveMenuUserId(null);
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${targetUser.name}?`)) return;

    try {
      await userService.deleteUser(targetUser.id);
      toast.success(`Usuário ${targetUser.name} removido com sucesso`);
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  };

  // Requirement 1: Relatório de exportação de permissões comparando com Firestore
  const handleExportPermissionReport = (targetUser: AppUser) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    const userPerms = targetUser.permissions || {};
    
    // Define default expected permissions based on the user role
    const getExpectedPermissions = (role: string) => {
      const full = { view: true, create: true, edit: true, delete: true };
      const readOnly = { view: true, create: false, edit: false, delete: false };
      const none = { view: false, create: false, edit: false, delete: false };

      if (role === 'admin' || role === 'global_admin') {
        return {
          dashboard: { view: true, create: true, edit: true, delete: true },
          clients: full,
          kanban: full,
          whatsapp: full,
          calendar: full,
          documents: full,
          tasks: full,
          reports: full,
          users: full,
          campaigns: full
        };
      }
      
      if (role === 'viewer') {
        return {
          dashboard: readOnly,
          clients: readOnly,
          kanban: readOnly,
          whatsapp: readOnly,
          calendar: readOnly,
          documents: readOnly,
          tasks: readOnly,
          reports: readOnly,
          users: none,
          campaigns: readOnly
        };
      }
      
      // Default / Operator expected setup
      return {
        dashboard: { view: true, create: true, edit: true, delete: false },
        clients: { view: true, create: true, edit: true, delete: false },
        kanban: { view: true, create: true, edit: true, delete: false },
        whatsapp: { view: true, create: true, edit: true, delete: false },
        calendar: { view: true, create: true, edit: true, delete: false },
        documents: { view: true, create: true, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false },
        reports: { view: true, create: false, edit: false, delete: false },
        users: none,
        campaigns: { view: true, create: true, edit: true, delete: false }
      };
    };

    const expected = getExpectedPermissions(targetUser.role);
    const modules: (keyof typeof expected)[] = [
      'dashboard', 'clients', 'kanban', 'whatsapp', 'calendar', 'documents', 'tasks', 'reports', 'users', 'campaigns'
    ];

    let report = '';
    report += `========================================================================\n`;
    report += `      RELATÓRIO DE AUDITORIA DE PERMISSÕES E NÍVEL DE ACESSO (RBAC)     \n`;
    report += `      iContábil CRM - Sistema de Gestão e Segurança                     \n`;
    report += `========================================================================\n\n`;
    
    report += `Data da Auditoria : ${timestamp}\n`;
    report += `Usuário Auditado  : ${targetUser.name}\n`;
    report += `E-mail            : ${targetUser.email}\n`;
    report += `Nível de Acesso   : ${targetUser.role.toUpperCase()}\n`;
    report += `Status da Conta   : ${targetUser.status.toUpperCase()}\n\n`;
    
    report += `------------------------------------------------------------------------\n`;
    report += `1. MATRIZ DE PERMISSÕES ATIVAS VS ESPERADAS POR PAPEL\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `MÓDULO       | OPERAÇÃO  | ATUAL | ESPERADO | STATUS\n`;
    report += `-------------+-----------+-------+----------+---------------------------\n`;

    let deviationsCount = 0;
    const warnings: string[] = [];

    modules.forEach(mod => {
      const actions: ('view' | 'create' | 'edit' | 'delete')[] = ['view', 'create', 'edit', 'delete'];
      actions.forEach(act => {
        const actualVal = !!(userPerms as any)[mod]?.[act];
        const expectedVal = !!(expected as any)[mod]?.[act];
        const match = actualVal === expectedVal;
        
        let statusStr = 'CONFORME';
        if (!match) {
          deviationsCount++;
          if (actualVal && !expectedVal) {
            statusStr = '⚠️ ACESSO RESIDUAL (NÃO RECOMENDADO)';
            warnings.push(`Acesso sobressalente no módulo [${mod}] para ação [${act}] (Inconformidade com papel ${targetUser.role.toUpperCase()}).`);
          } else {
            statusStr = '❌ RESTRIÇÃO DE ACESSO';
            warnings.push(`Usuário não possui acesso à ação [${act}] no módulo [${mod}] recomendado para o papel ${targetUser.role.toUpperCase()}.`);
          }
        }
        
        report += `${mod.padEnd(12)} | ${act.padEnd(9)} | ${actualVal ? 'SIM' : 'NÃO'}   | ${expectedVal ? 'SIM' : 'NÃO'}      | ${statusStr}\n`;
      });
    });

    report += `\n------------------------------------------------------------------------\n`;
    report += `2. ANÁLISE DE CONFORMIDADE E SEGURANÇA GERAL\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `Total de Desvios Detectados: ${deviationsCount}\n\n`;

    if (deviationsCount === 0) {
      report += `🟢 EM CONFORMIDADE: Nenhuma brecha de segurança ou desvio de acesso identificado.\n`;
      report += `O usuário '${targetUser.name}' possui exatamente o escopo adequado do perfil de '${targetUser.role}'.\n`;
    } else {
      report += `⚠️ DESVIOS ENCONTRADOS:\n`;
      warnings.forEach((warn, idx) => {
        report += `  [${idx + 1}] ${warn}\n`;
      });
      report += `\n[CORREÇÃO RECOMENDADA]: Ajuste as permissões do usuário clicando no ícone de engrenagem\n`;
      report += `em frente ao respectivo nome para reajustar ao padrão ideal.\n`;
    }

    report += `\n========================================================================\n`;
    report += `                       FIM DO RELATÓRIO DE AUDITORIA                    \n`;
    report += `========================================================================\n`;

    // Trigger down
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_rbac_${targetUser.email.replace(/[@.]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Relatório de auditoria gerado e baixado!');
  };

  const modulesKeys = [
    { key: 'dashboard', label: 'Painel' },
    { key: 'clients', label: 'Clientes' },
    { key: 'kanban', label: 'CRM / Kanban' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'documents', label: 'Documentos' },
    { key: 'tasks', label: 'Tarefas e Agenda' },
    { key: 'reports', label: 'Relatórios' },
    { key: 'users', label: 'Usuários' },
    { key: 'campaigns', label: 'Campanhas' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Usuários e Permissões</h2>
          <p className="text-muted-foreground text-sm">Gerencie quem tem acesso ao CRM e audite seus níveis de permissão.</p>
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

      {/* Primary administrative Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="border-b border-border flex items-center justify-between">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="list" className="gap-2">
              <User size={16} />
              Lista de Usuários
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-2">
              <ShieldCheck size={16} />
              Matriz de Permissões
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History size={16} />
              Logs de RBAC
            </TabsTrigger>
          </TabsList>

          {activeTab === 'logs' && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={fetchRbacLogs} disabled={loadingLogs}>
              <RefreshCw size={14} className={cn(loadingLogs && "animate-spin")} />
              Recarregar Logs
            </Button>
          )}
        </div>

        {/* Tab 1: Users List */}
        <TabsContent value="list" className="mt-0">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou e-mail..." 
                  className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
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
                    filteredUsers.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(item.role)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              item.status === 'active' ? "bg-success" : 
                              item.status === 'pending' ? "bg-warning" : "bg-danger"
                            )} />
                            <span className="text-xs font-medium text-foreground">
                              {item.status === 'active' ? 'Ativo' : 
                               item.status === 'pending' ? 'Pendente' : 'Inativo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 relative" ref={activeMenuUserId === item.id ? menuRef : null}>
                            <button 
                              onClick={() => handleToggleStatus(item)}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                item.status === 'active' ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10"
                              )}
                              title={item.status === 'active' ? "Desativar Acesso" : "Reativar Acesso"}
                            >
                              {item.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                            </button>

                            <button 
                              onClick={() => setSelectedUserForPermissions(item)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                              title="Permissões / Nível de Acesso"
                            >
                              <Settings size={18} />
                            </button>

                            <button 
                              onClick={() => setActiveMenuUserId(activeMenuUserId === item.id ? null : item.id)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                              title="Mais Opções"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuUserId === item.id && (
                              <div className="absolute right-0 top-11 z-50 w-48 bg-card rounded-xl border border-border shadow-xl py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                                <button 
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    setSelectedUserForEdit(item);
                                  }}
                                  className="w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                                >
                                  <Pencil size={15} className="text-muted-foreground" />
                                  Editar Dados
                                </button>

                                <button 
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    setSelectedUserForPermissions(item);
                                  }}
                                  className="w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                                >
                                  <Shield size={15} className="text-muted-foreground" />
                                  Permissões
                                </button>

                                <button 
                                  onClick={() => handleResendInvite(item)}
                                  className="w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                                >
                                  <RefreshCw size={15} className="text-muted-foreground" />
                                  Reenviar Convite
                                </button>

                                <div className="my-1 border-t border-border" />

                                <button 
                                  onClick={() => handleDeleteUser(item)}
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
        </TabsContent>

        {/* Tab 2: Permissions Matrix (Requirement 4 & Requirement 1 export) */}
        <TabsContent value="matrix" className="mt-0">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Matriz Geral de Controle de Acesso (RBAC)</h3>
                <p className="text-xs text-muted-foreground">Visão holística das permissões habilitadas por usuário registrado por módulo.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Visualizar</div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-blue-500" /> Criar</div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-500" /> Editar</div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-rose-500" /> Excluir</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-64">Usuário</th>
                    {modulesKeys.map(mod => (
                      <th key={mod.key} className="px-2 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                        {mod.label}
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right w-40">Auditoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={11} className="px-4 py-4 h-16 bg-muted/5"></td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                        Nenhum registro para visualização da matriz.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => {
                      const userPerms = item.permissions || {};
                      const isAdminRole = item.role === 'admin' || item.role === 'global_admin';

                      return (
                        <tr key={`matrix-${item.id}`} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-4 border-r border-border">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
                                <span className="text-[10px] text-muted-foreground font-semibold px-1.5 py-0.2 bg-muted rounded">
                                  {item.role.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>

                          {modulesKeys.map(mod => {
                            const modPerms = userPerms[mod.key] || {};
                            
                            return (
                              <td key={`${item.id}-${mod.key}`} className="px-2 py-4 text-center border-r border-border/40">
                                {isAdminRole ? (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span className="text-[9px] font-bold px-1 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded">V</span>
                                    <span className="text-[9px] font-bold px-1 py-0.2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">C</span>
                                    <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">E</span>
                                    <span className="text-[9px] font-bold px-1 py-0.2 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded">D</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <span className={cn(
                                      "text-[9px] font-bold px-1 py-0.2 rounded transition-all",
                                      modPerms.view 
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                        : "bg-muted text-muted-foreground/40 opacity-40"
                                    )}>V</span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-1 py-0.2 rounded transition-all",
                                      modPerms.create 
                                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                                        : "bg-muted text-muted-foreground/40 opacity-40"
                                    )}>C</span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-1 py-0.2 rounded transition-all",
                                      modPerms.edit 
                                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
                                        : "bg-muted text-muted-foreground/40 opacity-40"
                                    )}>E</span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-1 py-0.2 rounded transition-all",
                                      modPerms.delete 
                                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" 
                                        : "bg-muted text-muted-foreground/40 opacity-40"
                                    )}>D</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          <td className="px-4 py-4 text-right">
                            <Button 
                              size="xs" 
                              variant="outline" 
                              className="gap-1 border-primary/30 hover:border-primary text-primary transition-all text-[11px]"
                              onClick={() => handleExportPermissionReport(item)}
                            >
                              <Download size={12} />
                              Exportar
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Security & RBAC Logs (Requirement 2 logging frontend) */}
        <TabsContent value="logs" className="mt-0">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/10">
              <h3 className="font-bold text-lg text-foreground">Trilha de Auditoria - Tentativas de Acesso (RBAC)</h3>
              <p className="text-xs text-muted-foreground">Logs gerados automaticamente nas interceptações de rotas e verificações de autorização do CRM.</p>
            </div>

            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/5">
              <span className="text-xs text-muted-foreground font-semibold">Exibindo últimas 50 tentativas de acesso</span>
              <span className="text-xs text-muted-foreground">Atualizado em tempo real</span>
            </div>

            <div className="overflow-x-auto">
              {loadingLogs ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={24} className="animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium">Buscando auditoria de logs...</p>
                </div>
              ) : rbacLogs.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Lock size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm">Nenhum log de acesso interceptado até o momento.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Navegue pelas abas restritas do CRM para começar a registrar.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuário / Email</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rota de Destino</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Módulo / Ação</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decisão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {rbacLogs.map((log) => (
                      <tr key={log.id || log.timestamp} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 text-muted-foreground whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-foreground">{log.userEmail}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Papel: {log.userRole}</div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-muted-foreground truncate max-w-xs" title={log.route}>
                          {log.route}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-bold text-foreground capitalize">{log.module}</span>
                          <span className="text-muted-foreground ml-1">({log.action})</span>
                        </td>
                        <td className="px-6 py-3.5">
                          {log.permitted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                              PERMITIDO
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 w-fit">
                                NEGADO
                              </span>
                              <span className="text-[9px] text-rose-600 dark:text-rose-400 max-w-xs truncate" title={log.details}>
                                {log.details}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
