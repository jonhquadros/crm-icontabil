import React from 'react';
import { Building2, Mail, Phone, MapPin, Globe, Save } from 'lucide-react';
import { CompanyProfile } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';

interface CompanyProfileFormProps {
  profile: CompanyProfile;
  onChange: (profile: CompanyProfile) => void;
  onSubmit: (profile: CompanyProfile) => void;
  isLoading: boolean;
}

export function CompanyProfileForm({ profile, onChange, onSubmit, isLoading }: CompanyProfileFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/30">
        <h3 className="font-bold text-base text-foreground">Perfil da Empresa</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Essas informações serão exibidas em relatórios, faturas e propostas comerciais.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed border-border group relative overflow-hidden shrink-0">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Logo da Empresa"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Building2 size={28} />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-bold">Logo do Escritório</h4>
            <Input
              placeholder="URL do logotipo (ex: https://logo.com/img.png)"
              value={profile.logoUrl || ''}
              onChange={(e) => onChange({ ...profile, logoUrl: e.target.value })}
              className="h-8 text-xs max-w-md"
            />
            <p className="text-[10px] text-muted-foreground">Insira um link para o logotipo em PNG ou JPG.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Razão Social / Nome</label>
            <Input
              value={profile.name || ''}
              onChange={(e) => onChange({ ...profile, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CNPJ</label>
            <Input
              placeholder="00.000.000/0000-00"
              value={profile.cnpj || ''}
              onChange={(e) => onChange({ ...profile, cnpj: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">E-mail Corporativo</label>
            <Input
              type="email"
              placeholder="contato@empresa.com"
              icon={<Mail size={18} />}
              value={profile.email || ''}
              onChange={(e) => onChange({ ...profile, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Telefone de Contato</label>
            <Input
              placeholder="(00) 00000-0000"
              icon={<Phone size={18} />}
              value={profile.phone || ''}
              onChange={(e) => onChange({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Endereço Completo</label>
            <Input
              placeholder="Rua, Número, Bairro, Cidade - UF"
              icon={<MapPin size={18} />}
              value={profile.address || ''}
              onChange={(e) => onChange({ ...profile, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Website</label>
            <Input
              placeholder="https://www.empresa.com"
              icon={<Globe size={18} />}
              value={profile.website || ''}
              onChange={(e) => onChange({ ...profile, website: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
        <Button type="submit" isLoading={isLoading} className="gap-2">
          <Save size={18} />
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
