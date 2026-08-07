import React, { useEffect } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';

interface AudioRecorderBarProps {
  timer: number; // seconds
  onCancel: () => void;
  onSend: () => void;
}

export function AudioRecorderBar({ timer, onCancel, onSend }: AudioRecorderBarProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Max 5 minutes = 300 seconds limit
  const isNearLimit = timer >= 270; // last 30s warning

  return (
    <div className="flex items-center justify-between gap-3 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 px-4 py-2.5 rounded-full animate-in fade-in duration-200">
      {/* Live Recording Pulsing Dot & Timer */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
        </span>
        <span className={`text-xs font-mono font-bold ${isNearLimit ? 'text-red-600 animate-bounce' : 'text-foreground'}`}>
          {formatTime(timer)}
        </span>
      </div>

      {/* Animated Waveform Visualizer Bar (4.5) */}
      <div className="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden px-2">
        {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85, 30, 65].map((height, i) => (
          <div
            key={i}
            className="w-1 bg-red-500 rounded-full transition-all duration-150"
            style={{
              height: `${Math.max(20, (height * (1 + Math.sin((timer * 2) + i))) % 100)}%`,
              opacity: 0.6 + (i % 3) * 0.15
            }}
          />
        ))}
      </div>

      {/* Controls: Cancel & Send */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          title="Cancelar Gravação"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-full hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={15} />
          <span className="hidden sm:inline">Cancelar</span>
        </button>

        <button
          type="button"
          onClick={onSend}
          title="Enviar Áudio Gravação"
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors shadow-md active:scale-95"
        >
          <Send size={14} />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
}
