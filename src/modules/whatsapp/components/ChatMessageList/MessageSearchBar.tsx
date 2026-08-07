import React from 'react';
import { Search, ChevronUp, ChevronDown, X, Filter } from 'lucide-react';

interface MessageSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentIndex: number;
  totalMatches: number;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onClose: () => void;
  showSystemEvents: boolean;
  onToggleSystemEvents: () => void;
}

export function MessageSearchBar({
  searchQuery,
  onSearchChange,
  currentIndex,
  totalMatches,
  onPrevMatch,
  onNextMatch,
  onClose,
  showSystemEvents,
  onToggleSystemEvents
}: MessageSearchBarProps) {
  return (
    <div className="bg-card border-b border-border p-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs z-10 shrink-0 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2 flex-1 max-w-md bg-muted/50 border border-border rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
        <Search size={15} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          autoFocus
          placeholder="Buscar na conversa..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')} 
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
        <span className="text-[11px] font-medium min-w-[90px] text-center">
          {searchQuery.trim() ? (
            totalMatches > 0 ? (
              `${currentIndex + 1} de ${totalMatches} resultado${totalMatches > 1 ? 's' : ''}`
            ) : (
              'Sem resultados'
            )
          ) : (
            'Digite para buscar'
          )}
        </span>

        <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-muted/20">
          <button
            onClick={onPrevMatch}
            disabled={totalMatches === 0}
            title="Resultado anterior"
            className="p-1 hover:bg-muted disabled:opacity-40 rounded transition-colors"
          >
            <ChevronUp size={15} />
          </button>
          <button
            onClick={onNextMatch}
            disabled={totalMatches === 0}
            title="Próximo resultado"
            className="p-1 hover:bg-muted disabled:opacity-40 rounded transition-colors"
          >
            <ChevronDown size={15} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-border mx-1" />

        {/* Toggle System Events Button */}
        <button
          onClick={onToggleSystemEvents}
          title={showSystemEvents ? "Ocultar Eventos do Sistema" : "Exibir Eventos do Sistema"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
            showSystemEvents
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter size={12} />
          <span>Eventos do Sistema</span>
        </button>

        <button
          onClick={onClose}
          title="Fechar busca"
          className="p-1.5 hover:bg-muted rounded-full transition-colors hover:text-foreground ml-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
