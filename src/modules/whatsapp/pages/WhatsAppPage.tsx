import React from 'react';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatInputArea } from '../components/ChatInputArea';
import { ContactInfoPanel } from '../components/ContactInfoPanel';

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
    activeFilter,
    setActiveFilter,
    isInfoOpen,
    setIsInfoOpen,
    quickResponses,
    showQuickPicker,
    setShowQuickPicker,
    isRecordingAudio,
    recordingTimer,
    handleSendMessage,
    handleSendAttachment,
    handleToggleTag,
    handleStartAudioRecord,
    handleStopAndSendAudio,
    handleCancelAudioRecord,
  } = useWhatsApp();

  return (
    <div className="h-[calc(100vh-140px)] flex bg-card rounded-2xl border border-border shadow-md overflow-hidden">
      {/* Left Column (320px) - Conversations List */}
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Column (flex) - Conversation or Empty State */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden min-w-0">
        {activeChat ? (
          <>
            {/* Header */}
            <ChatHeader
              chat={activeChat}
              onToggleInfoPanel={() => setIsInfoOpen(!isInfoOpen)}
              isInfoOpen={isInfoOpen}
            />

            {/* Messages Area */}
            <ChatMessageList messages={messages} />

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
        <ContactInfoPanel
          chat={activeChat}
          onClose={() => setIsInfoOpen(false)}
          onToggleTag={handleToggleTag}
        />
      )}
    </div>
  );
}
