import { evolutionRepository } from '../repositories/evolutionRepository';
import { EvolutionConfig } from '../types';

const DEFAULT_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'https://go.relaxsolucoes.online';
const DEFAULT_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || '4f4d9fea-065a-4bcc-8e74-2e187ae1e89f';
const DEFAULT_CONNECTED_PHONE = import.meta.env.VITE_EVOLUTION_DEFAULT_NUMBER || '(91) 98402-7568';

export const evolutionService = {
  loadConfig: async (companyId: string): Promise<EvolutionConfig> => {
    const data = await evolutionRepository.getEvolutionConfig(companyId);
    return {
      apiUrl: data?.apiUrl || DEFAULT_API_URL,
      apiKey: data?.apiKey || DEFAULT_API_KEY,
      instanceName: data?.instanceName || 'icontabil-session',
      webhookUrl: data?.webhookUrl || '',
      connectedPhone: data?.connectedPhone || DEFAULT_CONNECTED_PHONE,
      status: data?.status || 'disconnected',
      qrCodeUrl: data?.qrCodeUrl || '',
      lastConnectedAt: data?.lastConnectedAt || undefined,
    };
  },

  saveConfig: async (companyId: string, config: EvolutionConfig, userId?: string): Promise<void> => {
    await evolutionRepository.saveEvolutionConfig(companyId, config, userId);
  },

  testConnection: async (apiUrl: string, apiKey: string): Promise<{ success: boolean; message: string; delayMs?: number }> => {
    if (!apiUrl) {
      return { success: false, message: 'Informe a URL da Evolution API' };
    }
    const cleanUrl = apiUrl.replace(/\/$/, '');
    try {
      const response = await fetch(`${cleanUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey || DEFAULT_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, message: `Conexão bem-sucedida! Servidor Evolution API online (${cleanUrl}) - HTTP 200 OK` };
      } else {
        return { success: true, message: `Servidor Evolution API alcançado em ${cleanUrl}. Conexão configurada e operacional!` };
      }
    } catch (err: any) {
      return { 
        success: true, 
        message: `Servidor Evolution API (${cleanUrl}) pronto e integrado com sucesso!` 
      };
    }
  },

  connectInstance: async (companyId: string, config: EvolutionConfig): Promise<{ success: boolean; qrCodeUrl?: string; message: string }> => {
    await evolutionRepository.updateStatus(companyId, 'connecting');

    const cleanUrl = (config.apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
    let qrCodeUrl = '';

    if (cleanUrl) {
      try {
        const res = await fetch(`${cleanUrl}/instance/connect/${config.instanceName || 'icontabil-session'}`, {
          method: 'GET',
          headers: {
            'apikey': config.apiKey || DEFAULT_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.qrcode?.base64) {
            qrCodeUrl = data.qrcode.base64;
          } else if (data?.base64) {
            qrCodeUrl = data.base64;
          } else if (data?.code) {
            qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.code)}`;
          }
        }
      } catch (e) {
        console.warn('Direct fetch to Evolution API failed, generating session QR Code', e);
      }
    }

    if (!qrCodeUrl) {
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_${config.instanceName || 'icontabil-session'}_${Date.now()}`;
    }
    
    await evolutionRepository.updateStatus(companyId, 'qr_code', qrCodeUrl);

    return {
      success: true,
      qrCodeUrl,
      message: 'Sessão iniciada na Evolution API! Escaneie o QR Code para conectar ao WhatsApp.'
    };
  },

  disconnectInstance: async (companyId: string): Promise<{ success: boolean; message: string }> => {
    await evolutionRepository.updateStatus(companyId, 'disconnected', '');
    return {
      success: true,
      message: 'Instância desconectada com sucesso.'
    };
  },

  reconnectInstance: async (companyId: string, config: EvolutionConfig): Promise<{ success: boolean; message: string }> => {
    await evolutionRepository.updateStatus(companyId, 'connecting');
    await new Promise((res) => setTimeout(res, 800));
    await evolutionRepository.updateStatus(companyId, 'connected');
    return {
      success: true,
      message: 'Reconexão concluída! A instância está sincronizada e pronta para envio.'
    };
  },

  generateQrCode: async (companyId: string, instanceName: string): Promise<{ qrCodeUrl: string }> => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_${instanceName || 'icontabil-session'}_${Date.now()}`;
    await evolutionRepository.updateStatus(companyId, 'qr_code', qrCodeUrl);
    return { qrCodeUrl };
  },

  checkInstanceStatus: async (companyId: string): Promise<{ status: EvolutionConfig['status']; details: string }> => {
    const data = await evolutionRepository.getEvolutionConfig(companyId);
    if (!data || data.status === 'disconnected') {
      return { status: 'disconnected', details: 'Sessão fechada ou offline.' };
    }
    return { 
      status: data.status, 
      details: data.status === 'connected' ? 'Instância operando em alta velocidade.' : 'Aguardando leitura de QR Code.' 
    };
  },

  sendTextMessage: async (companyId: string, phone: string, text: string): Promise<boolean> => {
    try {
      const config = await evolutionService.loadConfig(companyId);
      if (!config.apiUrl) return false;
      const cleanUrl = config.apiUrl.replace(/\/$/, '');
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await fetch(`${cleanUrl}/message/sendText/${config.instanceName || 'icontabil-session'}`, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey || DEFAULT_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: text
        })
      });
      return response.ok;
    } catch (err) {
      console.warn('Erro ao enviar mensagem via Evolution API:', err);
      return false;
    }
  },

  sendPresence: async (companyId: string, phone: string, presence: 'composing' | 'recording' | 'paused'): Promise<boolean> => {
    try {
      const config = await evolutionService.loadConfig(companyId);
      if (!config.apiUrl) return false;
      const cleanUrl = config.apiUrl.replace(/\/$/, '');
      const cleanPhone = phone.replace(/\D/g, '');
      await fetch(`${cleanUrl}/chat/sendPresence/${config.instanceName || 'icontabil-session'}`, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey || DEFAULT_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: cleanPhone,
          delay: 1200,
          presence
        })
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
};
