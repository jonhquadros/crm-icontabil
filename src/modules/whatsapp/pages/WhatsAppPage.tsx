import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Send, 
  Paperclip, 
  Smile,
  Check,
  CheckCheck,
  User,
  Filter,
  MessageSquare
} from 'lucide-react';
import { whatsappService } from '../services/whatsappService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Chat, Message } from '../types';
import { cn } from '../../../shared/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WhatsAppPage() {
  const { userData } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userData?.companyId) return;

    const unsubscribe = whatsappService.subscribeToChats(userData.companyId, (data) => {
      setChats(data);
      // If no active chat but we have chats, select the first one maybe? 
      // Or keep it empty until selected.
    });

    return () => unsubscribe();
  }, [userData?.companyId]);

  useEffect(() => {
    if (!activeChat) return;

    const unsubscribe = whatsappService.subscribeToMessages(activeChat.id, (data) => {
      setMessages(data);
      scrollToBottom();
    });

    whatsappService.markAsRead(activeChat.id);

    return () => unsubscribe();
  }, [activeChat?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !userData) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await whatsappService.sendMessage(activeChat.id, userData.companyId, {
        senderId: userData.id,
        senderName: userData.name,
        text,
        type: 'text',
        isFromMe: true
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.contactPhone.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-140px)] flex bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-80 md:w-96 flex flex-col border-r border-border bg-muted/10">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Conversas</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MessageSquare size={20} className="text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreVertical size={20} className="text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Buscar ou começar nova conversa" 
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "p-4 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50",
                  activeChat?.id === chat.id && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden border border-border">
                  {chat.avatarUrl ? (
                    <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold truncate">{chat.contactName}</h3>
                    <span className="text-[10px] text-muted-foreground">
                      {chat.lastMessage ? format(chat.lastMessage.timestamp?.toDate?.() || new Date(), 'HH:mm', { locale: ptBR }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {chat.lastMessage?.text || 'Sem mensagens'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area - Conversation */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border border-border">
                  {activeChat.avatarUrl ? (
                    <img src={activeChat.avatarUrl} alt={activeChat.contactName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{activeChat.contactName}</h3>
                  <p className="text-[10px] text-success font-medium">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <Phone size={20} />
                </button>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <Video size={20} />
                </button>
                <div className="h-6 w-[1px] bg-border"></div>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <Search size={20} />
                </button>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://w0.peakpx.com/wallpaper/508/606/HD-wallpaper-whatsapp-l-light-theme-stock-whatsapp.jpg')] bg-repeat bg-center bg-opacity-5">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex flex-col max-w-[70%]",
                    message.isFromMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl text-sm shadow-sm relative",
                    message.isFromMe 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-card border border-border rounded-tl-none"
                  )}>
                    <p className="leading-relaxed">{message.text}</p>
                    <div className={cn(
                      "flex items-center gap-1 justify-end mt-1 text-[10px]",
                      message.isFromMe ? "text-white/70" : "text-muted-foreground"
                    )}>
                      <span>{format(message.timestamp?.toDate?.() || new Date(), 'HH:mm')}</span>
                      {message.isFromMe && (
                        message.status === 'read' ? <CheckCheck size={12} className="text-sky-300" /> : 
                        message.status === 'delivered' ? <CheckCheck size={12} /> : <Check size={12} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border flex items-center gap-4">
              <button type="button" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                <Smile size={24} />
              </button>
              <button type="button" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                <Paperclip size={24} />
              </button>
              <input 
                type="text" 
                placeholder="Digite uma mensagem" 
                className="flex-1 bg-muted/50 border border-border rounded-full py-2 px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-primary text-white p-3 rounded-full hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-xl font-bold mb-2">Selecione uma conversa</h3>
            <p className="text-muted-foreground max-w-sm">
              Escolha uma conversa da lista ao lado para visualizar o histórico de mensagens e responder seus clientes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
