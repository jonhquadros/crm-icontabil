import React from 'react';
import { Bell, Search, Settings, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden" onClick={onToggleSidebar}>
          <Layout className="text-muted-foreground" size={20} />
        </button>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Busca global..." 
            className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer">
          <span className="absolute -top-1 -right-1 bg-danger w-2 h-2 rounded-full"></span>
          <Bell className="text-muted-foreground hover:text-foreground transition-colors" size={20} />
        </div>
        <div className="h-8 w-[1px] bg-border"></div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/dashboard/settings')}
            title="Configurações"
            aria-label="Configurações"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            id="header-settings-button"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
