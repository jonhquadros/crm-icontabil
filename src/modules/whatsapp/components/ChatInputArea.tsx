import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Paperclip, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  User as UserIcon, 
  Zap, 
  X
} from 'lucide-react';
import { Message, MessageType, QuickResponse, Chat } from '../types';
import { cn } from '../../../shared/utils/cn';
import { EmojiPickerPopover } from './ChatInputArea/EmojiPickerPopover';
import { QuickResponsePopover } from './ChatInputArea/QuickResponsePopover';
import { NewQuickResponseModal } from './ChatInputArea/NewQuickResponseModal';
import { LinkPreviewCard, detectUrlInText, LinkPreviewInfo } from './ChatInputArea/LinkPreviewCard';
import { AudioRecorderBar } from './ChatInputArea/AudioRecorderBar';

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
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  chat?: Chat;
  onTyping?: () => void;
  onQuickResponsesUpdated?: () => void;
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
  replyingTo,
  onCancelReply,
  chat,
  onTyping,
  onQuickResponsesUpdated
}: ChatInputAreaProps) {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isNewQuickModalOpen, setIsNewQuickModalOpen] = useState(false);
  
  // Link preview state
  const [linkPreview, setLinkPreview] = useState<LinkPreviewInfo | null>(null);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);

  // Auto-detect links in text (4.3)
  useEffect(() => {
    const detected = detectUrlInText(messageText);
    if (detected && detected.url !== dismissedUrl) {
      setLinkPreview(detected);
    } else if (!detected) {
      setLinkPreview(null);
    }
  }, [messageText, dismissedUrl]);

  const handleInputChange = (text: string) => {
    onMessageChange(text);
    if (onTyping) onTyping();

    // Auto open quick picker when typing / or /c
    if (text.startsWith('/') && !showQuickPicker) {
      onToggleQuickPicker(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithPreview();
    }
  };

  const handleSendWithPreview = () => {
    onSend();
    setLinkPreview(null);
    setDismissedUrl(null);
  };

  const handleSelectEmoji = (emoji: string) => {
    onMessageChange(messageText + emoji);
    setShowEmojiPicker(false);
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
      {/* Reply Preview Banner (3.2) */}
      {replyingTo && (
        <div className="flex items-center justify-between p-2.5 mb-2 bg-muted/60 border-l-4 border-primary rounded-r-xl text-xs animate-in slide-in-from-bottom-2">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-[11px]">Respondendo a {replyingTo.senderName}</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {replyingTo.text || replyingTo.attachment?.fileName || `[${replyingTo.type.toUpperCase()}]`}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors shrink-0"
            title="Cancelar resposta"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Link Preview Card (4.3) */}
      {linkPreview && (
        <LinkPreviewCard
          preview={linkPreview}
          onRemove={() => {
            setDismissedUrl(linkPreview.url);
            setLinkPreview(null);
          }}
        />
      )}

      {/* Evolved Quick Responses Popover (4.1 & 4.2) */}
      <QuickResponsePopover
        isOpen={showQuickPicker}
        onClose={() => onToggleQuickPicker(false)}
        quickResponses={quickResponses}
        onSelect={(content) => {
          onMessageChange(content);
          onToggleQuickPicker(false);
        }}
        onOpenNewModal={() => setIsNewQuickModalOpen(true)}
        chat={chat}
        initialFilter={messageText.startsWith('/') ? messageText : ''}
      />

      {/* Emoji Picker Popover (4.0) */}
      <EmojiPickerPopover
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-12 bg-card border border-border rounded-xl shadow-xl p-2 z-30 flex flex-col gap-1 w-48 animate-in slide-in-from-bottom-2">
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

      {/* Audio Recording Bar or Input Controls */}
      {isRecordingAudio ? (
        <AudioRecorderBar
          timer={recordingTimer}
          onCancel={onCancelAudioRecord}
          onSend={onStopAndSendAudio}
        />
      ) : (
        /* Layout: [⚡] [📎] [😊] [Input...] [🎤/▶] */
        <div className="flex items-center gap-1.5">
          {/* Quick Responses / Automations (⚡) */}
          <button
            type="button"
            onClick={() => {
              onToggleQuickPicker(!showQuickPicker);
              setShowEmojiPicker(false);
              setShowAttachmentMenu(false);
            }}
            title="Respostas Rápidas e Templates (/)"
            className={`p-2 rounded-full transition-colors ${
              showQuickPicker 
                ? 'bg-amber-500/10 text-amber-500' 
                : 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
            }`}
          >
            <Zap size={20} />
          </button>

          {/* Attachment Menu (📎) */}
          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
              onToggleQuickPicker(false);
            }}
            title="Anexar Arquivo"
            className={`p-2 rounded-full transition-colors ${
              showAttachmentMenu 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Paperclip size={20} />
          </button>

          {/* Emoji Picker (😊) */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
              onToggleQuickPicker(false);
            }}
            title="Escolher Emojis"
            className={`p-2 rounded-full transition-colors ${
              showEmojiPicker 
                ? 'bg-amber-500/10 text-amber-500' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Smile size={20} />
          </button>

          {/* Text Input Field */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Digite uma mensagem ou digite / para respostas rápidas e templates..."
              value={messageText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-muted/40 border border-border rounded-full py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>

          {/* Dynamic Send (▶) vs Record Mic (🎤) Button */}
          {messageText.trim() ? (
            <button
              type="button"
              onClick={handleSendWithPreview}
              title="Enviar Mensagem"
              className="bg-primary text-primary-foreground p-2.5 rounded-full hover:bg-primary-hover transition-all shadow-md shrink-0 active:scale-95"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartAudioRecord}
              title="Gravar Áudio de Voz"
              className="bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 p-2.5 rounded-full transition-all shrink-0 active:scale-95"
            >
              <Mic size={18} />
            </button>
          )}
        </div>
      )}

      {/* New Quick Response Modal */}
      <NewQuickResponseModal
        isOpen={isNewQuickModalOpen}
        onClose={() => setIsNewQuickModalOpen(false)}
        onCreated={onQuickResponsesUpdated}
      />
    </div>
  );
}
