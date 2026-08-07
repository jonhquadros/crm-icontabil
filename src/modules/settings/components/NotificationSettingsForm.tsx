import React from 'react';
import { Bell, Mail, MessageSquare, Sliders, Save, Volume2, VolumeX } from 'lucide-react';
import { NotificationSettings } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { notificationService } from '../../whatsapp/services/notificationService';

interface NotificationSettingsFormProps {
  notifications: NotificationSettings;
  onChange: (notifications: NotificationSettings) => void;
  onSubmit: (notifications: NotificationSettings) => void;
  isLoading: boolean;
}

export function NotificationSettingsForm({ notifications, onChange, onSubmit, isLoading }: NotificationSettingsFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('icontabil_sound_muted', notifications.soundNotifications === false ? 'true' : 'false');
    localStorage.setItem('icontabil_push_disabled', notifications.pushChat === false ? 'true' : 'false');
    onSubmit(notifications);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/30">
        <h3 className="font-bold text-base text-foreground">Preferências de Notificação</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Controle como e quando deseja receber alertas operacionais do CRM.
        </p>
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
                checked={notifications.emailOpportunities}
                onChange={(e) => onChange({ ...notifications, emailOpportunities: e.target.checked })}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Novas Oportunidades Atribuídas</p>
                <p className="text-xs text-muted-foreground">Receber alerta sempre que uma oportunidade for vinculada a você.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailTasks}
                onChange={(e) => onChange({ ...notifications, emailTasks: e.target.checked })}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Lembretes de Tarefas e Reuniões</p>
                <p className="text-xs text-muted-foreground">Alertas de prazos de entrega e horários de agendamentos com clientes.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailReports}
                onChange={(e) => onChange({ ...notifications, emailReports: e.target.checked })}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Relatórios Semanais de Desempenho</p>
                <p className="text-xs text-muted-foreground">Receber resumo semanal de conversão de leads e faturamento.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={14} /> WhatsApp
          </h4>

          <div className="space-y-4 pl-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.whatsappStatus}
                onChange={(e) => onChange({ ...notifications, whatsappStatus: e.target.checked })}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Atualização de Status de Leads</p>
                <p className="text-xs text-muted-foreground">Enviar notificação ao cliente quando o status de contratação for alterado.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.whatsappReminders}
                onChange={(e) => onChange({ ...notifications, whatsappReminders: e.target.checked })}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Alertas de Obrigações Fiscais Críticas</p>
                <p className="text-xs text-muted-foreground">Receber avisos instantâneos via WhatsApp sobre prazos regulatórios.</p>
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
                checked={notifications.pushChat}
                onChange={(e) => onChange({ ...notifications, pushChat: e.target.checked })}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Notificações Push de Chat</p>
                <p className="text-xs text-muted-foreground">Exibir popup na tela quando novas mensagens de leads forem recebidas.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.soundNotifications !== false}
                onChange={(e) => {
                  onChange({ ...notifications, soundNotifications: e.target.checked });
                  if (e.target.checked) {
                    notificationService.playSound();
                  }
                }}
                className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">Sons de Notificação</p>
                <p className="text-xs text-muted-foreground">Reproduzir tom sonoro sutil ao receber novas mensagens de clientes no chat.</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
        <Button type="submit" isLoading={isLoading} className="gap-2">
          <Save size={18} />
          Salvar Notificações
        </Button>
      </div>
    </form>
  );
}
