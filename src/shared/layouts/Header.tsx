import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
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
          <Settings className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" size={20} />
          <span className="text-sm text-muted-foreground font-medium">Status: <span className="text-success font-bold">CONECTADO</span></span>
        </div>
      </div>
    </header>
  );
}
