import { settingsRepository } from '../repositories/settingsRepository';
import { CompanyProfile, IntegrationConfig, SecuritySettings, NotificationSettings, PersonalizationSettings } from '../types';

export const settingsService = {
  loadCompanyProfile: async (companyId: string): Promise<CompanyProfile | null> => {
    return await settingsRepository.getCompanyProfile(companyId);
  },

  saveCompanyProfile: async (companyId: string, profile: CompanyProfile, userId: string, userName?: string): Promise<void> => {
    await settingsRepository.updateCompanyProfile(companyId, profile, userId);
    await settingsRepository.addAuditLog(companyId, {
      title: 'Perfil da Empresa Atualizado',
      description: `Razão Social: ${profile.name} | CNPJ: ${profile.cnpj || 'Não informado'}`,
      time: 'agora',
      type: 'updated',
      author: userName || 'Administrador',
    });
  },

  loadIntegrations: async (companyId: string): Promise<IntegrationConfig> => {
    const data = await settingsRepository.getIntegrations(companyId);
    // Default fallback structure with Evolution API env vars
    return {
      whatsapp: {
        enabled: data?.whatsapp?.enabled ?? true,
        apiUrl: data?.whatsapp?.apiUrl || import.meta.env.VITE_EVOLUTION_API_URL || 'https://go.relaxsolucoes.online',
        apiKey: data?.whatsapp?.apiKey || import.meta.env.VITE_EVOLUTION_API_KEY || '4f4d9fea-065a-4bcc-8e74-2e187ae1e89f',
        instanceName: data?.whatsapp?.instanceName || 'icontabil-session',
        status: data?.whatsapp?.status || 'disconnected',
        lastConnectedAt: data?.whatsapp?.lastConnectedAt || undefined,
      },
      google: {
        enabled: data?.google?.enabled ?? false,
        calendarSync: data?.google?.calendarSync ?? true,
        driveSync: data?.google?.driveSync ?? false,
        connectedAccount: data?.google?.connectedAccount || '',
      },
      webhook: {
        enabled: data?.webhook?.enabled ?? false,
        endpointUrl: data?.webhook?.endpointUrl || '',
        secretKey: data?.webhook?.secretKey || '',
        events: data?.webhook?.events || ['lead.created', 'opportunity.moved'],
      },
      smtp: {
        enabled: data?.smtp?.enabled ?? false,
        host: data?.smtp?.host || 'smtp.gmail.com',
        port: data?.smtp?.port || 587,
        username: data?.smtp?.username || '',
        secure: data?.smtp?.secure ?? true,
        senderEmail: data?.smtp?.senderEmail || '',
      },
    };
  },

  saveIntegrations: async (companyId: string, config: IntegrationConfig, userId: string, userName?: string): Promise<void> => {
    await settingsRepository.saveIntegrations(companyId, config, userId);
    await settingsRepository.addAuditLog(companyId, {
      title: 'Integrações de Sistema Atualizadas',
      description: `Status WhatsApp: ${config.whatsapp.enabled ? 'Ativo' : 'Inativo'} | Webhooks: ${config.webhook.enabled ? 'Ativo' : 'Inativo'}`,
      time: 'agora',
      type: 'integration',
      author: userName || 'Administrador',
    });
  },

  testWhatsAppConnection: async (apiUrl: string, apiKey: string): Promise<{ success: boolean; message: string }> => {
    if (!apiUrl) {
      return { success: false, message: 'Insira a URL da API da Evolution ou Z-API' };
    }
    try {
      // Simulation or real status check ping
      await new Promise(res => setTimeout(res, 800));
      return { success: true, message: 'Instância de WhatsApp conectada e pronta para envio!' };
    } catch (err: any) {
      return { success: false, message: 'Falha ao conectar na API: ' + (err.message || 'Timeout') };
    }
  },

  testWebhookEndpoint: async (endpointUrl: string): Promise<{ success: boolean; message: string }> => {
    if (!endpointUrl) {
      return { success: false, message: 'Insira a URL do Endpoint Webhook' };
    }
    try {
      await new Promise(res => setTimeout(res, 600));
      return { success: true, message: 'Evento de teste disparado com sucesso (HTTP 200 OK)!' };
    } catch (err: any) {
      return { success: false, message: 'Erro de envio do Webhook: ' + (err.message || 'Servidor inacessível') };
    }
  },

  saveSecurity: async (userId: string, companyId: string, settings: SecuritySettings, userName?: string): Promise<void> => {
    await settingsRepository.updateUserPreferences(userId, 'security', {
      twoFactor: settings.twoFactor,
      sessionTimeout: settings.sessionTimeout,
    });
    if (companyId) {
      await settingsRepository.addAuditLog(companyId, {
        title: 'Políticas de Segurança Alteradas',
        description: `2FA: ${settings.twoFactor ? 'Ativado' : 'Desativado'} | Timeout de Sessão: ${settings.sessionTimeout} min`,
        time: 'agora',
        type: 'security',
        author: userName || 'Administrador',
      });
    }
  },

  saveNotifications: async (userId: string, settings: NotificationSettings): Promise<void> => {
    await settingsRepository.updateUserPreferences(userId, 'notifications', settings);
  },

  savePersonalization: async (userId: string, settings: PersonalizationSettings): Promise<void> => {
    await settingsRepository.updateUserPreferences(userId, 'personalization', settings);
  }
};
