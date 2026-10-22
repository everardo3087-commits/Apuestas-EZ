import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, ShieldCheck, Play, X, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import { NotificationConfig, notificationService, SurebetAlertLog } from '../utils/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NotificationConfig;
  onConfigChange: (newConfig: NotificationConfig) => void;
  recentAlerts: SurebetAlertLog[];
  onSelectSurebetTab: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  recentAlerts,
  onSelectSurebetTab,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (notificationService.isSupported()) {
      setPermission(notificationService.getPermission());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const perm = await notificationService.requestPermission();
    setPermission(perm);
    setIsRequesting(false);
    if (perm === 'granted') {
      onConfigChange({ ...config, enabled: true });
    }
  };

  const handleTest = () => {
    notificationService.testNotification(config, () => {
      onSelectSurebetTab();
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative my-8">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Alertas de Surebets en Segundo Plano</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Notificaciones del navegador cuando surja un arbitraje deportivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Permission Status Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Permiso del Sistema:</div>
              <div className="flex items-center gap-2 mt-1">
                {permission === 'granted' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Notificaciones del Navegador Habilitadas</span>
                  </span>
                ) : permission === 'denied' ? (
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Bloqueadas en la configuración del navegador</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Permiso pendiente de confirmación</span>
                  </span>
                )}
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {isRequesting ? 'Solicitando...' : 'Habilitar Notificaciones'}
              </button>
            )}
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-white text-xs">Activar Sistema de Alertas</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Emitir notificación cada vez que una surebet supere el umbral fijado
              </div>
            </div>

            <button
              onClick={() => onConfigChange({ ...config, enabled: !config.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.enabled ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Threshold Slider */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-white text-xs block">Umbral de Beneficio Mínimo:</label>
                <span className="text-slate-400 text-[11px]">
                  Solo notificar surebets con rendimiento garantizado mayor o igual a este porcentaje
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  ≥ {config.minProfitThreshold.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="pt-2">
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={config.minProfitThreshold}
                onChange={(e) =>
                  onConfigChange({ ...config, minProfitThreshold: parseFloat(e.target.value) || 1.0 })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.5% (Más frecuente)</span>
                <span>2.0% (Recomendado)</span>
                <span>6.0% (Oportunidades Top)</span>
              </div>
            </div>
          </div>

          {/* Audio Chime & Background Only Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Sonido Acústico</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Chime armónico Web Audio</div>
              </div>

              <button
                onClick={() => onConfigChange({ ...config, soundEnabled: !config.soundEnabled })}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  config.soundEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    config.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Solo Segundo Plano</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Al estar en otra pestaña</div>
              </div>

              <button
                onClick={() => onConfigChange({ ...config, backgroundOnly: !config.backgroundOnly })}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  config.backgroundOnly ? 'bg-cyan-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    config.backgroundOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTest}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Probar Notificación y Sonido</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              Guardar y Cerrar
            </button>
          </div>

          {/* Recent Alerts Feed in Modal */}
          {recentAlerts.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Últimas Alertas Emitidas:
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {recentAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{alert.matchTitle}</span>
                      <span className="text-[11px] text-slate-500 ml-2">
                        {new Date(alert.timestamp).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      +{alert.profitPct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
