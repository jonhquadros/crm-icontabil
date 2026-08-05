import React, { useState } from 'react';
import { 
  Smile, 
  Paperclip, 
  Send, 
  Mic, 
  Square, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  User as UserIcon, 
  Zap, 
  X,
  Video
} from 'lucide-react';
import { MessageType, QuickResponse } from '../types';
import { cn } from '../../../shared/utils/cn';

interface ChatInputAreaProps {
  messageText: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  onSendAttachment: (type: MessageType, fileUrl: string, fileName: string) => void;
  quickResponses: QuickResponse[];
  showQuickPicker: boolean;
  onToggleQuickPicker: (show: boolean) => void;
  isRecordingAudio: boolean;
  recordingTimer: number;
  onStartAudioRecord: () => void;
  onStopAndSendAudio: () => void;
  onCancelAudioRecord: () => void;
}

export function ChatInputArea({
  messageText,
  onMessageChange,
  onSend,
  onSendAttachment,
  quickResponses,
  showQuickPicker,
  onToggleQuickPicker,
  isRecordingAudio,
  recordingTimer,
  onStartAudioRecord,
  onStopAndSendAudio,
  onCancelAudioRecord,
}: ChatInputAreaProps) {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    if (e.key === '/') {
      onToggleQuickPicker(true);
    }
  };

  const handleSelectQuickResponse = (item: QuickResponse) => {
    onMessageChange(item.content);
    onToggleQuickPicker(false);
  };

  const sampleAttachments = [
    {
      label: 'Imagem',
      icon: ImageIcon,
      color: 'bg-purple-500 text-white',
      type: 'image' as MessageType,
      url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
      fileName: 'Proposta_Comercial_iContabil.png'
    },
    {
      label: 'Documento PDF',
      icon: FileText,
      color: 'bg-red-500 text-white',
      type: 'pdf' as MessageType,
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'Contrato_Social_Atualizado.pdf'
    },
    {
      label: 'Localização',
      icon: MapPin,
      color: 'bg-emerald-500 text-white',
      type: 'location' as MessageType,
      url: '',
      fileName: 'Escritório iContábil Belém'
    },
    {
      label: 'Contato',
      icon: UserIcon,
      color: 'bg-blue-500 text-white',
      type: 'contact' as MessageType,
      url: '',
      fileName: 'Dra. Mariana Costa (Contadora)'
    }
  ];

  return (
    <div className="p-3 bg-card border-t border-border relative">
      {/* Quick Responses Popover */}
      {showQuickPicker && (
        <div className="absolute bottom-16 left-4 bg-card border border-border rounded-xl shadow-xl w-80 max-h-60 overflow-y-auto z-20 divide-y divide-border/50 animate-in slide-in-from-bottom-2">
          <div className="p-2 bg-muted/40 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Zap size={12} className="text-amber-500" /> Respostas Rápidas (/)
            </span>
            <button 
              onClick={() => onToggleQuickPicker(false)} 
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
          {quickResponses.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectQuickResponse(item)}
              className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{item.title}</span>
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                  {item.shortcut}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{item.content}</p>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-12 bg-card border border-border rounded-xl shadow-xl p-2 z-20 flex flex-col gap-1 w-48 animate-in slide-in-from-bottom-2">
          {sampleAttachments.map((att) => (
            <button
              key={att.label}
              onClick={() => {
                onSendAttachment(att.type, att.url, att.fileName);
                setShowAttachmentMenu(false);
              }}
              className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", att.color)}>
                <att.icon size={14} />
              </div>
              <span>{att.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Audio Recording State Bar */}
      {isRecordingAudio ? (
        <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              Gravando Áudio (00:{String(recordingTimer).padStart(2, '0')})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancelAudioRecord}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-full hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={onStopAndSendAudio}
              className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-red-700 transition-colors shadow-xs"
            >
              Enviar Áudio
            </button>
          </div>
        </div>
      ) : (
        /* Standard Input Controls */
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleQuickPicker(!showQuickPicker)}
            title="Respostas Rápidas (/)"
            className="p-2 text-muted-foreground hover:text-amber-500 hover:bg-muted rounded-full transition-colors"
          >
            <Zap size={20} />
          </button>

          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            title="Anexar Arquivo"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Digite uma mensagem ou digite '/' para respostas rápidas"
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-muted/40 border border-border rounded-full py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {messageText.trim() ? (
            <button
              type="button"
              onClick={onSend}
              className="bg-primary text-white p-2.5 rounded-full hover:bg-primary-hover transition-all shadow-md shrink-0"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartAudioRecord}
              title="Gravar Áudio de Voz"
              className="bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 p-2.5 rounded-full transition-all shrink-0"
            >
              <Mic size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
