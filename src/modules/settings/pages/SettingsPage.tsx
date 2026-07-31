import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Shield, 
  Bell, 
  Palette,
  Save,
  CreditCard,
  History,
  Database,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { seedDatabase } from '../../../lib/seedService';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation
    setTimeout(() => {
      setLoading(false);
      toast.success('Configurações salvas com sucesso');
    }, 1000);
  };

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedDatabase(user.uid, user.email || '');
      toast.success('Banco de dados populado com sucesso! Recarregue a página para ver as mudanças.');
      // Optional: window.location.reload()
    } catch (error) {
      console.error(error);
      toast.error('Erro ao popular banco de dados');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground text-sm">Gerencie os detalhes da sua empresa e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-3 space-y-1">
          {[
            { label: 'Perfil da Empresa', icon: Building2, active: true },
            { label: 'Segurança', icon: Shield },
            { label: 'Notificações', icon: Bell },
            { label: 'Personalização', icon: Palette },
            { label: 'Assinatura', icon: CreditCard },
            { label: 'Logs de Atividade', icon: History },
          ].map((item, i) => (
            <button 
              key={i}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                item.active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-9 space-y-6">
          <form onSubmit={handleSave} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-bold">Perfil da Empresa</h3>
              <p className="text-xs text-muted-foreground">Essas informações serão exibidas em documentos e faturas.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-border">
                <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed border-border group cursor-pointer relative overflow-hidden">
                  <Building2 size={32} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <span className="text-[10px] font-bold">Alterar Logo</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1">Logo da Empresa</h4>
                  <p className="text-xs text-muted-foreground mb-3">Recomendado: 400x400px. Formato PNG ou JPG.</p>
                  <Button variant="outline" size="sm" type="button">Fazer Upload</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Razão Social</label>
                  <Input defaultValue={userData?.companyName || 'Meu Escritório Contábil'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CNPJ</label>
                  <Input placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">E-mail Corporativo</label>
                  <Input type="email" placeholder="contato@empresa.com" icon={<Mail size={18} />} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Telefone</label>
                  <Input placeholder="(00) 0000-0000" icon={<Phone size={18} />} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Endereço</label>
                  <Input placeholder="Rua, Número, Bairro, Cidade - UF" icon={<MapPin size={18} />} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Website</label>
                  <Input placeholder="https://www.empresa.com" icon={<Globe size={18} />} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
              <Button type="submit" loading={loading} className="gap-2">
                <Save size={18} />
                Salvar Alterações
              </Button>
            </div>
          </form>

          {/* Subscriptions Mini Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Plano Professional</h4>
                <p className="text-xs text-muted-foreground">Sua próxima renovação é em 15 de Agosto, 2026.</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Gerenciar Plano</Button>
          </div>

          {/* Dev Tools Section */}
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <Database size={20} />
              <h4 className="font-bold">Ferramentas de Desenvolvedor</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Utilize estas ferramentas para testar o sistema com dados reais. Esta ação irá criar perfis de usuário, clientes, tarefas e documentos de exemplo.
            </p>
            <Button 
              onClick={handleSeed} 
              loading={seeding}
              variant="outline" 
              className="border-warning/30 text-warning hover:bg-warning/10"
            >
              {seeding ? <Loader2 className="animate-spin mr-2" size={18} /> : <Database className="mr-2" size={18} />}
              Popular Banco com Dados Reais
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for styled items
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
