import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Tag as TagIcon, 
  AlertCircle, 
  CheckCircle, 
  Pin, 
  VolumeX, 
  Volume2, 
  Archive, 
  Ban, 
  User, 
  CheckSquare, 
  Paperclip, 
  UserPlus, 
  MoreVertical, 
  ChevronDown,
  Megaphone,
  UserCheck,
  Users
} from 'lucide-react';
import { Chat, Tag } from '../types';
import { cn } from '../../../shared/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AVAILABLE_TAGS: Tag[] = [
  { id: '1', name: 'Prospect', color: 'bg-blue-500 text-white' },
  { id: '2', name: 'Lucro Presumido', color: 'bg-purple-500 text-white' },
  { id: '3', name: 'Cliente Ativo', color: 'bg-emerald-500 text-white' },
  { id: '4', name: 'VIP', color: 'bg-amber-500 text-white' },
  { id: '5', name: 'Aguardando Doc', color: 'bg-orange-500 text-white' },
  { id: '6', name: 'Simples Nacional', color: 'bg-cyan-500 text-white' },
];

const TEAM_MEMBERS = [
  'Atendente Contábil',
  'Mariana Costa',
  'Carlos Eduardo',
  'Felipe Santos',
  'Ana Beatriz'
];

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  debouncedSearchTerm?: string;
  activeFilter: 'all' | 'unread' | 'waiting' | 'tags' | 'mine' | 'campaigns' | 'queue';
  onFilterChange: (filter: 'all' | 'unread' | 'waiting' | 'tags' | 'mine' | 'campaigns' | 'queue') => void;
  sortOption: 'recent' | 'unread' | 'waiting' | 'assigned' | 'stage';
  onSortChange: (sort: 'recent' | 'unread' | 'waiting' | 'assigned' | 'stage') => void;
  onResolveChat?: (chat: Chat) => void;
  onTogglePinChat?: (chat: Chat) => void;
  onToggleMuteChat?: (chat: Chat) => void;
  onAssignUser?: (chat: Chat, user: string) => void;
  onAssumeChat?: (chat: Chat) => void;
  onToggleTagForChat?: (chat: Chat, tag: Tag) => void;
  queueCount?: number;
  isLoading?: boolean;
}

