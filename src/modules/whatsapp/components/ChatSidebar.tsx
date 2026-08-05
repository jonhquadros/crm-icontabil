import React from 'react';
import { Search, Filter, MessageSquare, Tag as TagIcon, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Chat, ChatFilterTab } from '../types';
import { cn } from '../../../shared/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilter: 'all' | 'unread' | 'waiting' | 'tags';
  onFilterChange: (filter: 'all' | 'unread' | 'waiting' | 'tags') => void;
}

export function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: ChatSidebarProps) {
  const filterTabs: { id: 'all' | 'unread' | 'waiting' | 'tags'; label: string; icon?: any }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'Não Lidas' },
    { id: 'waiting', label: 'Aguardando' },
    { id: 'tags', label: 'Etiquetas' },
  ];

  return (
    <div className="w-[320px] flex flex-col border-r border-border bg-card h-full shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>
            <h2 className="text-sm font-bold text-foreground">WhatsApp Web</h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Buscar ou começar nova conversa"
            className="w-full bg-background border border-border rounded-lg py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1",
                activeFilter === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            <AlertCircle size={28} className="mx-auto text-muted-foreground/50" />
            <p className="text-xs font-medium">Nenhuma conversa encontrada.</p>
          </div>
        ) : (
          chats.map((chat) => {
            const isSelected = activeChat?.id === chat.id;
            const initials = chat.contactName.slice(0, 2).toUpperCase();

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={cn(
                  "p-3 flex gap-3 cursor-pointer hover:bg-muted/40 transition-colors relative group",
                  isSelected && "bg-primary/10 border-l-4 border-l-primary"
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                  {chat.avatarUrl ? (
                    <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-foreground truncate">{chat.contactName}</h3>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {chat.lastMessage
                        ? format(
                            typeof chat.lastMessage.timestamp?.toDate === 'function'
                              ? chat.lastMessage.timestamp.toDate()
                              : new Date(chat.lastMessage.timestamp || Date.now()),
                            'HH:mm',
                            { locale: ptBR }
                          )
                        : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate leading-tight">
                    {chat.lastMessage?.text || 'Sem mensagens recentes'}
                  </p>

                  {/* Tags & Badges */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1 flex-wrap overflow-hidden h-4">
                      {chat.tags && chat.tags.length > 0 && (
                        chat.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className={cn(
                              "text-[9px] px-1.5 py-0.2 rounded font-semibold",
                              tag.color || 'bg-blue-500 text-white'
                            )}
                          >
                            {tag.name}
                          </span>
                        ))
                      )}
                    </div>

                    {chat.unreadCount > 0 && (
                      <span className="bg-emerald-500 text-white text-[10px] font-extrabold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-xs shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
