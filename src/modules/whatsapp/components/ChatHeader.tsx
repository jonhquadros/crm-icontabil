import React from 'react';
import { Phone, Video, Search, MoreVertical, PanelRight, Shield, User } from 'lucide-react';
import { Chat } from '../types';
import { Button } from '../../../shared/components/ui/Button';

interface ChatHeaderProps {
  chat: Chat;
  onToggleInfoPanel: () => void;
  isInfoOpen: boolean;
}

export function ChatHeader({ chat, onToggleInfoPanel, isInfoOpen }: ChatHeaderProps) {
  const initials = chat.contactName.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border px-4 flex items-center justify-between bg-card shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-border">
          {chat.avatarUrl ? (
            <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground leading-snug">{chat.contactName}</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Online - {chat.contactPhone}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-muted-foreground">
        <button 
          title="Ligação de Voz"
          className="p-2 hover:bg-muted rounded-full transition-colors hover:text-foreground"
        >
          <Phone size={18} />
        </button>
        <button 
          title="Chamada de Vídeo"
          className="p-2 hover:bg-muted rounded-full transition-colors hover:text-foreground"
        >
          <Video size={18} />
        </button>
        <div className="h-4 w-[1px] bg-border mx-1" />
        <button 
          title="Pesquisar na conversa"
          className="p-2 hover:bg-muted rounded-full transition-colors hover:text-foreground"
        >
          <Search size={18} />
        </button>
        <button 
          title={isInfoOpen ? "Fechar Informações do Contato" : "Abrir Informações do Contato"}
          onClick={onToggleInfoPanel}
          className={`p-2 rounded-full transition-colors ${
            isInfoOpen ? 'bg-primary/10 text-primary' : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <PanelRight size={18} />
        </button>
      </div>
    </header>
  );
}
