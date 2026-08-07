import toast from 'react-hot-toast';
import React from 'react';

/**
 * Service to handle Audio Chimes, Browser Push Notifications, and Discrete Toasts
 */

export const notificationService = {
  /**
   * Request browser notification permission
   */
  requestPushPermission: async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          toast.success('Notificações de navegador ativadas! 🔔');
        }
      }
    }
  },

  /**
   * Plays a crisp dual-tone notification chime using Web Audio API
   */
  playSound: () => {
    if (typeof window === 'undefined') return;

    const isMuted = localStorage.getItem('icontabil_sound_muted') === 'true';
    if (isMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: High crisp bell (659.25Hz - E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Note 2: Harmonic response (987.77Hz - B5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('Could not play notification audio tone:', err);
    }
  },

  /**
   * Triggers a system browser push notification if tab is hidden
   */
  sendPushNotification: (title: string, body: string, onClick?: () => void) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const pushDisabled = localStorage.getItem('icontabil_push_disabled') === 'true';
    if (pushDisabled) return;

    if (Notification.permission === 'granted' && document.hidden) {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });

        notification.onclick = () => {
          window.focus();
          if (onClick) onClick();
          notification.close();
        };
      } catch (err) {
        console.warn('Push notification error:', err);
      }
    }
  },

  /**
   * Displays a discrete toast notification at the bottom right corner
   */
  showToast: (
    contactName: string,
    messageText: string,
    onOpenChat?: () => void
  ) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-in slide-in-from-bottom-5 fade-in duration-200' : 'animate-out fade-out duration-150'
          } max-w-xs w-full bg-card border border-border shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 pointer-events-auto text-xs`}
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
            {contactName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-foreground truncate">{contactName}</p>
              <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded">Agora</span>
            </div>
            <p className="text-muted-foreground truncate font-medium text-[11px] leading-tight">
              "{messageText}"
            </p>

            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (onOpenChat) onOpenChat();
              }}
              className="mt-1 text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver conversa →
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'bottom-right'
      }
    );
  },

  /**
   * Complete helper when a new incoming message arrives
   */
  notifyIncomingMessage: (
    contactName: string,
    messageText: string,
    onOpenChat?: () => void
  ) => {
    notificationService.playSound();
    notificationService.showToast(contactName, messageText, onOpenChat);
    notificationService.sendPushNotification(contactName, messageText, onOpenChat);
  }
};
