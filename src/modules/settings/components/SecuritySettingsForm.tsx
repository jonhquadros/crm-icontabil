import React from 'react';
import { Shield, Save, Lock, Clock } from 'lucide-react';
import { SecuritySettings } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';

interface SecuritySettingsFormProps {
  security: SecuritySettings;
  onChange: (security: SecuritySettings) => void;
  onSubmit: (security: SecuritySettings) => void;
  isLoading: boolean;
}

export function SecuritySettingsForm({ security, onChange, onSubmit, isLoading }: SecuritySettingsFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(security);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="font-bold text-base text-foreground">Alterar Senha de Acesso</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Certifique-se de usar uma senha forte e única para proteção da conta do escritório.
          </p>
        </div>

        <div className="p-6 space-y-4 max-w-xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Senha Atual</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={security.currentPassword || ''}
              onChange={(e) => onChange({ ...security, currentPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nova Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={security.newPassword || ''}
              onChange={(e) => onChange({ ...security, newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Confirmar Nova Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={security.confirmPassword || ''}
              onChange={(e) => onChange({ ...security, confirmPassword: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="font-bold text-base text-foreground">Políticas de Segurança e Sessão</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Defina as preferências de acesso e tempo de inatividade.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Autenticação de Dois Fatores (2FA)</h4>
              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                Exige um código de verificação no dispositivo além da senha padrão.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={security.twoFactor}
                onChange={(e) => onChange({ ...security, twoFactor: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Tempo Limite de Inatividade</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tempo sem interação antes que a sessão expire automaticamente.
              </p>
            </div>
            <Select
              value={security.sessionTimeout}
              onChange={(e) => onChange({ ...security, sessionTimeout: e.target.value })}
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
          <Button type="submit" isLoading={isLoading} className="gap-2">
            <Save size={18} />
            Salvar Segurança
          </Button>
        </div>
      </div>
    </form>
  );
}
