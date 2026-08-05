import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { settingsService } from '../services/settingsService';
import { settingsRepository } from '../repositories/settingsRepository';
import { 
  CompanyProfile, 
  IntegrationConfig, 
  SecuritySettings, 
  NotificationSettings, 
  PersonalizationSettings,
  AuditLogEntry
} from '../types';
import toast from 'react-hot-toast';

export function useSettings() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  // States
  const [profile, setProfile] = useState<CompanyProfile>({
    name: 'iContábil CRM',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logoUrl: '',
  });

  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    whatsapp: { enabled: false, apiUrl: '', apiKey: '', instanceName: 'icontabil-session', status: 'disconnected' },
    google: { enabled: false, calendarSync: true, driveSync: false, connectedAccount: '' },
    webhook: { enabled: false, endpointUrl: '', secretKey: '', events: ['lead.created', 'opportunity.moved'] },
    smtp: { enabled: false, host: 'smtp.gmail.com', port: 587, username: '', secure: true, senderEmail: '' },
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
    sessionTimeout: '60',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailOpportunities: true,
    emailTasks: true,
    emailReports: false,
    whatsappStatus: true,
    whatsappReminders: true,
    pushChat: true,
  });

  const [personalization, setPersonalization] = useState<PersonalizationSettings>({
    theme: 'light',
    primaryColor: 'blue',
    sidebarStyle: 'default',
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const userName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Administrador';

  // Load all settings
  const fetchSettings = useCallback(async () => {
    if (!userData) return;

    // Preferences
    if (userData.preferences) {
      if (userData.preferences.notifications) {
        setNotifications(prev => ({ ...prev, ...userData.preferences.notifications }));
      }
      if (userData.preferences.personalization) {
        setPersonalization(prev => ({ ...prev, ...userData.preferences.personalization }));
      }
      if (userData.preferences.security) {
        setSecurity(prev => ({ ...prev, ...userData.preferences.security }));
      }
    }

    if (!userData.companyId) return;

    setCompanyLoading(true);
    try {
      // Profile
      const compProfile = await settingsService.loadCompanyProfile(userData.companyId);
      if (compProfile) {
        setProfile(compProfile);
      } else {
        setProfile(prev => ({
          ...prev,
          name: userData.companyName || 'iContábil CRM',
          email: userData.email || '',
          phone: userData.phone || '',
        }));
      }

      // Integrations
      const compIntegrations = await settingsService.loadIntegrations(userData.companyId);
      setIntegrations(compIntegrations);

      // Audit Logs
      const logs = await settingsRepository.getAuditLogs(userData.companyId, 15);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setCompanyLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Actions
  const handleSaveProfile = async (data: CompanyProfile) => {
    if (!userData?.companyId) {
      toast.error('Nenhuma empresa vinculada ao usuário.');
      return;
    }
    setLoading(true);
    try {
      await settingsService.saveCompanyProfile(userData.companyId, data, userData.id, userName);
      setProfile(data);
      toast.success('Perfil da empresa salvo com sucesso!');
      fetchSettings();
    } catch (err: any) {
      toast.error('Erro ao salvar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegrations = async (data: IntegrationConfig) => {
    if (!userData?.companyId) {
      toast.error('Nenhuma empresa vinculada ao usuário.');
      return;
    }
    setLoading(true);
    try {
      await settingsService.saveIntegrations(userData.companyId, data, userData.id, userName);
      setIntegrations(data);
      toast.success('Configurações de integração salvas com sucesso!');
      fetchSettings();
    } catch (err: any) {
      toast.error('Erro ao salvar integrações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async (data: SecuritySettings) => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      await settingsService.saveSecurity(userData.id, userData.companyId || '', data, userName);
      setSecurity(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      toast.success('Configurações de segurança atualizadas!');
      fetchSettings();
    } catch (err: any) {
      toast.error('Erro ao salvar segurança: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async (data: NotificationSettings) => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      await settingsService.saveNotifications(userData.id, data);
      setNotifications(data);
      toast.success('Preferências de notificação atualizadas!');
    } catch (err: any) {
      toast.error('Erro ao salvar notificações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalization = async (data: PersonalizationSettings) => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      await settingsService.savePersonalization(userData.id, data);
      setPersonalization(data);
      toast.success('Estilo visual atualizado!');
    } catch (err: any) {
      toast.error('Erro ao salvar personalização: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWhatsApp = async () => {
    const res = await settingsService.testWhatsAppConnection(integrations.whatsapp.apiUrl, integrations.whatsapp.apiKey);
    if (res.success) {
      toast.success(res.message);
      setIntegrations(prev => ({
        ...prev,
        whatsapp: { ...prev.whatsapp, status: 'connected', lastConnectedAt: new Date().toISOString() }
      }));
    } else {
      toast.error(res.message);
    }
  };

  const handleTestWebhook = async () => {
    const res = await settingsService.testWebhookEndpoint(integrations.webhook.endpointUrl);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return {
    loading,
    companyLoading,
    profile,
    setProfile,
    integrations,
    setIntegrations,
    security,
    setSecurity,
    notifications,
    setNotifications,
    personalization,
    setPersonalization,
    auditLogs,
    handleSaveProfile,
    handleSaveIntegrations,
    handleSaveSecurity,
    handleSaveNotifications,
    handleSavePersonalization,
    handleTestWhatsApp,
    handleTestWebhook,
    refetch: fetchSettings,
  };
}
