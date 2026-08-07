import React, { useRef, useEffect, useState } from 'react';
import { Message, Chat } from '../types';
import { PinnedMessageBanner } from './ChatMessageList/PinnedMessageBanner';
import { MessageSearchBar } from './ChatMessageList/MessageSearchBar';
import { ChatMessageItem } from './ChatMessageList/ChatMessageItem';
import { QuickTaskModal } from './ChatHeader/QuickTaskModal';
import { QuickEventModal } from './ChatHeader/QuickEventModal';
import { isSameDay, isToday, isYesterday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../../shared/utils/cn';

interface ChatMessageListProps {
  messages: Message[];
  activeChat: Chat;
  isTyping?: boolean;
  isSearchingMessages?: boolean;
  onCloseSearch?: () => void;
  showSystemEvents?: boolean;
  onToggleSystemEvents?: () => void;
  onReplyMessage: (msg: Message) => void;
  onTogglePinMessage: (msg: Message) => void;
  onToggleStarMessage: (msg: Message) => void;
  onAddReaction: (msg: Message, emoji: string) => void;
  onDeleteMessage: (msg: Message) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function ChatMessageList({
  messages,
  activeChat,
  isTyping,
  isSearchingMessages = false,
  onCloseSearch,
  showSystemEvents = true,
  onToggleSystemEvents,
  onReplyMessage,
  onTogglePinMessage,
  onToggleStarMessage,
  onAddReaction,
  onDeleteMessage,
  isLoading = false,
  onLoadMore
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Quick Task & Event Modals triggered from message menu
  const [taskModalState, setTaskModalState] = useState<{ isOpen: boolean; initialText: string }>({
    isOpen: false,
    initialText: ''
  });

  const [eventModalState, setEventModalState] = useState<{ isOpen: boolean; initialTitle: string }>({
    isOpen: false,
    initialTitle: ''
  });

  // Filter messages based on system event toggle
  const visibleMessages = messages.filter(
    (msg) => showSystemEvents || !msg.isSystemEvent
  );

  // Pinned messages list
  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  // Search matches
  const searchMatches = visibleMessages.filter((msg) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    const textMatch = msg.text && msg.text.toLowerCase().includes(query);
    const fileNameMatch = msg.attachment?.fileName && msg.attachment.fileName.toLowerCase().includes(query);
    return textMatch || fileNameMatch;
  });

  useEffect(() => {
    setCurrentSearchIndex(0);
    if (searchMatches.length > 0) {
      scrollToMessageId(searchMatches[0].id);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isSearchingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isTyping, isSearchingMessages]);

  const scrollToMessageId = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentSearchIndex(nextIdx);
    scrollToMessageId(searchMatches[nextIdx].id);
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchMatches.length;
    setCurrentSearchIndex(nextIdx);
    scrollToMessageId(searchMatches[nextIdx].id);
  };

  // Format date header string in Portuguese (3.5)
  const getDateLabel = (dateObj: Date) => {
    if (isToday(dateObj)) return 'Hoje';
    if (isYesterday(dateObj)) return 'Ontem';
    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-background">
      {/* Search Bar inside Conversation (3.4) */}
      {isSearchingMessages && (
        <MessageSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentIndex={currentSearchIndex}
          totalMatches={searchMatches.length}
          onPrevMatch={handlePrevMatch}
          onNextMatch={handleNextMatch}
          onClose={() => {
            setSearchQuery('');
            if (onCloseSearch) onCloseSearch();
          }}
          showSystemEvents={showSystemEvents}
          onToggleSystemEvents={onToggleSystemEvents || (() => {})}
        />
      )}

      {/* Pinned Messages Banner (3.3) */}
      <PinnedMessageBanner
        pinnedMessages={pinnedMessages}
        onScrollToMessage={scrollToMessageId}
        onUnpinMessage={onTogglePinMessage}
      />

      {/* Scrollable Message List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-muted/10"
      >
        {onLoadMore && messages.length >= 50 && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="px-3 py-1.5 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground text-[10px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Carregando mais...' : 'Ver mensagens anteriores'}
            </button>
          </div>
        )}

        {isLoading && messages.length === 0 ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map((idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex flex-col gap-1 max-w-[60%] animate-pulse",
                  idx % 2 === 0 ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="h-2.5 bg-muted rounded w-16" />
                <div className="h-10 bg-muted/50 rounded-2xl w-48 sm:w-64" />
                <div className="h-2 bg-muted rounded w-10 mt-1" />
              </div>
            ))}
          </div>
        ) : (
          visibleMessages.map((msg, idx) => {
            const msgDate = typeof msg.timestamp?.toDate === 'function' 
              ? msg.timestamp.toDate() 
              : new Date(msg.timestamp || Date.now());

            const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
            const prevMsgDate = prevMsg 
              ? (typeof prevMsg.timestamp?.toDate === 'function' ? prevMsg.timestamp.toDate() : new Date(prevMsg.timestamp || Date.now()))
              : null;

            const showDateSeparator = !prevMsgDate || !isSameDay(msgDate, prevMsgDate);
            const isCurrentMatch = searchMatches[currentSearchIndex]?.id === msg.id;

            return (
              <React.Fragment key={msg.id}>
                {/* Date Separator (3.5) */}
                {showDateSeparator && (
                  <div className="flex justify-center my-4 select-none">
                    <span className="bg-card/90 border border-border text-[11px] font-bold text-muted-foreground px-3 py-1 rounded-full shadow-2xs uppercase tracking-wider">
                      {getDateLabel(msgDate)}
                    </span>
                  </div>
                )}

                <ChatMessageItem
                  msg={msg}
                  searchQuery={searchQuery}
                  isSearchHighlight={isCurrentMatch}
                  onReply={onReplyMessage}
                  onTogglePin={onTogglePinMessage}
                  onToggleStar={onToggleStarMessage}
                  onAddReaction={onAddReaction}
                  onDeleteMessage={onDeleteMessage}
                  onCreateTask={(initialText) => setTaskModalState({ isOpen: true, initialText })}
                  onCreateEvent={(initialTitle) => setEventModalState({ isOpen: true, initialTitle })}
                />
              </React.Fragment>
            );
          })
        )}

        {isTyping && (
          <div className="mr-auto items-start max-w-[60%] my-2">
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

      {/* Quick Task & Event Modals from Message Actions */}
      <QuickTaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, initialText: '' })}
        chat={activeChat}
        initialTitle={taskModalState.initialText}
      />

      <QuickEventModal
        isOpen={eventModalState.isOpen}
        onClose={() => setEventModalState({ isOpen: false, initialTitle: '' })}
        chat={activeChat}
        initialTitle={eventModalState.initialTitle}
      />
    </div>
  );
}
