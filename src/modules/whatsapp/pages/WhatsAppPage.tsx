import React from 'react';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatInputArea } from '../components/ChatInputArea';
import { ContactInfoPanel } from '../components/ContactInfoPanel';
import { EvolutionStatusBanner } from '../components/EvolutionStatusBanner';
import { cn } from '../../../shared/utils/cn';

export function WhatsAppPage() {
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    newMessage,
    setNewMessage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    activeFilter,
    setActiveFilter,
    sortOption,
    setSortOption,
    isInfoOpen,
    setIsInfoOpen,
    quickResponses,
    showQuickPicker,
    setShowQuickPicker,
    isRecordingAudio,
    recordingTimer,
    replyingTo,
    setReplyingTo,
    isSearchingMessages,
    setIsSearchingMessages,
    showSystemEvents,
    setShowSystemEvents,
    isContactTyping,
    handleUserTyping,
    refreshQuickResponses,
    handleSendMessage,
    handleSendAttachment,
    handleToggleTag,
    handleToggleTagForChat,
    handleStartAudioRecord,
    handleStopAndSendAudio,
    handleCancelAudioRecord,
    handleTogglePin,
    handleToggleStar,
    handleAddReaction,
    handleDeleteMessage,
    handleTogglePinChat,
    handleToggleMuteChat,
    handleResolveChat,
    handleAssignUser,
    handleAssumeChat,
    queueCount,
    currentUser,
    isLoadingChats,
    isLoadingMessages,
    loadMoreMessages
  } = useWhatsApp();

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-card rounded-2xl border border-border shadow-md overflow-hidden">
      {/* Inline Evolution API Status Banner */}
      <EvolutionStatusBanner />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column (320px) - Conversations List */}
        <div className={cn("w-full md:w-80 border-r border-border h-full flex flex-col shrink-0 bg-card", activeChat ? "hidden md:flex" : "flex")}>
          <ChatSidebar
            chats={chats}
            activeChat={activeChat}
            onSelectChat={setActiveChat}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            debouncedSearchTerm={debouncedSearchTerm}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onResolveChat={handleResolveChat}
            onTogglePinChat={handleTogglePinChat}
            onToggleMuteChat={handleToggleMuteChat}
            onAssignUser={handleAssignUser}
            onAssumeChat={handleAssumeChat}
            onToggleTagForChat={handleToggleTagForChat}
            queueCount={queueCount}
            isLoading={isLoadingChats}
          />
        </div>

        {/* Main Column (flex) - Conversation or Empty State */}
        <div className={cn("flex-1 flex flex-col bg-background relative overflow-hidden min-w-0", activeChat ? "flex" : "hidden md:flex")}>
          {activeChat ? (
            <>
              {/* Header */}
              <ChatHeader
                chat={activeChat}
                onToggleInfoPanel={() => setIsInfoOpen(!isInfoOpen)}
                isInfoOpen={isInfoOpen}
                onSearchClick={() => setIsSearchingMessages(!isSearchingMessages)}
                isContactTyping={isContactTyping}
                onAssignUser={handleAssignUser}
                currentUser={currentUser}
                onBackClick={() => setActiveChat(null)}
              />

              {/* Messages Area */}
              <ChatMessageList
                messages={messages}
                activeChat={activeChat}
                isSearchingMessages={isSearchingMessages}
                onCloseSearch={() => setIsSearchingMessages(false)}
                showSystemEvents={showSystemEvents}
                onToggleSystemEvents={() => setShowSystemEvents(!showSystemEvents)}
                onReplyMessage={(msg) => setReplyingTo(msg)}
                onTogglePinMessage={handleTogglePin}
                onToggleStarMessage={handleToggleStar}
                onAddReaction={handleAddReaction}
                onDeleteMessage={handleDeleteMessage}
                isLoading={isLoadingMessages}
                onLoadMore={loadMoreMessages}
              />

              {/* Input Area */}
              <ChatInputArea
                messageText={newMessage}
                onMessageChange={setNewMessage}
                onSend={() => handleSendMessage()}
                onSendAttachment={handleSendAttachment}
                quickResponses={quickResponses}
                showQuickPicker={showQuickPicker}
                onToggleQuickPicker={setShowQuickPicker}
                isRecordingAudio={isRecordingAudio}
                recordingTimer={recordingTimer}
                onStartAudioRecord={handleStartAudioRecord}
                onStopAndSendAudio={handleStopAndSendAudio}
                onCancelAudioRecord={handleCancelAudioRecord}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                chat={activeChat}
                onTyping={handleUserTyping}
                onQuickResponsesUpdated={refreshQuickResponses}
              />
            </>
          ) : (
            /* Empty Chat Selection State */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/10 space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-pulse">
                <MessageSquare size={40} />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-foreground">iContábil - WhatsApp Web Corporativo</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecione uma conversa da lista ao lado para iniciar o atendimento, visualizar históricos, enviar anexos ou gerenciar etiquetas de atendimento.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-[11px] text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-xs">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Conexão Criptografada via Evolution API</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contact Info Panel (Toggle) */}
        {activeChat && isInfoOpen && (
          <div className="w-full md:w-80 border-l border-border bg-card h-full flex flex-col shrink-0">
            <ContactInfoPanel
              chat={activeChat}
              onClose={() => setIsInfoOpen(false)}
              onToggleTag={handleToggleTag}
              onSendDocumentToChat={(url, name) => handleSendMessage(`📄 *Documento:* ${name}\n${url}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
