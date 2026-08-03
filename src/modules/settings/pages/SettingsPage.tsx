import React, { useState, useEffect } from 'react';
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
  Lock,
  User,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  Sliders,
  Moon,
  Sun,
  Monitor,
  Check,
  ChevronRight,
  Download,
  Clock
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Badge } from '../../../shared/components/ui/Badge';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '../../../shared/utils/cn';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
}

export function SettingsPage() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: 'Meu Escritório Contábil',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logoUrl: '',
  });

  // Security state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
    sessionTimeout: '60',
  });

  // Notifications state
  const [notificationsForm, setNotificationsForm] = useState({
    emailOpportunities: true,
    emailTasks: true,
    emailReports: false,
    whatsappStatus: true,
    whatsappReminders: true,
    pushChat: true,
  });

  // Personalization state
  const [personalizationForm, setPersonalizationForm] = useState({
    theme: 'light',
    primaryColor: 'blue',
    sidebarStyle: 'default',
  });

  // Load Company and Preferences from Firestore on Mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!userData) return;
      
      // Load user preferences
      if (userData.preferences) {
        if (userData.preferences.notifications) {
          setNotificationsForm(prev => ({ ...prev, ...userData.preferences.notifications }));
        }
        if (userData.preferences.personalization) {
          setPersonalizationForm(prev => ({ ...prev, ...userData.preferences.personalization }));
        }
      }

      if (!userData.companyId) return;

      setCompanyLoading(true);
      try {
        const companyRef = doc(db, 'companies', userData.companyId);
        const snap = await getDoc(companyRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfileForm({
            name: data.name || userData.companyName || 'iContábil CRM',
            cnpj: data.cnpj || '',
            email: data.email || userData.email || '',
            phone: data.phone || userData.phone || '',
            address: data.address || '',
            website: data.website || '',
            logoUrl: data.logoUrl || '',
          });
        } else {
          // If the company doc doesn't exist, use fallbacks
          setProfileForm(prev => ({
            ...prev,
            name: userData.companyName || 'iContábil CRM',
            email: userData.email || '',
            phone: userData.phone || '',
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar configurações da empresa:', err);
      } finally {
        setCompanyLoading(false);
      }
    };

    loadSettings();
  }, [userData]);

  // Save Company Profile Tab
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.companyId) {
      toast.error('Nenhuma empresa associada a este usuário.');
      return;
    }

    setLoading(true);
    try {
      const companyRef = doc(db, 'companies', userData.companyId);
      
      // Check if document exists, set or update accordingly
      const snap = await getDoc(companyRef);
      const updateData = {
        name: profileForm.name,
        cnpj: profileForm.cnpj,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        website: profileForm.website,
        logoUrl: profileForm.logoUrl,
        updatedAt: serverTimestamp(),
        updatedBy: userData.id,
      };

      if (snap.exists()) {
        await updateDoc(companyRef, updateData);
      } else {
        await setDoc(companyRef, {
          ...updateData,
          id: userData.companyId,
          active: true,
          createdAt: serverTimestamp(),
          createdBy: userData.id,
        });
      }

      // Sync companyName in user's profile
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        companyName: profileForm.name,
        updatedAt: serverTimestamp(),
      });

      toast.success('Perfil da empresa atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar configurações da empresa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Security settings
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (securityForm.newPassword) {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
          toast.error('A nova senha e a confirmação não coincidem.');
          setLoading(false);
          return;
        }
        if (securityForm.newPassword.length < 6) {
          toast.error('A nova senha deve ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }
      }

      // Persist preferences
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        'preferences.security': {
          twoFactor: securityForm.twoFactor,
          sessionTimeout: securityForm.sessionTimeout,
        },
        updatedAt: serverTimestamp(),
      });

      // Clear password fields
      setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      toast.success('Configurações de segurança atualizadas com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar preferências de segurança: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Notification toggles
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        'preferences.notifications': notificationsForm,
        updatedAt: serverTimestamp(),
      });
      toast.success('Preferências de notificação salvas!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar preferências: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Personalization
  const handleSavePersonalization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        'preferences.personalization': personalizationForm,
        updatedAt: serverTimestamp(),
      });
      toast.success('Preferências visuais atualizadas!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar preferências visuais: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const menuItems: SidebarItem[] = [
    { id: 'profile', label: 'Perfil da Empresa', icon: Building2 },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'personalization', label: 'Personalização', icon: Palette },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'logs', label: 'Logs de Atividade', icon: History },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground text-sm">Gerencie os detalhes da sua empresa e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="md:col-span-3 space-y-1">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-9">
          {companyLoading ? (
            <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Carregando dados das configurações...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-base text-foreground">Perfil da Empresa</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Essas informações serão exibidas em documentos, faturas e relatórios.</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-6 pb-6 border-b border-border">
                      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed border-border group relative overflow-hidden shrink-0">
                        {profileForm.logoUrl ? (
                          <img 
                            src={profileForm.logoUrl} 
                            alt="Logo da Empresa" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Building2 size={28} />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="text-[10px] font-bold">Ver Logo</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="text-sm font-bold">Logo da Empresa</h4>
                        <div className="flex gap-2 max-w-md">
                          <Input 
                            placeholder="URL do logotipo (ex: https://logo.com/img.png)" 
                            value={profileForm.logoUrl}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Insira um link para o seu logotipo em formato PNG ou JPG.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Razão Social</label>
                        <Input 
                          value={profileForm.name} 
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} 
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CNPJ</label>
                        <Input 
                          placeholder="00.000.000/0000-00" 
                          value={profileForm.cnpj} 
                          onChange={(e) => setProfileForm(prev => ({ ...prev, cnpj: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">E-mail Corporativo</label>
                        <Input 
                          type="email" 
                          placeholder="contato@empresa.com" 
                          icon={<Mail size={18} />} 
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Telefone</label>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          icon={<Phone size={18} />} 
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Endereço</label>
                        <Input 
                          placeholder="Rua, Número, Bairro, Cidade - UF" 
                          icon={<MapPin size={18} />} 
                          value={profileForm.address}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Website</label>
                        <Input 
                          placeholder="https://www.empresa.com" 
                          icon={<Globe size={18} />} 
                          value={profileForm.website}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button type="submit" isLoading={loading} className="gap-2">
                      <Save size={18} />
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handleSaveSecurity} className="space-y-6">
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                      <h3 className="font-bold text-base text-foreground">Alterar Senha</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Certifique-se de usar uma senha forte e única para proteção da conta.</p>
                    </div>
                    
                    <div className="p-6 space-y-4 max-w-xl">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Senha Atual</label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nova Senha</label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          value={securityForm.newPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Confirmar Nova Senha</label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          value={securityForm.confirmPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                      <h3 className="font-bold text-base text-foreground">Políticas de Segurança</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Defina as preferências de acesso e autenticação.</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold">Autenticação de Dois Fatores (2FA)</h4>
                          <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">Exige um código de autenticação no seu telefone além da sua senha sempre que fizer login na conta.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={securityForm.twoFactor} 
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, twoFactor: e.target.checked }))} 
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="h-px bg-border" />

                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold">Tempo Limite de Inatividade</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">Tempo de inatividade antes de o usuário ser desconectado automaticamente por segurança.</p>
                        </div>
                        <Select 
                          value={securityForm.sessionTimeout}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                          className="min-w-[140px]"
                        >
                          <option value="15">15 minutos</option>
                          <option value="30">30 minutos</option>
                          <option value="60">1 hora</option>
                          <option value="240">4 horas</option>
                          <option value="0">Nunca expirar</option>
                        </Select>
                      </div>
                    </div>

                    <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                      <Button type="submit" isLoading={loading} className="gap-2">
                        <Save size={18} />
                        Salvar Segurança
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleSaveNotifications} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-base text-foreground">Preferências de Notificação</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Controle como e quando deseja receber alertas das operações do CRM.</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Mail size={14} /> E-mail
                      </h4>
                      
                      <div className="space-y-4 pl-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationsForm.emailOpportunities}
                            onChange={(e) => setNotificationsForm(prev => ({ ...prev, emailOpportunities: e.target.checked }))}
                            className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold">Novas Oportunidades</p>
                            <p className="text-xs text-muted-foreground">Receber e-mail sempre que uma nova oportunidade for atribuída a você.</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationsForm.emailTasks}
                            onChange={(e) => setNotificationsForm(prev => ({ ...prev, emailTasks: e.target.checked }))}
                            className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold">Lembrete de Tarefas</p>
                            <p className="text-xs text-muted-foreground">Alertas de prazos de tarefas e reuniões agendadas com clientes.</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationsForm.emailReports}
                            onChange={(e) => setNotificationsForm(prev => ({ ...prev, emailReports: e.target.checked }))}
                            className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold">Relatórios de Desempenho</p>
                            <p className="text-xs text-muted-foreground">Receber um relatório geral de conversão do pipeline toda segunda-feira.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <MessageSquareIcon size={14} /> WhatsApp
                      </h4>
                      
                      <div className="space-y-4 pl-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationsForm.whatsappStatus}
                            onChange={(e) => setNotificationsForm(prev => ({ ...prev, whatsappStatus: e.target.checked }))}
                            className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold">Atualização de Oportunidades</p>
                            <p className="text-xs text-muted-foreground">Notificar clientes automaticamente sobre atualizações de status ou reuniões.</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationsForm.whatsappReminders}
                            onChange={(e) => setNotificationsForm(prev => ({ ...prev, whatsappReminders: e.target.checked }))}
                            className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold">Compromissos Críticos</p>
                            <p className="text-xs text-muted-foreground">Receber notificações rápidas no WhatsApp de obrigações tributárias.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Sliders size={14} /> Sistema e Navegador (Push)
                      </h4>
                      
                      <div className="space-y-4 pl-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notificationsForm.pushChat}
                            onChange={(e) => setNotificationsForm(prev => ({ ...prev, pushChat: e.target.checked }))}
                            className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                          />
                          <div>
                            <p className="text-sm font-semibold">Novas Mensagens de Chat</p>
                            <p className="text-xs text-muted-foreground">Mostrar notificações flutuantes no navegador para novos chats WhatsApp recebidos.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                    <Button type="submit" isLoading={loading} className="gap-2">
                      <Save size={18} />
                      Salvar Notificações
                    </Button>
                  </div>
                </form>
              )}

              {/* Personalization Tab */}
              {activeTab === 'personalization' && (
                <form onSubmit={handleSavePersonalization} className="space-y-6">
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                      <h3 className="font-bold text-base text-foreground">Tema Visual</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Escolha o estilo de aparência que melhor se adapta ao seu ambiente de trabalho.</p>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Modo Claro', desc: 'Ideal para ambientes claros', icon: Sun, colors: 'bg-slate-50 border-slate-200' },
                        { id: 'dark', label: 'Modo Escuro', desc: 'Evita a fadiga ocular', icon: Moon, colors: 'bg-slate-900 border-slate-800 text-slate-100' },
                        { id: 'system', label: 'Sistema', desc: 'Sincroniza com o computador', icon: Monitor, colors: 'bg-gradient-to-r from-slate-50 to-slate-900 border-slate-300' },
                      ].map((themeOpt) => (
                        <div 
                          key={themeOpt.id}
                          onClick={() => setPersonalizationForm(prev => ({ ...prev, theme: themeOpt.id }))}
                          className={cn(
                            "cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all",
                            personalizationForm.theme === themeOpt.id 
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <div className={cn("w-full h-24 rounded-lg border flex items-center justify-center relative overflow-hidden", themeOpt.colors)}>
                            <themeOpt.icon size={28} className={themeOpt.id === 'light' ? 'text-amber-500' : 'text-slate-400'} />
                            {personalizationForm.theme === themeOpt.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{themeOpt.label}</h4>
                            <p className="text-[11px] text-muted-foreground">{themeOpt.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                      <h3 className="font-bold text-base text-foreground">Paleta de Cores (Identidade Visual)</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Selecione a cor de destaque principal do painel do iContábil.</p>
                    </div>
                    
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { id: 'blue', label: 'Azul iContábil', hex: '#0284c7', bg: 'bg-sky-600' },
                        { id: 'emerald', label: 'Verde Esmeralda', hex: '#059669', bg: 'bg-emerald-600' },
                        { id: 'indigo', label: 'Roxo Índigo', hex: '#4f46e5', bg: 'bg-indigo-600' },
                        { id: 'amber', label: 'Amarelo Ouro', hex: '#d97706', bg: 'bg-amber-600' },
                        { id: 'coral', label: 'Vermelho Coral', hex: '#dc2626', bg: 'bg-rose-600' },
                      ].map((colorOpt) => (
                        <div 
                          key={colorOpt.id}
                          onClick={() => setPersonalizationForm(prev => ({ ...prev, primaryColor: colorOpt.id }))}
                          className={cn(
                            "cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all text-center",
                            personalizationForm.primaryColor === colorOpt.id 
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner", colorOpt.bg)}>
                            {personalizationForm.primaryColor === colorOpt.id && <Check size={16} />}
                          </div>
                          <span className="text-xs font-semibold">{colorOpt.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
                      <Button type="submit" isLoading={loading} className="gap-2">
                        <Save size={18} />
                        Salvar Estilo
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Active Plan Card */}
                  <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-xl border border-primary/20 shadow-md p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary">Plano Atual</Badge>
                          <span className="text-xs text-muted-foreground">Renovação automática ativa</span>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">iContábil CRM Professional</h3>
                        <p className="text-xs text-muted-foreground">Gerenciamento avançado de pipeline, contatos e integrações.</p>
                      </div>
                      
                      <div className="text-right md:text-left space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Valor do plano</p>
                        <p className="text-2xl font-extrabold text-foreground">R$ 299,00<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                        <p className="text-xs text-success font-semibold flex items-center gap-1"><CheckCircle size={12} /> Próxima fatura em 15/08/2026</p>
                      </div>
                    </div>

                    <div className="h-px bg-border my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Contatos / Leads</span>
                          <span className="text-foreground font-bold">142 / 500 (28%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '28.4%' }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Usuários Operacionais</span>
                          <span className="text-foreground font-bold">3 / 10 (30%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '30%' }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Armazenamento</span>
                          <span className="text-foreground font-bold">2.4 GB / 20 GB (12%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '12%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                      <h3 className="font-bold text-base text-foreground">Histórico de Cobrança</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Visualize as faturas e comprovantes anteriores dos serviços contratados.</p>
                    </div>

                    <div className="divide-y divide-border">
                      {[
                        { invoiceId: 'INV-2026-003', date: '15 de Julho, 2026', amount: 'R$ 299,00', status: 'paga' },
                        { invoiceId: 'INV-2026-002', date: '15 de Junho, 2026', amount: 'R$ 299,00', status: 'paga' },
                        { invoiceId: 'INV-2026-001', date: '15 de Maio, 2026', amount: 'R$ 299,00', status: 'paga' },
                      ].map((invoice) => (
                        <div key={invoice.invoiceId} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{invoice.invoiceId}</p>
                              <p className="text-xs text-muted-foreground">{invoice.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-foreground">{invoice.amount}</span>
                            <Badge variant="success">Paga</Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => toast.success(`Download da fatura ${invoice.invoiceId} iniciado!`)}
                            >
                              <Download size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Logs Tab */}
              {activeTab === 'logs' && (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border bg-muted/30">
                    <h3 className="font-bold text-base text-foreground">Logs de Atividade</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Auditoria e rastreabilidade das ações críticas feitas por usuários no sistema.</p>
                  </div>

                  <div className="p-6">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {[
                          { 
                            id: 1, 
                            title: 'Status de Oportunidade alterado', 
                            desc: `O usuário ${userData?.name || 'Administrador'} alterou o status da oportunidade 'Silva & Santos Advogados' para Reunião.`, 
                            time: 'há 10 minutos', 
                            icon: Sparkles, 
                            color: 'bg-primary/10 text-primary' 
                          },
                          { 
                            id: 2, 
                            title: 'Campanha de Marketing Sincronizada', 
                            desc: 'O sistema iContábil CRM importou 12 novas oportunidades originadas de formulários web.', 
                            time: 'há 2 horas', 
                            icon: Clock, 
                            color: 'bg-success/10 text-success' 
                          },
                          { 
                            id: 3, 
                            title: 'Documento excluído permanentemente', 
                            desc: 'O documento "Contrato_Social.pdf" foi excluído permanentemente da pasta de anexos.', 
                            time: 'há 4 horas', 
                            icon: AlertTriangle, 
                            color: 'bg-danger/10 text-danger' 
                          },
                          { 
                            id: 4, 
                            title: 'Modo WhatsApp Conectado', 
                            desc: 'Instância de chat QR-Code sincronizada e conectada com sucesso nas comunicações automáticas.', 
                            time: 'há 1 dia', 
                            icon: CheckCircle, 
                            color: 'bg-success/10 text-success' 
                          },
                          { 
                            id: 5, 
                            title: 'Usuário Convidado para a Empresa', 
                            desc: 'O operador joao@icontabil.com foi adicionado ao time com permissões básicas de visualização.', 
                            time: 'há 3 dias', 
                            icon: User, 
                            color: 'bg-warning/10 text-warning' 
                          }
                        ].map((log, logIdx) => (
                          <li key={log.id}>
                            <div className="relative pb-8">
                              {logIdx !== 4 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card",
                                    log.color
                                  )}>
                                    <log.icon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm font-bold text-foreground">{log.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{log.desc}</p>
                                  </div>
                                  <div className="text-right text-xs whitespace-nowrap text-muted-foreground">
                                    <time>{log.time}</time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom simple fallback wrapper in case MessageSquare is imported incorrectly
function MessageSquareIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
