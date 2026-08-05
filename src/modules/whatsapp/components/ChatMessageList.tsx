import React, { useRef, useEffect } from 'react';
import { 
  Check, 
  CheckCheck, 
  FileText, 
  Download, 
  MapPin, 
  User as UserIcon, 
  Play, 
  Pause, 
  Volume2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Message } from '../types';
import { cn } from '../../../shared/utils/cn';
import { format } from 'date-fns';

interface ChatMessageListProps {
  messages: Message[];
  isTyping?: boolean;
}

export function ChatMessageList({ messages, isTyping }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'image':
        return (
          <div className="space-y-1">
            <div className="rounded-lg overflow-hidden max-w-xs border border-border/40 bg-black/10">
              <img 
                src={msg.attachment?.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80'} 
                alt="Anexo de Imagem" 
                className="w-full h-auto object-cover max-h-60"
              />
            </div>
            {msg.text && msg.text !== msg.attachment?.fileName && (
              <p className="text-xs pt-1 leading-relaxed">{msg.text}</p>
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
            {msg.text && <p className="text-xs pt-1 leading-relaxed">{msg.text}</p>}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 p-1 min-w-[200px]">
            <button className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Play size={16} className="ml-0.5" />
            </button>
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-muted/60 rounded-full w-full relative overflow-hidden">
                <div className="h-full bg-primary w-1/3 rounded-full" />
              </div>
              <span className="text-[10px] text-muted-foreground block">
                00:{msg.attachment?.duration ? String(msg.attachment.duration).padStart(2, '0') : '08'}
              </span>
            </div>
          </div>
        );

      case 'pdf':
      case 'document':
        return (
          <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border/50 max-w-xs">
            <div className="w-10 h-10 rounded bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 font-bold">
              <FileText size={20} />
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
              className="p-1.5 hover:bg-muted rounded text-primary transition-colors shrink-0"
            >
              <Download size={16} />
            </a>
          </div>
        );

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

      case 'sticker':
        return (
          <div className="w-24 h-24 flex items-center justify-center text-4xl">
            👏
          </div>
        );

      default:
        return <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-muted/10">
      {messages.map((msg) => {
        const timeFormatted = format(
          typeof msg.timestamp?.toDate === 'function' ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now()),
          'HH:mm'
        );

        return (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[75%] md:max-w-[65%]",
              msg.isFromMe ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div
              className={cn(
                "p-3 rounded-2xl text-xs shadow-xs relative space-y-1 transition-all",
                msg.isFromMe
                  ? "bg-primary text-primary-foreground rounded-tr-xs"
                  : "bg-card border border-border rounded-tl-xs text-card-foreground"
              )}
            >
              {renderMessageContent(msg)}

              <div
                className={cn(
                  "flex items-center justify-end gap-1 text-[9px] mt-1",
                  msg.isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                <span>{timeFormatted}</span>
                {msg.isFromMe && (
                  msg.status === 'read' ? (
                    <CheckCheck size={13} className="text-sky-300" />
                  ) : msg.status === 'delivered' ? (
                    <CheckCheck size={13} />
                  ) : (
                    <Check size={13} />
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="mr-auto items-start max-w-[60%]">
          <div className="p-3 rounded-2xl bg-card border border-border text-xs text-muted-foreground flex items-center gap-2">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </span>
            <span className="text-[10px] font-medium">Digitando...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
