import React from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  Building, 
  Tag as TagIcon, 
  FileText, 
  Plus, 
  Archive, 
  Trash2,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { Chat, Tag } from '../types';
import { Button } from '../../../shared/components/ui/Button';

interface ContactInfoPanelProps {
  chat: Chat;
  onClose: () => void;
  onToggleTag: (tag: Tag) => void;
}

const ALL_AVAILABLE_TAGS: Tag[] = [
  { id: '1', name: 'Prospect', color: 'bg-blue-500 text-white' },
  { id: '2', name: 'Lucro Presumido', color: 'bg-purple-500 text-white' },
  { id: '3', name: 'Cliente Ativo', color: 'bg-emerald-500 text-white' },
  { id: '4', name: 'VIP', color: 'bg-amber-500 text-white' },
  { id: '5', name: 'Aguardando Doc', color: 'bg-orange-500 text-white' },
  { id: '6', name: 'Simples Nacional', color: 'bg-teal-500 text-white' },
];

export function ContactInfoPanel({ chat, onClose, onToggleTag }: ContactInfoPanelProps) {
  const initials = chat.contactName.slice(0, 2).toUpperCase();
  const currentTagIds = (chat.tags || []).map(t => t.id);

  return (
    <div className="w-80 border-l border-border bg-card h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <h3 className="text-sm font-bold text-foreground">Dados do Contato</h3>
        <button 
          onClick={onClose} 
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center border-2 border-primary/20 overflow-hidden shadow-sm">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground">{chat.contactName}</h4>
            <p className="text-xs text-muted-foreground">{chat.contactPhone}</p>
          </div>
        </div>

        {/* Quick Details */}
        <div className="space-y-3 bg-muted/30 p-3 rounded-xl border border-border/50 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <Building size={14} className="text-muted-foreground shrink-0" />
            <span className="font-semibold">{chat.companyName || 'Empresa não vinculada'}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Mail size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate">{chat.email || 'email@cliente.com.br'}</span>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <TagIcon size={12} /> Etiquetas e Categorização
          </label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ALL_AVAILABLE_TAGS.map((tag) => {
              const isSelected = currentTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => onToggleTag(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                    isSelected 
                      ? `${tag.color} ring-2 ring-primary/30 font-bold shadow-xs` 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isSelected ? `✓ ${tag.name}` : `+ ${tag.name}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <FileText size={12} /> Observações Internas
          </label>
          <textarea
            rows={3}
            className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            placeholder="Adicione notas sobre as necessidades contábeis deste cliente..."
            defaultValue={chat.notes || ''}
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9">
            <ExternalLink size={14} /> Abrir Oportunidade no CRM
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-xs text-muted-foreground h-9">
            <Archive size={14} /> Arquivar Conversa
          </Button>
        </div>
      </div>
    </div>
  );
}