export function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  searchTerm,
  onSearchChange,
  debouncedSearchTerm = '',
  activeFilter,
  onFilterChange,
  sortOption,
  onSortChange,
  onResolveChat,
  onTogglePinChat,
  onToggleMuteChat,
  onAssignUser,
  onAssumeChat,
  onToggleTagForChat,
  queueCount = 0,
  isLoading = false
}: ChatSidebarProps) {
  const [openTagMenuId, setOpenTagMenuId] = useState<string | null>(null);
  const [openAssignMenuId, setOpenAssignMenuId] = useState<string | null>(null);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const filterTabs: { id: 'all' | 'unread' | 'waiting' | 'queue' | 'tags' | 'mine' | 'campaigns'; label: string; count?: number }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'Não Lidas' },
    { id: 'waiting', label: 'Aguardando' },
    { id: 'queue', label: 'Fila', count: queueCount },
    { id: 'tags', label: 'Etiquetas' },
    { id: 'mine', label: 'Minhas' },
    { id: 'campaigns', label: 'Campanhas' },
  ];

  // Helper to highlight matching text in search (5.3)
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim() || !text) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/50 text-foreground font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="w-[320px] flex flex-col border-r border-border bg-card h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-foreground tracking-wide">WhatsApp Web</h2>
              <span className="text-[10px] text-muted-foreground font-medium">{chats.length} conversas</span>
            </div>
          </div>
        </div>

        {/* Search Bar (5.3) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome, empresa, fone, CNPJ, mensagem..."
            className="w-full bg-background border border-border/80 rounded-lg py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/70"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground font-bold bg-muted/60 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs (5.2) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0",
                activeFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.id === 'mine' && <UserCheck size={11} />}
              {tab.id === 'campaigns' && <Megaphone size={11} />}
              {tab.id === 'queue' && <Users size={11} />}
              <span>{tab.label}</span>
              {tab.id === 'queue' && (tab.count ?? 0) > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 text-[9px] rounded-full font-bold leading-none ml-0.5",
                  activeFilter === 'queue' 
                    ? "bg-primary-foreground text-primary" 
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Control (5.5) */}
      <div className="px-3 py-1.5 bg-muted/30 border-b border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider text-[9px]">Ordenar por:</span>
        <div className="relative inline-block">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-background border border-border/70 rounded-md px-2 py-0.5 text-[10px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-5 appearance-none"
          >
            <option value="recent">Mais recente (Padrão)</option>
            <option value="unread">Não lidas primeiro</option>
            <option value="waiting">Aguardando há mais tempo</option>
            <option value="assigned">Por responsável</option>
            <option value="stage">Por etapa do CRM</option>
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Message Search Header Banner (5.3) */}
      {debouncedSearchTerm.trim() !== '' && (
        <div className="px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border-b border-amber-500/20 flex items-center justify-between">
          <span>Resultados em Mensagens ({chats.length})</span>
          <span className="text-[9px] font-medium text-muted-foreground">Filtro em tempo real</span>
        </div>
      )}

      {/* Conversations List (5.1 & 5.4) */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto divide-y divide-border/30 relative"
      >
        {isLoading ? (
          /* Shimmer Loading Skeletons */
          <div className="p-3 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="flex gap-3 items-center py-2 animate-pulse border-b border-border/20 last:border-0">
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2 py-1 min-w-0">
                  <div className="h-3.5 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          /* Empty State with CTA */
          <div className="p-8 text-center text-muted-foreground space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground/60 mx-auto">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Nenhuma conversa encontrada</p>
              <p className="text-[10px] text-muted-foreground max-w-[200px] leading-normal mx-auto">
                Não existem conversas ativas para o filtro selecionado.
              </p>
            </div>
            <button 
              onClick={() => onFilterChange('all')} 
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              Ver todas as conversas
            </button>
          </div>
        ) : (
          (() => {
            const isVirtual = chats.length > 50;
            const itemHeight = 90; // Height per element
            const containerHeight = 600;
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const startIndex = isVirtual ? Math.max(0, Math.floor(scrollTop / itemHeight) - 2) : 0;
            const endIndex = isVirtual ? Math.min(chats.length, startIndex + visibleCount + 4) : chats.length;

            const visibleChats = chats.slice(startIndex, endIndex);
            const totalHeight = chats.length * itemHeight;
            const offsetY = startIndex * itemHeight;

            const renderContent = () => (
              visibleChats.map((chat) => {
                const isSelected = activeChat?.id === chat.id;
                const initials = chat.contactName.slice(0, 2).toUpperCase();
                const hasUnread = chat.unreadCount > 0;

                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat)}
                    style={isVirtual ? { height: `${itemHeight}px` } : undefined}
                    className={cn(
                      "p-3 flex gap-2.5 cursor-pointer hover:bg-muted/50 transition-all relative group border-l-2 border-transparent",
                      isSelected && "bg-primary/10 border-l-primary font-medium",
                      hasUnread && !isSelected && "bg-emerald-500/5 dark:bg-emerald-500/10 border-l-emerald-500"
                    )}
                  >
                    {/* Avatar & Pin Indicator (5.1) */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center overflow-hidden border border-border/60">
                        {chat.avatarUrl ? (
                          <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      {chat.isPinned && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs border border-card" title="Conversa fixada">
                          <Pin size={9} className="rotate-45" />
                        </div>
                      )}
                    </div>

                    {/* Info Container */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Line 1: Name + Company & Time + Unread Badge (5.1) */}
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-bold text-foreground truncate leading-tight flex items-center gap-1">
                          <span>{highlightText(chat.contactName, debouncedSearchTerm)}</span>
                          {chat.companyName && (
                            <span className="text-[10px] font-normal text-muted-foreground truncate">
                              ({highlightText(chat.companyName, debouncedSearchTerm)})
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-medium">
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
                          {/* Red Unread Badge [🔴2] */}
                          {hasUnread && (
                            <span className="bg-red-500 text-white text-[10px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Line 2: Last Message Preview (5.1 & 5.3) */}
                      <p className={cn(
                        "text-[11px] truncate leading-tight",
                        hasUnread ? "text-foreground font-bold" : "text-muted-foreground"
                      )}>
                        {chat.lastMessage?.text 
                          ? highlightText(chat.lastMessage.text, debouncedSearchTerm)
                          : 'Sem mensagens recentes'
                        }
                      </p>

                      {/* Line 3: Tags (5.1) */}
                      {chat.tags && chat.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap overflow-hidden pt-0.5">
                          {chat.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={cn(
                                "text-[9px] px-1.5 py-0.2 rounded font-bold tracking-tight shadow-2xs",
                                tag.color || 'bg-blue-500 text-white'
                              )}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Line 4: Quick Indicators [👤 Responsible] [✅ Tasks] [📎 Docs] (5.1) */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[9px] text-muted-foreground">
                        {chat.assignedUser && chat.assignedUser !== 'Fila' && chat.assignedUser !== 'Sem Responsável' ? (
                          <span className="inline-flex items-center gap-0.5 bg-muted/80 text-foreground px-1.5 py-0.2 rounded border border-border/50 font-medium">
                            <User size={9} className="text-primary" />
                            {chat.assignedUser.split(' ')[0]}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssumeChat?.(chat);
                            }}
                            className="inline-flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold transition-all shadow-2xs cursor-pointer"
                            title="Assumir este atendimento da fila"
                          >
                            <UserPlus size={10} />
                            <span>Assumir Atendimento</span>
                          </button>
                        )}

                        {(chat.openTasksCount ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">
                            <CheckSquare size={9} />
                            {chat.openTasksCount}
                          </span>
                        )}

                        {(chat.pendingDocsCount ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/20">
                            <Paperclip size={9} />
                            {chat.pendingDocsCount}
                          </span>
                        )}

                        {chat.isMuted && (
                          <span title="Silenciado" className="text-muted-foreground/60">
                            <VolumeX size={10} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5.4 — Hover Quick Actions Toolbar */}
                    <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-0.5 bg-card/95 dark:bg-card/95 backdrop-blur-xs p-1 rounded-lg border border-border/80 shadow-md z-20">
                      {/* ✅ Resolver */}
                      <button
                        title="Resolver / Finalizar conversa"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolveChat?.(chat);
                        }}
                        className="p-1 rounded hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <CheckCircle size={13} />
                      </button>

                      {/* 🏷️ Etiquetar */}
                      <div className="relative">
                        <button
                          title="Gerenciar Etiquetas"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAssignMenuId(null);
                            setOpenMoreMenuId(null);
                            setOpenTagMenuId(openTagMenuId === chat.id ? null : chat.id);
                          }}
                          className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <TagIcon size={13} />
                        </button>

                        {/* Tag Dropdown Menu */}
                        {openTagMenuId === chat.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl p-2 z-30 space-y-1 text-xs"
                          >
                            <p className="text-[10px] font-bold text-muted-foreground px-1 pb-1 border-b border-border">Etiquetas disponíveis</p>
                            {AVAILABLE_TAGS.map((tag) => {
                              const isApplied = (chat.tags || []).some(t => t.id === tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => onToggleTagForChat?.(chat, tag)}
                                  className={cn(
                                    "w-full text-left px-2 py-1 rounded text-[11px] font-semibold flex items-center justify-between transition-colors",
                                    isApplied ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                  )}
                                >
                                  <span className={cn("px-1.5 py-0.2 rounded text-[9px]", tag.color)}>{tag.name}</span>
                                  {isApplied && <span>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 👤 Atribuir */}
                      <div className="relative">
                        <button
                          title="Atribuir Responsável"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTagMenuId(null);
                            setOpenMoreMenuId(null);
                            setOpenAssignMenuId(openAssignMenuId === chat.id ? null : chat.id);
                          }}
                          className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <UserPlus size={13} />
                        </button>

                        {/* Assign User Dropdown Menu */}
                        {openAssignMenuId === chat.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl p-1.5 z-30 space-y-1 text-xs"
                          >
                            <p className="text-[10px] font-bold text-muted-foreground px-1 pb-1 border-b border-border">Atribuir a</p>
                            {TEAM_MEMBERS.map((member) => (
                              <button
                                key={member}
                                onClick={() => {
                                  onAssignUser?.(chat, member);
                                  setOpenAssignMenuId(null);
                                }}
                                className={cn(
                                  "w-full text-left px-2 py-1 rounded text-[11px] font-medium hover:bg-primary/10 hover:text-primary transition-colors truncate flex items-center justify-between",
                                  chat.assignedUser === member && "text-primary font-bold"
                                )}
                              >
                                <span>{member}</span>
                                {chat.assignedUser === member && <span>✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ⋮ Mais Options */}
                      <div className="relative">
                        <button
                          title="Mais Ações"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTagMenuId(null);
                            setOpenAssignMenuId(null);
                            setOpenMoreMenuId(openMoreMenuId === chat.id ? null : chat.id);
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreVertical size={13} />
                        </button>

                        {/* More Options Dropdown Menu */}
                        {openMoreMenuId === chat.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl p-1 z-30 space-y-0.5 text-xs"
                          >
                            <button
                              onClick={() => {
                                onTogglePinChat?.(chat);
                                setOpenMoreMenuId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium text-[11px]"
                            >
                              <Pin size={12} className={cn("rotate-45", chat.isPinned && "text-amber-500 fill-amber-500")} />
                              <span>{chat.isPinned ? 'Desafixar Conversa' : 'Fixar no Topo'}</span>
                            </button>

                            <button
                              onClick={() => {
                                onToggleMuteChat?.(chat);
                                setOpenMoreMenuId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium text-[11px]"
                            >
                              {chat.isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                              <span>{chat.isMuted ? 'Ativar Notificações' : 'Silenciar Conversa'}</span>
                            </button>

                            <button
                              onClick={() => {
                                onResolveChat?.(chat);
                                setOpenMoreMenuId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 text-foreground font-medium text-[11px]"
                            >
                              <Archive size={12} />
                              <span>Arquivar Conversa</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMoreMenuId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2 font-medium text-[11px]"
                            >
                              <Ban size={12} />
                              <span>Bloquear Contato</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            );

            if (isVirtual) {
              return (
                <div style={{ height: `${totalHeight}px`, width: '100%' }} className="relative">
                  <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', left: 0, right: 0, top: 0 }} className="divide-y divide-border/30">
                    {renderContent()}
                  </div>
                </div>
              );
            }

            return <div className="divide-y divide-border/30">{renderContent()}</div>;
          })()
        )}
      </div>
    </div>
  );
}
