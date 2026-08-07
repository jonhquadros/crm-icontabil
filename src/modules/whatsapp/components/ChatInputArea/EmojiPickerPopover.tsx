import React, { useState, useRef, useEffect } from 'react';
import { Smile, Briefcase, Hand, Sparkles, Heart } from 'lucide-react';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'faces',
    name: 'Carinhas',
    icon: Smile,
    emojis: ['😊', '😂', '🤣', '😍', '🥰', '😎', '😇', '🤔', '😅', '🥳', '😃', '😉', '🙃', '😌', '🤩', '😷', '🤝', '🤝']
  },
  {
    id: 'gestures',
    name: 'Gestos',
    icon: Hand,
    emojis: ['👍', '👏', '🙏', '🙌', '🤝', '👊', '✌️', '👌', '💪', '✍️', '👋', '🤟', '🤙', '🖐️', '️❤️', '🔥', '⭐', '✨']
  },
  {
    id: 'work',
    name: 'Negócios',
    icon: Briefcase,
    emojis: ['💼', '📊', '📈', '📁', '📄', '✉️', '🗓️', '📌', '🚀', '💡', '✅', '💰', '💳', '🧾', '⌛', '📍', '🏛️', '⚖️']
  }
];

export function EmojiPickerPopover({ isOpen, onClose, onSelectEmoji }: EmojiPickerPopoverProps) {
  const [activeTab, setActiveTab] = useState('faces');
  const popoverRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div 
      ref={popoverRef}
      className="absolute bottom-16 left-24 bg-card border border-border rounded-2xl shadow-xl w-72 p-3 z-30 animate-in slide-in-from-bottom-2 text-card-foreground select-none"
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2 mb-2">
        {EMOJI_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === cat.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Emojis */}
      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1">
        {currentCategory.emojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-xl text-lg transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
