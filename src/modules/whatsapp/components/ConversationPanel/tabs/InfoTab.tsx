import React, { useState } from 'react';
import { 
  Building, 
  Mail, 
  Tag as TagIcon, 
  FileText, 
  ExternalLink, 
  Archive, 
  Plus,
  Check
} from 'lucide-react';
import { Chat, Tag } from '../../../types';
import { Button } from '../../../../../shared/components/ui/Button';

interface InfoTabProps {
  chat: Chat;
  onToggleTag: (tag: Tag) => void;
  onOpenCRM?: () => void;
}

const ALL_AVAILABLE_TAGS: Tag[] = [
  { id: '1', name: 'Prospect', color: 'bg-blue-500 text-white' },
  { id: '2', name: 'Lucro Presumido', color: 'bg-purple-500 text-white' },
  { id: '3', name: 'Cliente Ativo', color: 'bg-emerald-500 text-white' },
  { id: '4', name: 'VIP', color: 'bg-amber-500 text-white' },
  { id: '5', name: 'Aguardando Doc', color: 'bg-orange-500 text-white' },
  { id: '6', name: 'Simples Nacional', color: 'bg-teal-500 text-white' },
];

export function InfoTab({ chat, onToggleTag, onOpenCRM }: InfoTabProps) {
  const [notes, setNotes] = useState(chat.notes || '');
  const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const currentTagIds = (chat.tags || []).map(t => t.id);

  const handleAddCustomTag = () => {
    if (!newTagName.trim()) return;
    const customTag: Tag = {
      id: `tag_${Date.now()}`,
      name: newTagName.trim(),
      color: 'bg-indigo-500 text-white'
    };
    onToggleTag(customTag);
    setNewTagName('');
    setIsAddingCustomTag(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Quick Details */}
      <div className="space-y-2.5 bg-muted/30 p-3 rounded-xl border border-border/50 text-xs">
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
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <TagIcon size={12} /> Etiquetas e Categorização
          </label>
          <button
            onClick={() => setIsAddingCustomTag(!isAddingCustomTag)}
            className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            <Plus size={11} /> Nova
          </button>
        </div>

        {isAddingCustomTag && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nome da etiqueta..."
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
            />
            <Button size="sm" onClick={handleAddCustomTag} className="h-7 text-xs px-2">
              <Check size={12} />
            </Button>
          </div>
        )}

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
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
          placeholder="Adicione notas sobre as necessidades contábeis deste cliente..."
        />
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-border space-y-2">
        <Button 
          variant="outline" 
          onClick={onOpenCRM}
          className="w-full justify-start gap-2 text-xs h-9 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
        >
          <ExternalLink size={14} /> Abrir / Ver no CRM
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-xs text-muted-foreground h-9 hover:bg-muted"
        >
          <Archive size={14} /> Arquivar Conversa
        </Button>
      </div>
    </div>
  );
}
