/**
 * Browser Notification & Audio Chime Service for Surebet Alerts
 * Supports background notifications, Web Audio chimes, and in-app fallback.
 */

export interface NotificationConfig {
  enabled: boolean;
  minProfitThreshold: number; // e.g. 1.5%
  soundEnabled: boolean;
  backgroundOnly: boolean; // only trigger if document.hidden
}

export interface SurebetAlertLog {
  id: string;
  timestamp: string;
  matchTitle: string;
  profitPct: number;
  legs: { selection: string; bookmaker: string; odds: number }[];
  read: boolean;
}

class NotificationService {
  private notifiedSurebetIds = new Set<string>();
  private audioCtx: AudioContext | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public playChime() {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioCtxClass();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Two-tone chime: 587.33 Hz (D5) -> 880 Hz (A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
    } catch (err) {
      console.warn('Audio chime unavailable:', err);
    }
  }

  public notifySurebet(
    matchTitle: string,
    profitPct: number,
    legs: { selection: string; bookmaker: string; odds: number }[],
    config: NotificationConfig,
    onNotificationClick?: () => void
  ): boolean {
    if (!config.enabled) return false;
    if (profitPct < config.minProfitThreshold) return false;

    // Check if background-only is requested
    const isBackground = typeof document !== 'undefined' && document.hidden;
    if (config.backgroundOnly && !isBackground) {
      // In foreground and user only wants notifications when tab is hidden
      return false;
    }

    // Play subtle audio alert if enabled
    if (config.soundEnabled) {
      this.playChime();
    }

    // Trigger System Notification if permitted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const bodyText = `Rendimiento: +${profitPct.toFixed(2)}% | ${legs.map((l) => `${l.bookmaker}: ${l.odds.toFixed(2)}`).join(' · ')}`;
        const notification = new Notification(`🎯 ¡Surebet Detectada! (+${profitPct}%)`, {
          body: `${matchTitle}\n${bodyText}`,
          icon: '/favicon.ico',
          tag: `surebet-${matchTitle}-${profitPct}`, // group notifications
          silent: !config.soundEnabled, // avoid double sound if browser handles it
        });

        notification.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
          if (onNotificationClick) {
            onNotificationClick();
          }
          notification.close();
        };

        return true;
      } catch (err) {
        console.warn('System notification error, fallback to chime/in-app toast:', err);
      }
    }

    return false;
  }

  public testNotification(config: NotificationConfig, onNotificationClick?: () => void) {
    if (config.soundEnabled) {
      this.playChime();
    }

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notification = new Notification('🔔 Prueba de Notificación de Surebets', {
          body: 'El sistema de alertas en segundo plano está activo y calibrado.',
          tag: 'surebet-test',
        });
        notification.onclick = () => {
          if (typeof window !== 'undefined') window.focus();
          if (onNotificationClick) onNotificationClick();
          notification.close();
        };
      } catch (err) {
        console.warn('Test notification error:', err);
      }
    }
  }
}

export const notificationService = new NotificationService();
