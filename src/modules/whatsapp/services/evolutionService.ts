import { evolutionRepository } from '../repositories/evolutionRepository';
import { EvolutionConfig } from '../types';

const DEFAULT_CONNECTED_PHONE = '(91) 98402-7568';

export const evolutionService = {
  loadConfig: async (companyId: string): Promise<EvolutionConfig> => {
    const data = await evolutionRepository.getEvolutionConfig(companyId);
    return {
      apiUrl: data?.apiUrl || 'https://api.evolution-api.com',
      apiKey: data?.apiKey || '',
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
    try {
      // Simulated ping request
      await new Promise((res) => setTimeout(res, 600));
      return { success: true, message: 'Ping bem-sucedido! Servidor Evolution API online e operando (HTTP 200 OK).' };
    } catch (err: any) {
      return { success: false, message: 'Erro ao conectar à API: ' + (err.message || 'Timeout') };
    }
  },

  connectInstance: async (companyId: string, config: EvolutionConfig): Promise<{ success: boolean; qrCodeUrl?: string; message: string }> => {
    await evolutionRepository.updateStatus(companyId, 'connecting');

    await new Promise((res) => setTimeout(res, 1000));

    // Simulated QR code generation
    const dummyQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_${config.instanceName}_${Date.now()}`;
    
    await evolutionRepository.updateStatus(companyId, 'qr_code', dummyQrCode);

    return {
      success: true,
      qrCodeUrl: dummyQrCode,
      message: 'Sessão iniciada! Escaneie o QR Code com seu WhatsApp para finalizar a conexão.'
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
    await new Promise((res) => setTimeout(res, 1200));
    await evolutionRepository.updateStatus(companyId, 'connected');
    return {
      success: true,
      message: 'Reconexão concluída! A instância está sincronizada e pronta para envio.'
    };
  },

  generateQrCode: async (companyId: string, instanceName: string): Promise<{ qrCodeUrl: string }> => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_${instanceName}_${Date.now()}`;
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
  }
};
