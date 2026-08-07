import React, { useState } from 'react';
import { 
  X, 
  Info, 
  Kanban, 
  FileText, 
  Calendar, 
  CheckSquare,
  Megaphone 
} from 'lucide-react';
import { Chat, Tag } from '../types';
import { InfoTab } from './ConversationPanel/tabs/InfoTab';
import { CRMTab } from './ConversationPanel/tabs/CRMTab';
import { DocsTab } from './ConversationPanel/tabs/DocsTab';
import { AgendaTab } from './ConversationPanel/tabs/AgendaTab';
import { TasksTab } from './ConversationPanel/tabs/TasksTab';
import { CampaignsTab } from './ConversationPanel/tabs/CampaignsTab';

interface ContactInfoPanelProps {
  chat: Chat;
  onClose: () => void;
  onToggleTag: (tag: Tag) => void;
  onSendDocumentToChat?: (fileUrl: string, fileName: string) => void;
}

type TabType = 'info' | 'crm' | 'docs' | 'agenda' | 'tasks' | 'campaigns';

export function ContactInfoPanel({ 
  chat, 
  onClose, 
  onToggleTag,
  onSendDocumentToChat 
}: ContactInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const initials = chat.contactName.slice(0, 2).toUpperCase();

  return (
    <div className="w-80 border-l border-border bg-card h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hub do Contato</h3>
        <button 
          onClick={onClose} 
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Avatar & Contact Info Header */}
      <div className="p-4 border-b border-border/60 bg-card flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center border border-primary/20 overflow-hidden shrink-0 shadow-2xs">
          {chat.avatarUrl ? (
            <img src={chat.avatarUrl} alt={chat.contactName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-foreground truncate">{chat.contactName}</h4>
          <p className="text-xs text-muted-foreground truncate">{chat.contactPhone}</p>
          {chat.companyName && (
            <p className="text-[11px] font-medium text-primary/80 truncate mt-0.5">{chat.companyName}</p>
          )}
        </div>
      </div>

      {/* Internal Tabs Navigation Bar */}
      <div className="flex items-center border-b border-border bg-muted/30 p-1 gap-0.5 shrink-0">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${
            activeTab === 'info'
              ? 'bg-background text-primary shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title="Informações do Contato"
        >
          <Info size={14} />
          <span className="mt-0.5">Info</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${
            activeTab === 'crm'
              ? 'bg-background text-primary shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title="Funil do CRM"
        >
          <Kanban size={14} />
          <span className="mt-0.5">CRM</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${
            activeTab === 'docs'
              ? 'bg-background text-primary shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title="Documentos"
        >
          <FileText size={14} />
          <span className="mt-0.5">Docs</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${
            activeTab === 'agenda'
              ? 'bg-background text-primary shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title="Agenda e Compromissos"
        >
          <Calendar size={14} />
          <span className="mt-0.5">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${
            activeTab === 'tasks'
              ? 'bg-background text-primary shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title="Tarefas do Cliente"
        >
          <CheckSquare size={14} />
          <span className="mt-0.5">Tarefas</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${
            activeTab === 'campaigns'
              ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-2xs border border-border/80'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title="Campanhas do Contato"
        >
          <Megaphone size={14} />
          <span className="mt-0.5">Campanhas</span>
        </button>
      </div>

      {/* Active Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <InfoTab 
            chat={chat} 
            onToggleTag={onToggleTag} 
            onOpenCRM={() => setActiveTab('crm')} 
          />
        )}
        {activeTab === 'crm' && (
          <CRMTab chat={chat} />
        )}
        {activeTab === 'docs' && (
          <DocsTab 
            chat={chat} 
            onSendDocumentToChat={onSendDocumentToChat} 
          />
        )}
        {activeTab === 'agenda' && (
          <AgendaTab chat={chat} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab chat={chat} />
        )}
        {activeTab === 'campaigns' && (
          <CampaignsTab chat={chat} />
        )}
      </div>
    </div>
  );
}
