import React from 'react';
import { Sun, Moon, Monitor, Check, Save, Palette } from 'lucide-react';
import { PersonalizationSettings } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { cn } from '../../../shared/utils/cn';

interface PersonalizationFormProps {
  personalization: PersonalizationSettings;
  onChange: (personalization: PersonalizationSettings) => void;
  onSubmit: (personalization: PersonalizationSettings) => void;
  isLoading: boolean;
}

export function PersonalizationForm({ personalization, onChange, onSubmit, isLoading }: PersonalizationFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(personalization);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="font-bold text-base text-foreground">Tema Visual do Painel</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Escolha o modo de exibição ideal para o seu ambiente de trabalho.
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Modo Claro', desc: 'Ideal para ambientes claros', icon: Sun, colors: 'bg-slate-50 border-slate-200' },
            { id: 'dark', label: 'Modo Escuro', desc: 'Reduz a fadiga ocular', icon: Moon, colors: 'bg-slate-900 border-slate-800 text-slate-100' },
            { id: 'system', label: 'Sistema', desc: 'Sincroniza com o sistema operacional', icon: Monitor, colors: 'bg-gradient-to-r from-slate-50 to-slate-900 border-slate-300' },
          ].map((themeOpt) => (
            <div
              key={themeOpt.id}
              onClick={() => onChange({ ...personalization, theme: themeOpt.id as any })}
              className={cn(
                "cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all",
                personalization.theme === themeOpt.id
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div className={cn("w-full h-24 rounded-lg border flex items-center justify-center relative overflow-hidden", themeOpt.colors)}>
                <themeOpt.icon size={28} className={themeOpt.id === 'light' ? 'text-amber-500' : 'text-slate-400'} />
                {personalization.theme === themeOpt.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold">{themeOpt.label}</h4>
                <p className="text-[11px] text-muted-foreground">{themeOpt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="font-bold text-base text-foreground">Paleta de Cores da Marca</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Selecione a cor de destaque principal do iContábil CRM.</p>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'blue', label: 'Azul iContábil', bg: 'bg-sky-600' },
            { id: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-600' },
            { id: 'indigo', label: 'Roxo Índigo', bg: 'bg-indigo-600' },
            { id: 'amber', label: 'Amarelo Ouro', bg: 'bg-amber-600' },
            { id: 'coral', label: 'Vermelho Coral', bg: 'bg-rose-600' },
          ].map((colorOpt) => (
            <div
              key={colorOpt.id}
              onClick={() => onChange({ ...personalization, primaryColor: colorOpt.id as any })}
              className={cn(
                "cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all text-center",
                personalization.primaryColor === colorOpt.id
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner", colorOpt.bg)}>
                {personalization.primaryColor === colorOpt.id && <Check size={16} />}
              </div>
              <span className="text-xs font-semibold">{colorOpt.label}</span>
            </div>
          ))}
        </div>

        <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
          <Button type="submit" isLoading={isLoading} className="gap-2">
            <Save size={18} />
            Salvar Estilo Visual
          </Button>
        </div>
      </div>
    </form>
  );
}
