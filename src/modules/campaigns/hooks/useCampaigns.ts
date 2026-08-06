import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { CampaignRepository } from '../repository/CampaignRepository';
import { Campaign, CampaignContact, CampaignTemplate, OptOut } from '../types/campaign.types';
import { settingsService } from '../../settings/services/settingsService';
import toast from 'react-hot-toast';

export function useCampaigns() {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || '';
  const userId = userData?.id || user?.uid || '';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [optOutList, setOptOutList] = useState<OptOut[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);

  // Load WhatsApp instances (main instance from settings + any other instances)
  const loadInstances = useCallback(async () => {
    if (!companyId) return;
    try {
      const settings = await settingsService.loadIntegrations(companyId);
      const instancesList = [];
      
      if (settings?.whatsapp) {
        // Fallback or actual status
        instancesList.push({
          id: 'primary',
          instanceName: settings.whatsapp.instanceName || 'Instância Principal',
          phone: settings.whatsapp.instanceName === 'icontabil-session' ? '5511999998888' : 'Conectado',
          status: settings.whatsapp.status || 'connected',
          warmth: {
            level: 'warm',
            dailyLimit: 60,
            sentToday: 0
          }
        });
      }
      setWhatsappInstances(instancesList);
    } catch (err) {
      console.error('Error loading instances:', err);
    }
  }, [companyId]);

  // Subscribe to campaigns and opt-outs, and load templates
  useEffect(() => {
    if (!companyId) return;

    setLoading(true);
    
    // Subscribe to campaigns list
    const unsubscribeCampaigns = CampaignRepository.subscribeToCampaigns(companyId, (data) => {
      setCampaigns(data);
      setLoading(false);
    });

    // Subscribe to opt-out list
    const unsubscribeOptOut = CampaignRepository.subscribeToOptOutList(companyId, (data) => {
      setOptOutList(data);
    });

    // Fetch templates
    CampaignRepository.getTemplates(companyId)
      .then(setTemplates)
      .catch(err => console.error('Error fetching templates:', err));

    loadInstances();

    return () => {
      unsubscribeCampaigns();
      unsubscribeOptOut();
    };
  }, [companyId, loadInstances]);

  // Handle Campaign creation
  const handleCreateCampaign = async (data: Omit<Campaign, 'id' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'metrics'>) => {
    if (!companyId || !userId) {
      toast.error('Operação não autorizada. Verifique sua sessão.');
      return null;
    }
    try {
      const id = await CampaignRepository.createCampaign(companyId, userId, data);
      toast.success('Campanha criada com sucesso!');
      return id;
    } catch (err: any) {
      toast.error('Erro ao criar campanha: ' + err.message);
      return null;
    }
  };

  // Import contacts in batch
  const handleImportContacts = async (
    campaignId: string, 
    contacts: Omit<CampaignContact, 'id' | 'campaignId' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'sentAt' | 'failedAt' | 'failReason' | 'retries' | 'messageId' | 'optedOutAt'>[]
  ) => {
    if (!companyId || !userId) return false;
    try {
      const loadToast = toast.loading(`Importando ${contacts.length} contatos...`);
      await CampaignRepository.addContactsBatch(campaignId, companyId, userId, contacts);
      toast.dismiss(loadToast);
      toast.success('Contatos importados com sucesso!');
      return true;
    } catch (err: any) {
      toast.error('Erro ao importar contatos: ' + err.message);
      return false;
    }
  };

  // Schedule / Start Campaign
  const handleScheduleCampaign = async (campaignId: string) => {
    if (!companyId) return false;
    try {
      const loadToast = toast.loading('Agendando disparos da campanha...');
      
      const response = await fetch('/api/campaigns/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          companyId,
          userId,
        }),
      });

      toast.dismiss(loadToast);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro desconhecido');
      }

      const result = await response.json();
      toast.success(`Campanha iniciada com sucesso! ${result.jobsCreated} mensagens agendadas.`);
      return true;
    } catch (err: any) {
      toast.error('Falha ao iniciar campanha: ' + err.message);
      return false;
    }
  };

  // Pause campaign
  const handlePauseCampaign = async (campaignId: string) => {
    if (!userId) return;
    try {
      await CampaignRepository.updateCampaign(campaignId, userId, {
        status: 'paused',
        pausedAt: new Date(),
        pauseReason: 'Pausada pelo usuário'
      });
      toast.success('Campanha pausada!');
    } catch (err: any) {
      toast.error('Erro ao pausar campanha: ' + err.message);
    }
  };

  // Resume campaign (simply change status back to running, queue keeps running)
  const handleResumeCampaign = async (campaignId: string) => {
    if (!userId) return;
    try {
      await CampaignRepository.updateCampaign(campaignId, userId, {
        status: 'running',
        pausedAt: null,
        pauseReason: null
      });
      toast.success('Campanha retomada!');
    } catch (err: any) {
      toast.error('Erro ao retomar campanha: ' + err.message);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await CampaignRepository.deleteCampaign(campaignId);
      toast.success('Campanha excluída.');
    } catch (err: any) {
      toast.error('Erro ao excluir campanha: ' + err.message);
    }
  };

  // --- Templates CRUD ---
  const handleAddTemplate = async (data: Omit<CampaignTemplate, 'id' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'usageCount'>) => {
    if (!companyId || !userId) return null;
    try {
      const id = await CampaignRepository.addTemplate(companyId, userId, data);
      toast.success('Template adicionado com sucesso!');
      
      // Refresh local list
      const updated = await CampaignRepository.getTemplates(companyId);
      setTemplates(updated);
      
      return id;
    } catch (err: any) {
      toast.error('Erro ao adicionar template: ' + err.message);
      return null;
    }
  };

  const handleUpdateTemplate = async (templateId: string, data: Partial<CampaignTemplate>) => {
    if (!userId) return;
    try {
      await CampaignRepository.updateTemplate(templateId, userId, data);
      toast.success('Template atualizado!');
      
      if (companyId) {
        const updated = await CampaignRepository.getTemplates(companyId);
        setTemplates(updated);
      }
    } catch (err: any) {
      toast.error('Erro ao atualizar template: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await CampaignRepository.deleteTemplate(templateId);
      toast.success('Template excluído.');
      
      if (companyId) {
        const updated = await CampaignRepository.getTemplates(companyId);
        setTemplates(updated);
      }
    } catch (err: any) {
      toast.error('Erro ao excluir template: ' + err.message);
    }
  };

  // --- Opt-Out CRUD ---
  const handleAddOptOut = async (phone: string, reason?: string, name?: string) => {
    if (!companyId || !userId) return null;
    try {
      const id = await CampaignRepository.addOptOut(companyId, userId, phone, 'manual', reason, name);
      toast.success('Número adicionado à lista de não-envio!');
      return id;
    } catch (err: any) {
      toast.error('Erro ao adicionar número: ' + err.message);
      return null;
    }
  };

  const handleRemoveOptOut = async (optOutId: string) => {
    if (!userId) return;
    try {
      await CampaignRepository.removeOptOut(optOutId, userId);
      toast.success('Número removido da lista de não-envio.');
    } catch (err: any) {
      toast.error('Erro ao remover número: ' + err.message);
    }
  };

  return {
    campaigns,
    optOutList,
    templates,
    loading,
    whatsappInstances,
    createCampaign: handleCreateCampaign,
    importContacts: handleImportContacts,
    scheduleCampaign: handleScheduleCampaign,
    pauseCampaign: handlePauseCampaign,
    resumeCampaign: handleResumeCampaign,
    deleteCampaign: handleDeleteCampaign,
    addTemplate: handleAddTemplate,
    updateTemplate: handleUpdateTemplate,
    deleteTemplate: handleDeleteTemplate,
    addOptOut: handleAddOptOut,
    removeOptOut: handleRemoveOptOut,
    reloadInstances: loadInstances,
  };
}
