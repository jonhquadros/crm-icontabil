import React, { useState } from 'react';
import { Pin, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Message } from '../../types';

interface PinnedMessageBannerProps {
  pinnedMessages: Message[];
  onScrollToMessage: (messageId: string) => void;
  onUnpinMessage: (message: Message) => void;
}

export function PinnedMessageBanner({
  pinnedMessages,
  onScrollToMessage,
  onUnpinMessage
}: PinnedMessageBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const activeMsg = pinnedMessages[currentIndex] || pinnedMessages[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0 select-none transition-all">
      <div 
        onClick={() => onScrollToMessage(activeMsg.id)}
        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 hover:opacity-80 transition-opacity"
      >
        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
          <Pin size={13} className="rotate-45" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Mensagem Fixada {pinnedMessages.length > 1 ? `(${currentIndex + 1}/${pinnedMessages.length})` : ''}
            </span>
          </div>
          <p className="text-xs truncate font-medium text-foreground/90">
            "{activeMsg.text || (activeMsg.attachment?.fileName || `[${activeMsg.type.toUpperCase()}]`)}"
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {pinnedMessages.length > 1 && (
          <div className="flex items-center gap-0.5 bg-background/50 rounded-lg p-0.5 border border-amber-500/20">
            <button
              onClick={handlePrev}
              title="Anterior"
              className="p-1 hover:bg-amber-500/20 rounded transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              title="Próxima"
              className="p-1 hover:bg-amber-500/20 rounded transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpinMessage(activeMsg);
          }}
          title="Desafixar mensagem"
          className="p-1 hover:bg-amber-500/20 rounded-full transition-colors text-muted-foreground hover:text-amber-900 dark:hover:text-amber-100"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
