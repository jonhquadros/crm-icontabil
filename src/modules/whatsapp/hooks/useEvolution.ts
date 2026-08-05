import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { evolutionService } from '../services/evolutionService';
import { EvolutionConfig } from '../types';
import toast from 'react-hot-toast';

export function useEvolution() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [config, setConfig] = useState<EvolutionConfig>({
    apiUrl: 'https://api.evolution-api.com',
    apiKey: '',
    instanceName: 'icontabil-session',
    webhookUrl: '',
    connectedPhone: '(91) 98402-7568',
    status: 'disconnected',
    qrCodeUrl: '',
  });

  const companyId = userData?.companyId || '';

  const fetchConfig = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await evolutionService.loadConfig(companyId);
      setConfig(data);
    } catch (err) {
      console.error('Erro ao carregar Evolution Config:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveConfig = async (updatedConfig: EvolutionConfig) => {
    if (!companyId) {
      toast.error('Nenhuma empresa associada ao usuário.');
      return;
    }
    setLoading(true);
    try {
      await evolutionService.saveConfig(companyId, updatedConfig, userData?.id);
      setConfig(updatedConfig);
      toast.success('Configurações da Evolution API salvas!');
    } catch (err: any) {
      toast.error('Erro ao salvar configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const res = await evolutionService.testConnection(config.apiUrl, config.apiKey);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleConnect = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await evolutionService.connectInstance(companyId, config);
      if (res.success && res.qrCodeUrl) {
        setConfig(prev => ({ ...prev, status: 'qr_code', qrCodeUrl: res.qrCodeUrl }));
        setShowQrModal(true);
        toast.success(res.message);
      }
    } catch (err: any) {
      toast.error('Erro ao conectar instância: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await evolutionService.disconnectInstance(companyId);
      setConfig(prev => ({ ...prev, status: 'disconnected', qrCodeUrl: '' }));
      toast.success(res.message);
    } catch (err: any) {
      toast.error('Erro ao desconectar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await evolutionService.reconnectInstance(companyId, config);
      setConfig(prev => ({ ...prev, status: 'connected' }));
      toast.success(res.message);
    } catch (err: any) {
      toast.error('Erro ao reconectar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQrCode = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await evolutionService.generateQrCode(companyId, config.instanceName);
      setConfig(prev => ({ ...prev, qrCodeUrl: res.qrCodeUrl, status: 'qr_code' }));
      toast.success('Novo QR Code gerado!');
    } catch (err: any) {
      toast.error('Erro ao recarregar QR Code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!companyId) return;
    const res = await evolutionService.checkInstanceStatus(companyId);
    toast.success(`Status da Instância: ${res.status.toUpperCase()} - ${res.details}`);
    fetchConfig();
  };

  return {
    loading,
    config,
    setConfig,
    showQrModal,
    setShowQrModal,
    handleSaveConfig,
    handleTestConnection,
    handleConnect,
    handleDisconnect,
    handleReconnect,
    handleRefreshQrCode,
    handleCheckStatus,
    refetch: fetchConfig,
  };
}
