import React, { useState, useEffect, useRef } from 'react';
import { Zap, Search, Plus, X, Megaphone, Check } from 'lucide-react';
import { QuickResponse, Chat } from '../../types';

interface QuickResponsePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  quickResponses: QuickResponse[];
  onSelect: (content: string) => void;
  onOpenNewModal: () => void;
  chat?: Chat;
  initialFilter?: string;
}

export function QuickResponsePopover({
  isOpen,
  onClose,
  quickResponses,
  onSelect,
  onOpenNewModal,
  chat,
  initialFilter = ''
}: QuickResponsePopoverProps) {
  const [filterText, setFilterText] = useState(initialFilter);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFilter !== filterText) {
      setFilterText(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Filter items
  const filteredItems = quickResponses.filter((item) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      item.shortcut.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q)
    );
  });

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filterText]);

  if (!isOpen) return null;

  const replacePlaceholders = (rawContent: string) => {
    const contactName = chat?.contactName ? chat.contactName.split(' ')[0] : 'Cliente';
    const companyName = chat?.companyName || 'Sua Empresa';
    return rawContent
      .replace(/\{\{nome\}\}/gi, contactName)
      .replace(/\{\{empresa\}\}/gi, companyName);
  };

  const handleSelectItem = (item: QuickResponse) => {
    const processedText = replacePlaceholders(item.content);
    onSelect(processedText);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const isCampaignFilter = filterText.toLowerCase().startsWith('/c');

  return (
    <div 
      ref={popoverRef}
      onKeyDown={handleKeyDown}
      className="absolute bottom-16 left-4 bg-card border border-border rounded-2xl shadow-2xl w-80 md:w-96 max-h-80 flex flex-col z-40 overflow-hidden animate-in slide-in-from-bottom-2 text-card-foreground"
    >
      {/* Search Header */}
      <div className="p-2.5 bg-muted/40 border-b border-border flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-background border border-border rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={isCampaignFilter ? "Filtrando campanhas (/c)..." : "Filtrar respostas rápidas (/)..."}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {filterText && (
            <button onClick={() => setFilterText('')} className="text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
        >
          <X size={14} />
        </button>
      </div>

      {/* Category Hint Banner */}
      {isCampaignFilter && (
        <div className="bg-purple-500/10 border-b border-purple-500/20 px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
          <Megaphone size={13} />
          <span>Templates de Campanha Personalizados</span>
        </div>
      )}

      {/* List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isCampaign = item.shortcut.startsWith('/c');
            const processedPreview = replacePlaceholders(item.content);

            return (
              <div
                key={item.id || idx}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer space-y-1 ${
                  isSelected 
                    ? 'bg-primary/10 border-l-4 border-primary pl-3' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isCampaign ? (
                      <Megaphone size={13} className="text-purple-500 shrink-0" />
                    ) : (
                      <Zap size={13} className="text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-bold truncate text-foreground">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-primary bg-primary/10 font-mono px-1.5 py-0.5 rounded shrink-0">
                    {item.shortcut}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                  {processedPreview}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Nenhuma resposta encontrada</p>
            <p className="text-[11px]">Tente outra busca ou crie uma nova resposta rápida.</p>
          </div>
        )}
      </div>

      {/* Footer Add New Button */}
      <div className="p-2 border-t border-border bg-muted/20">
        <button
          onClick={() => {
            onClose();
            onOpenNewModal();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
        >
          <Plus size={14} />
          <span>Nova Resposta Rápida</span>
        </button>
      </div>
    </div>
  );
}
