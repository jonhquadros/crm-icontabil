import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Building2,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Pencil,
  Trash2,
  UserX
} from 'lucide-react';
import { clientService } from '../services/clientService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Client, ClientStatus, TaxRegime } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { AddClientModal } from '../components/AddClientModal';
import { EditClientModal } from '../components/EditClientModal';
import { cn } from '../../../shared/utils/cn';
import toast from 'react-hot-toast';

export function ClientsPage() {
  const { userData } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regimeFilter, setRegimeFilter] = useState<TaxRegime | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubscribe = clientService.subscribeToClients(userData.companyId, (data) => {
      setClients(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.companyId]);

  const activeCount = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status === 'inactive').length;
  const leadCount = clients.filter(c => c.status === 'lead' || c.status === 'blocked').length;

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document.includes(searchTerm);
    
    const matchesRegime = regimeFilter === 'all' || client.taxRegime === regimeFilter;
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesRegime && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 size={16} className="text-success" />;
      case 'inactive': return <UserX size={16} className="text-muted-foreground" />;
      case 'lead': return <Clock size={16} className="text-warning" />;
      case 'blocked': return <AlertCircle size={16} className="text-danger" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'lead': return 'Lead';
      case 'inactive': return 'Inativo';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      await clientService.deleteClient(id);
      toast.success('Cliente removido com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir cliente');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">Gerencie a base de clientes do seu escritório.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Novo Cliente
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Clientes</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold">{clients.length}</p>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clientes Ativos</span>
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clientes Inativos</span>
            <div className="p-2 rounded-lg bg-muted/80 text-muted-foreground">
              <UserX size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold">{inactiveCount}</p>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leads / Outros</span>
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold">{leadCount}</p>
        </div>
      </div>

      <AddClientModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        companyId={userData?.companyId || ''} 
      />

      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
      />

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, empresa ou documento..." 
            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-muted-foreground" />
          <select 
            className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos ({activeCount})</option>
            <option value="inactive">Inativos ({inactiveCount})</option>
            <option value="lead">Leads</option>
            <option value="blocked">Bloqueados</option>
          </select>

          <select 
            className="bg-background border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={regimeFilter}
            onChange={(e) => setRegimeFilter(e.target.value as any)}
          >
            <option value="all">Todos os Regimes</option>
            <option value="Simples Nacional">Simples Nacional</option>
            <option value="Lucro Presumido">Lucro Presumido</option>
            <option value="Lucro Real">Lucro Real</option>
            <option value="MEI">MEI</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente / Empresa</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regime</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-muted/10"></td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="opacity-20" />
                      <p>Nenhum cliente encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {client.type === 'PJ' ? <Building2 size={18} /> : <User size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{client.companyName || client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {client.document}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail size={12} />
                          <span className="truncate max-w-[150px]">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone size={12} />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter border",
                        client.taxRegime === 'Simples Nacional' && "bg-success/10 text-success border-success/20",
                        client.taxRegime === 'Lucro Presumido' && "bg-primary/10 text-primary border-primary/20",
                        client.taxRegime === 'Lucro Real' && "bg-danger/10 text-danger border-danger/20",
                        client.taxRegime === 'MEI' && "bg-warning/10 text-warning border-warning/20",
                      )}>
                        {client.taxRegime}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(client.status)}
                        <span className="text-xs font-medium">{getStatusLabel(client.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingClient(client)}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                          title="Editar Cliente"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-2 hover:bg-danger/10 rounded-lg transition-colors text-muted-foreground hover:text-danger"
                          title="Excluir Cliente"
                        >
                          <Trash2 size={18} />
                        </button>
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
