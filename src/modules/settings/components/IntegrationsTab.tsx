import React from 'react';
import { 
  MessageSquare, 
  Globe, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Send, 
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { IntegrationConfig } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { EvolutionConfigCard } from '../../whatsapp/components/EvolutionConfigCard';

interface IntegrationsTabProps {
  integrations: IntegrationConfig;
  onChange: (config: IntegrationConfig) => void;
  onSubmit: (config: IntegrationConfig) => void;
  onTestWhatsApp: () => void;
  onTestWebhook: () => void;
  isLoading: boolean;
}

export function IntegrationsTab({
  integrations,
  onChange,
  onSubmit,
  onTestWhatsApp,
  onTestWebhook,
  isLoading
}: IntegrationsTabProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(integrations);
  };

  return (
    <div className="space-y-6">
      {/* Evolution API Dedicated Component */}
      <EvolutionConfigCard />

      {/* Webhooks Integration */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Webhooks de Entrada e Saída</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Envie dados em tempo real para n8n, Make, Zapier ou sistemas contábeis externos.
                </p>
              </div>
            </div>
            <Badge variant={integrations.webhook.enabled ? "success" : "default"}>
              {integrations.webhook.enabled ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
              <div>
                <p className="text-sm font-semibold">Ativar Envio de Webhooks</p>
                <p className="text-xs text-muted-foreground">Dispara requisições HTTP POST para endpoints externos em eventos de leads.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={integrations.webhook.enabled}
                  onChange={(e) => onChange({
                    ...integrations,
                    webhook: { ...integrations.webhook, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">URL de Endpoint (Payload Delivery)</label>
                <Input
                  placeholder="https://n8n.suaempresa.com.br/webhook/lead-created"
                  value={integrations.webhook.endpointUrl || ''}
                  onChange={(e) => onChange({
                    ...integrations,
                    webhook: { ...integrations.webhook, endpointUrl: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chave Secreta de Assinatura (Secret Token)</label>
                <Input
                  type="password"
                  placeholder="whsec_123456789"
                  value={integrations.webhook.secretKey || ''}
                  onChange={(e) => onChange({
                    ...integrations,
                    webhook: { ...integrations.webhook, secretKey: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onTestWebhook}
                  className="w-full gap-2 text-xs"
                >
                  <Send size={14} className="text-primary" />
                  Disparar Webhook de Teste
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Google Workspace / Calendar Integration */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Google Workspace & Agenda</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sincronize reuniões de propostas contábeis com o Google Calendar.
                </p>
              </div>
            </div>
            <Badge variant={integrations.google.enabled ? "success" : "default"}>
              {integrations.google.enabled ? "Sincronizado" : "Desconectado"}
            </Badge>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
              <div>
                <p className="text-sm font-semibold">Sincronização com Google Calendar</p>
                <p className="text-xs text-muted-foreground">Cria reuniões e agendamentos diretamente na agenda dos consultores.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={integrations.google.enabled}
                  onChange={(e) => onChange({
                    ...integrations,
                    google: { ...integrations.google, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex justify-end">
          <Button type="submit" isLoading={isLoading} className="gap-2">
            <Save size={18} />
            Salvar Demais Integrações
          </Button>
        </div>
      </form>
    </div>
  );
}
