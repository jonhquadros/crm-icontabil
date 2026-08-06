import { useState, useEffect } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { automationService } from '../services/automationService';
import { AutomationTrigger } from '../types/automation.types';
import toast from 'react-hot-toast';

export function useAutomationTriggers() {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || '';
  const userId = userData?.name || user?.displayName || user?.email || 'Sistema';

  const [triggers, setTriggers] = useState<AutomationTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const unsubscribe = automationService.subscribeToTriggers(companyId, (data) => {
      setTriggers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  const createTrigger = async (
    data: Omit<AutomationTrigger, 'id' | 'companyId' | 'triggerCount' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ) => {
    try {
      await automationService.createTrigger(companyId, userId, data);
      toast.success('Gatilho de automação cadastrado!');
      return true;
    } catch (err) {
      console.error('Error creating trigger:', err);
      toast.error('Erro ao cadastrar gatilho de automação.');
      return false;
    }
  };

  const toggleTriggerActive = async (triggerId: string, currentStatus: boolean) => {
    try {
      await automationService.toggleTriggerActive(triggerId, userId, currentStatus);
      toast.success(`Gatilho ${!currentStatus ? 'ativado' : 'desativado'}!`);
    } catch (err) {
      console.error('Error toggling trigger:', err);
      toast.error('Erro ao alterar status do gatilho.');
    }
  };

  const deleteTrigger = async (triggerId: string) => {
    try {
      await automationService.deleteTrigger(triggerId);
      toast.success('Gatilho removido com sucesso!');
    } catch (err) {
      console.error('Error deleting trigger:', err);
      toast.error('Erro ao remover gatilho.');
    }
  };

  const updateTrigger = async (triggerId: string, data: Partial<AutomationTrigger>) => {
    try {
      await automationService.updateTrigger(triggerId, userId, data);
      toast.success('Gatilho de automação atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Error updating trigger:', err);
      toast.error('Erro ao atualizar gatilho.');
      return false;
    }
  };

  const seedDefaultTriggers = async () => {
    try {
      const seeded = await automationService.seedDefaultTriggersIfEmpty(companyId, userId);
      if (seeded) {
        toast.success('Gatilhos de automação padrão criados com sucesso!');
      } else {
        toast('Já existem gatilhos cadastrados.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error seeding triggers:', err);
      toast.error('Erro ao gerar gatilhos padrão.');
    }
  };

  return {
    triggers,
    loading,
    createTrigger,
    toggleTriggerActive,
    deleteTrigger,
    updateTrigger,
    seedDefaultTriggers
  };
}
