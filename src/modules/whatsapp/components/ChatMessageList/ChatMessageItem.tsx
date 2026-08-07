import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  CheckCheck, 
  FileText, 
  Download, 
  MapPin, 
  User as UserIcon, 
  Play, 
  Smile, 
  Reply, 
  MoreVertical, 
  Star, 
  Pin, 
  ClipboardList, 
  Calendar, 
  Save, 
  Copy, 
  Trash2,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Message, MessageReaction } from '../../types';
import { cn } from '../../../../shared/utils/cn';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function LazyImage({ src, alt, className, onClick }: { src: string; alt: string; className: string; onClick?: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden bg-muted/20 min-h-[100px]", className)}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          onClick={onClick}
          referrerPolicy="no-referrer"
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/60 font-semibold">Carregando...</span>
        </div>
      )}
    </div>
  );
}

function LazyAudioPlayer({ fileUrl, duration = 8 }: { fileUrl?: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatAudioTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayToggle = () => {
    if (!fileUrl) return;

    if (!isLoaded) {
      const audio = new Audio(fileUrl);
      audio.preload = 'auto';
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      audioRef.current = audio;
      setIsLoaded(true);
      audio.play();
      setIsPlaying(true);
      toast.success('Iniciando reprodução do áudio...');
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const progress = isPlaying 
    ? (currentTime / (audioRef.current?.duration || duration)) * 100 
    : 0;

  const displayTime = isPlaying 
    ? formatAudioTime(currentTime) 
    : formatAudioTime(duration);

  return (
    <div className="flex items-center gap-3 p-1 min-w-[210px]">
      <button 
        onClick={handlePlayToggle}
        className="w-9 h-9 rounded-full bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center shrink-0 transition-all shadow-2xs"
      >
        {isPlaying ? (
          <div className="flex gap-0.5 items-center justify-center">
            <span className="w-1 h-3.5 bg-primary rounded-full animate-pulse" />
            <span className="w-1 h-4.5 bg-primary rounded-full animate-pulse [animation-delay:0.15s]" />
            <span className="w-1 h-3.5 bg-primary rounded-full animate-pulse [animation-delay:0.3s]" />
          </div>
        ) : (
          <Play size={16} className="ml-0.5" />
        )}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1.5 bg-muted/60 rounded-full w-full relative overflow-hidden">
          <div 
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
            className="h-full bg-primary rounded-full transition-all duration-100" 
          />
        </div>
        <span className="text-[9px] text-muted-foreground block font-mono">
          {displayTime} {!isLoaded && '• clique para baixar'}
        </span>
      </div>
    </div>
  );
}

const getPdfThumbnail = (url?: string) => {
  if (!url) return null;
  if (url.includes('res.cloudinary.com')) {
    return url.replace(/\.pdf$/i, '.jpg').replace('/upload/', '/upload/w_200,h_280,c_fill,g_north,pg_1/');
  }
  return null;
};

interface ChatMessageItemProps {
  msg: Message;
  searchQuery?: string;
  isSearchHighlight?: boolean;
  onReply: (msg: Message) => void;
  onTogglePin: (msg: Message) => void;
  onToggleStar: (msg: Message) => void;
  onAddReaction: (msg: Message, emoji: string) => void;
  onDeleteMessage: (msg: Message) => void;
  onCreateTask: (initialText: string) => void;
  onCreateEvent: (initialTitle: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'];

export function ChatMessageItem({
  msg,
  searchQuery,
  isSearchHighlight,
  onReply,
  onTogglePin,
  onToggleStar,
  onAddReaction,
  onDeleteMessage,
  onCreateTask,
  onCreateEvent
}: ChatMessageItemProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeFormatted = format(
    typeof msg.timestamp?.toDate === 'function' ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now()),
    'HH:mm'
  );

  // Render System Event Cards (3.6)
  if (msg.isSystemEvent) {
    return (
      <div 
        id={`msg-${msg.id}`}
        className="flex justify-center my-3 transition-all animate-in fade-in duration-200"
      >
        <div className="bg-card/90 dark:bg-card/70 border border-border shadow-2xs rounded-xl px-4 py-2 max-w-lg text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Bot size={12} className="text-primary" />
            <span>Sistema iContábil CRM</span>
            <span>·</span>
            <span>{timeFormatted}</span>
          </div>
          <p className="text-xs font-semibold text-foreground leading-relaxed">
            {msg.text}
          </p>
        </div>
      </div>
    );
  }

  // Text highlighting for search (3.4)
  const renderTextWithHighlight = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 dark:bg-amber-500/80 text-black dark:text-white rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleCopyText = () => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text);
      toast.success('Texto copiado para a área de transferência!');
    }
    setShowActionsMenu(false);
  };

  const handleSaveFile = () => {
    if (msg.attachment?.fileUrl) {
      window.open(msg.attachment.fileUrl, '_blank');
      toast.success('Iniciando download do arquivo...');
    } else {
      toast.error('Nenhum arquivo disponível para download.');
    }
    setShowActionsMenu(false);
  };

  // Group reactions by emoji
  const groupedReactions = (msg.reactions || []).reduce((acc: { [emoji: string]: number }, cur) => {
    acc[cur.emoji] = (acc[cur.emoji] || 0) + 1;
    return acc;
  }, {});

  const renderMessageContent = () => {
    switch (msg.type) {
      case 'image':
        return (
          <div className="space-y-1">
            <div className="rounded-lg overflow-hidden max-w-xs border border-border/40 bg-black/10">
              <LazyImage 
                src={msg.attachment?.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80'} 
                alt="Anexo de Imagem" 
                className="w-full h-auto object-cover max-h-60 hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={() => window.open(msg.attachment?.fileUrl, '_blank')}
              />
            </div>
            {msg.text && msg.text !== msg.attachment?.fileName && (
              <p className="text-xs pt-1 leading-relaxed">{renderTextWithHighlight(msg.text)}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-1">
            <div className="rounded-lg overflow-hidden max-w-xs border border-border/40 bg-black relative flex items-center justify-center min-h-[160px]">
              <div className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <Play size={20} className="ml-1" />
              </div>
            </div>
            {msg.text && <p className="text-xs pt-1 leading-relaxed">{renderTextWithHighlight(msg.text)}</p>}
          </div>
        );

      case 'audio':
        return (
          <LazyAudioPlayer 
            fileUrl={msg.attachment?.fileUrl} 
            duration={msg.attachment?.duration} 
          />
        );

      case 'pdf':
      case 'document': {
        const thumbnail = getPdfThumbnail(msg.attachment?.fileUrl);
        return (
          <div className="space-y-2 max-w-xs">
            {thumbnail && (
              <div className="rounded-lg overflow-hidden border border-border/40 max-h-40 bg-muted/20 flex items-center justify-center">
                <LazyImage 
                  src={thumbnail} 
                  alt="Pré-visualização PDF" 
                  className="w-full h-auto object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.open(msg.attachment?.fileUrl, '_blank')}
                />
              </div>
            )}
            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 font-bold">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-foreground">
                  {msg.attachment?.fileName || msg.text || 'Documento.pdf'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {msg.attachment?.fileSize || '1.2 MB'} • PDF
                </p>
              </div>
              <a 
                href={msg.attachment?.fileUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="p-1.5 hover:bg-muted rounded-lg text-primary transition-colors shrink-0"
                title="Baixar Documento"
              >
                <Download size={15} />
              </a>
            </div>
          </div>
        );
      }

      case 'location':
        return (
          <div className="space-y-1 max-w-xs">
            <div className="rounded-lg overflow-hidden border border-border/50 bg-emerald-500/10 p-3 flex items-center gap-2">
              <MapPin size={24} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Localização Compartilhada</p>
                <p className="text-[10px] text-muted-foreground">Av. Nazaré, 1200 - Belém, PA</p>
              </div>
            </div>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              <ExternalLink size={12} /> Abrir no Google Maps
            </a>
          </div>
        );

      case 'contact':
        return (
          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 max-w-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{msg.attachment?.contactName || 'Contato Profissional'}</p>
              <p className="text-[10px] text-muted-foreground">{msg.attachment?.contactPhone || '(91) 98000-1122'}</p>
            </div>
          </div>
        );

      default:
        return <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithHighlight(msg.text)}</p>;
    }
  };

  return (
    <div 
      id={`msg-${msg.id}`}
      className={cn(
        "group relative flex flex-col max-w-[78%] md:max-w-[68%] transition-all my-1.5",
        msg.isFromMe ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      {/* Reply Context Header if present */}
      {msg.replyTo && (
        <div 
          onClick={() => {
            const targetEl = document.getElementById(`msg-${msg.replyTo?.id}`);
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
          }}
          className={cn(
            "text-[11px] px-3 py-1.5 rounded-t-xl border-l-4 border-primary cursor-pointer hover:opacity-90 transition-opacity min-w-[180px] max-w-full truncate mb-[-4px] z-0",
            msg.isFromMe ? "bg-primary-foreground/10 text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <p className="font-bold text-[10px] truncate text-primary">{msg.replyTo.senderName}</p>
          <p className="truncate text-[10px]">{msg.replyTo.text}</p>
        </div>
      )}

      {/* Main Message Bubble */}
      <div
        className={cn(
          "p-3 rounded-2xl text-xs shadow-2xs relative space-y-1 transition-all z-10",
          msg.isFromMe
            ? "bg-primary text-primary-foreground rounded-tr-xs"
            : "bg-card border border-border rounded-tl-xs text-card-foreground",
          isSearchHighlight && "ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/40"
        )}
      >
        {/* Pinned / Starred Badge Indicators */}
        <div className="flex items-center gap-1.5 absolute top-2 right-2 text-muted-foreground">
          {msg.isPinned && (
            <Pin size={11} className="text-amber-500 fill-amber-500 rotate-45" title="Mensagem Fixada" />
          )}
          {msg.isStarred && (
            <Star size={11} className="text-amber-500 fill-amber-500" title="Mensagem Importante" />
          )}
        </div>

        {renderMessageContent()}

        {/* Time + Status Indicator (3.1) */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-[9px] mt-1 select-none",
            msg.isFromMe ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          <span>{timeFormatted}</span>
          {msg.isFromMe && (
            msg.status === 'read' ? (
              <CheckCheck size={14} className="text-sky-300 font-bold" title="Lida pelo contato" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck size={14} className="opacity-80" title="Entregue" />
            ) : (
              <Check size={14} className="opacity-80" title="Enviada pelo servidor" />
            )
          )}
        </div>

        {/* Reactions List Below Bubble */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={cn(
            "absolute -bottom-3 flex items-center gap-1 bg-card border border-border px-1.5 py-0.5 rounded-full shadow-xs text-[11px] z-20",
            msg.isFromMe ? "right-2" : "left-2"
          )}>
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px] font-bold text-muted-foreground">{count}</span>}
              </span>
            ))}
          </div>
        )}

        {/* Hover Actions Menu Bar (3.2) */}
        <div 
          ref={menuRef}
          className={cn(
            "absolute top-[-14px] hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-full p-0.5 shadow-md z-30 transition-all animate-in fade-in zoom-in-95 duration-150",
            msg.isFromMe ? "left-2" : "right-2"
          )}
        >
          {/* Reaction Button */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowActionsMenu(false);
            }}
            title="Reagir"
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            <Smile size={14} />
          </button>

          {/* Reply Button */}
          <button
            onClick={() => onReply(msg)}
            title="Responder"
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            <Reply size={14} />
          </button>

          {/* More Options Dropdown Button */}
          <button
            onClick={() => {
              setShowActionsMenu(!showActionsMenu);
              setShowEmojiPicker(false);
            }}
            title="Mais Opções"
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            <MoreVertical size={14} />
          </button>

          {/* Emoji Quick Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute top-8 left-0 bg-card border border-border rounded-full shadow-xl p-1.5 flex items-center gap-1 z-40 animate-in fade-in zoom-in-95">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction(msg, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-full text-sm transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* "Mais" Context Menu (3.2) */}
          {showActionsMenu && (
            <div className="absolute top-8 right-0 w-52 bg-card border border-border rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 text-foreground">
              <button
                onClick={() => {
                  onToggleStar(msg);
                  setShowActionsMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Star size={14} className={msg.isStarred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} />
                <span>{msg.isStarred ? 'Remover Importante' : 'Marcar como importante'}</span>
              </button>

              <button
                onClick={() => {
                  onTogglePin(msg);
                  setShowActionsMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Pin size={14} className={msg.isPinned ? "text-amber-500 rotate-45" : "text-muted-foreground"} />
                <span>{msg.isPinned ? 'Desafixar Mensagem' : 'Fixar na Conversa'}</span>
              </button>

              <button
                onClick={() => {
                  onCreateTask(msg.text || msg.attachment?.fileName || 'Nova tarefa');
                  setShowActionsMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <ClipboardList size={14} className="text-blue-500" />
                <span>Criar tarefa a partir desta</span>
              </button>

              <button
                onClick={() => {
                  onCreateEvent(msg.text || 'Novo compromisso');
                  setShowActionsMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Calendar size={14} className="text-emerald-500" />
                <span>Criar compromisso</span>
              </button>

              {(msg.type === 'pdf' || msg.type === 'image' || msg.type === 'document' || msg.attachment?.fileUrl) && (
                <button
                  onClick={handleSaveFile}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
                >
                  <Save size={14} className="text-purple-500" />
                  <span>Salvar arquivo</span>
                </button>
              )}

              <button
                onClick={handleCopyText}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Copy size={14} className="text-muted-foreground" />
                <span>Copiar texto</span>
              </button>

              <div className="h-[1px] bg-border my-1" />

              <button
                onClick={() => {
                  onDeleteMessage(msg);
                  setShowActionsMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left font-medium"
              >
                <Trash2 size={14} />
                <span>Apagar para mim</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
