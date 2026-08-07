import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  PanelRight, 
  ClipboardList, 
  Calendar, 
  FileUp, 
  Tag, 
  Rocket, 
  BarChart2, 
  VolumeX, 
  Star, 
  Archive, 
  Ban,
  User,
  UserCheck,
  ChevronDown,
  UserPlus,
  ChevronLeft
} from 'lucide-react';
import { Chat } from '../types';
import { cn } from '../../../shared/utils/cn';
import { QuickTaskModal } from './ChatHeader/QuickTaskModal';
import { QuickEventModal } from './ChatHeader/QuickEventModal';
import { CampaignHistoryModal } from './ChatHeader/CampaignHistoryModal';

const TEAM_MEMBERS = [
  'Mariana Costa',
  'João Silva',
  'Pedro Alves',
  'Ana Souza',
  'Carlos Eduardo',
  'Felipe Santos',
  'Atendente Contábil'
];

interface ChatHeaderProps {
  chat: Chat;
  onToggleInfoPanel: () => void;
  isInfoOpen: boolean;
  onSearchClick?: () => void;
  isContactTyping?: boolean;
  onAssignUser?: (chat: Chat, user: string) => void;
  currentUser?: string;
  onBackClick?: () => void;
}

export function ChatHeader({ 
  chat, 
  onToggleInfoPanel, 
  isInfoOpen,
  onSearchClick,
  isContactTyping,
  onAssignUser,
  currentUser = 'Atendente Contábil',
  onBackClick
}: ChatHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCampaignHistoryOpen, setIsCampaignHistoryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);
  const initials = chat.contactName.slice(0, 2).toUpperCase();

  // Close dropdown menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (assignRef.current && !assignRef.current.contains(event.target as Node)) {
        setIsAssignOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-border px-4 flex items-center justify-between bg-card shrink-0 shadow-2xs z-20 relative">
      {/* Contact Info Left */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-1.5 hover:bg-muted rounded-full text-foreground md:hidden shrink-0 cursor-pointer"
            title="Voltar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-2xs">
          {chat.avatarUrl ? (
            <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground leading-snug truncate">{chat.contactName}</h3>
            {chat.companyName && (
              <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground font-semibold rounded-full truncate">
                {chat.companyName}
              </span>
            )}
            {isStarred && (
              <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>
          {isContactTyping ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 mt-0.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-ping" />
              <span>{chat.contactName.split(' ')[0]} está digitando...</span>
            </p>
          ) : (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span>Online · {chat.contactPhone}</span>
              {isMuted && (
                <span className="text-muted-foreground ml-1">(Silenciado)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Header Actions Right */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <button 
          title="Ligação de Voz"
          onClick={() => alert(`Iniciando ligação para ${chat.contactPhone}...`)}
          className="p-2 hover:bg-muted rounded-full transition-colors hover:text-foreground"
        >
          <Phone size={17} />
        </button>
        
        <button 
          title="Chamada de Vídeo"
          onClick={() => alert(`Iniciando chamada de vídeo com ${chat.contactName}...`)}
          className="p-2 hover:bg-muted rounded-full transition-colors hover:text-foreground"
        >
          <Video size={17} />
        </button>

        <button 
          title="Pesquisar na conversa"
          onClick={onSearchClick}
          className="p-2 hover:bg-muted rounded-full transition-colors hover:text-foreground"
        >
          <Search size={17} />
        </button>

        {/* 👤 Responsável Dropdown */}
        <div className="relative" ref={assignRef}>
          <button 
            title="Alterar Responsável pela Conversa"
            onClick={() => setIsAssignOpen(!isAssignOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground bg-muted/80 hover:bg-muted border border-border/80 rounded-lg transition-all shrink-0 shadow-2xs"
          >
            <User size={14} className="text-primary shrink-0" />
            <span className="truncate max-w-[100px] sm:max-w-[120px]">
              {chat.assignedUser || 'Fila'}
            </span>
            <ChevronDown size={12} className="text-muted-foreground shrink-0" />
          </button>

          {isAssignOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="px-3 pb-2 mb-1 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Responsável pela conversa</span>
                {chat.assignedUser && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    Ativo
                  </span>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5 px-1">
                {TEAM_MEMBERS.map((member) => {
                  const isCurrent = chat.assignedUser === member;
                  const memberInitials = member.slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={member}
                      onClick={() => {
                        onAssignUser?.(chat, member);
                        setIsAssignOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors",
                        isCurrent 
                          ? "bg-primary/10 text-primary font-bold" 
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {memberInitials}
                        </div>
                        <span className="truncate text-xs">{member}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-primary shrink-0">← atual</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-border px-1.5">
                <button
                  onClick={() => {
                    onAssignUser?.(chat, currentUser);
                    setIsAssignOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <UserCheck size={14} />
                  <span>👥 Atribuir a mim mesmo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 📊 Campanhas Button */}
        <button 
          title="Histórico de Campanhas do Contato"
          onClick={() => setIsCampaignHistoryOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors shrink-0 shadow-2xs border border-indigo-500/20"
        >
          <BarChart2 size={15} />
          <span className="hidden sm:inline">Campanhas</span>
        </button>

        {/* Dropdown Menu "Mais" (⋮) */}
        <div className="relative" ref={menuRef}>
          <button 
            title="Mais Opções"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-full transition-colors ${
              isMenuOpen ? 'bg-muted text-foreground' : 'hover:bg-muted hover:text-foreground'
            }`}
          >
            <MoreVertical size={17} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTaskModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
              >
                <ClipboardList size={15} className="text-blue-500 shrink-0" />
                <span>Criar Tarefa Rápida</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEventModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
              >
                <Calendar size={15} className="text-emerald-500 shrink-0" />
                <span>Agendar Compromisso</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleInfoPanel();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
              >
                <FileUp size={15} className="text-purple-500 shrink-0" />
                <span>Enviar Documento</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleInfoPanel();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
              >
                <Tag size={15} className="text-amber-500 shrink-0" />
                <span>Gerenciar Etiquetas</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleInfoPanel();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
              >
                <Rocket size={15} className="text-indigo-500 shrink-0" />
                <span>Adicionar ao Pipeline</span>
              </button>

              <div className="h-[1px] bg-border my-1" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsMuted(!isMuted);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted transition-colors text-left"
              >
                <VolumeX size={15} className="text-muted-foreground shrink-0" />
                <span>{isMuted ? 'Desativar Silêncio' : 'Silenciar Conversa'}</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsStarred(!isStarred);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted transition-colors text-left"
              >
                <Star size={15} className={isStarred ? "text-amber-500 fill-amber-500 shrink-0" : "text-muted-foreground shrink-0"} />
                <span>{isStarred ? 'Remover Favorito' : 'Marcar como Favorito'}</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  alert('Conversa arquivada.');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted transition-colors text-left"
              >
                <Archive size={15} className="text-muted-foreground shrink-0" />
                <span>Arquivar Conversa</span>
              </button>

              <div className="h-[1px] bg-border my-1" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (confirm(`Deseja realmente bloquear ${chat.contactName}?`)) {
                    alert('Contato bloqueado.');
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left font-medium"
              >
                <Ban size={15} className="shrink-0" />
                <span>Bloquear Contato</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-border mx-1" />

        {/* Toggle Panel Button */}
        <button 
          title={isInfoOpen ? "Fechar Painel Lateral" : "Abrir Painel Lateral"}
          onClick={onToggleInfoPanel}
          className={`p-2 rounded-full transition-colors ${
            isInfoOpen ? 'bg-primary/10 text-primary' : 'hover:bg-muted hover:text-foreground'
          }`}
        >
          <PanelRight size={18} />
        </button>
      </div>

      {/* Modals */}
      <QuickTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        chat={chat}
      />

      <QuickEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        chat={chat}
      />

      <CampaignHistoryModal
        isOpen={isCampaignHistoryOpen}
        onClose={() => setIsCampaignHistoryOpen(false)}
        chat={chat}
      />
    </header>
  );
}
