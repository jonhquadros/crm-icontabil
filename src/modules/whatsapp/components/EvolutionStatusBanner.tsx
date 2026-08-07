import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  QrCode, 
  ChevronDown, 
  Settings, 
  Phone, 
  X, 
  CheckCircle2, 
  ShieldAlert,
  Zap,
  Sliders,
  Check
} from 'lucide-react';
import { useEvolution } from '../hooks/useEvolution';
import toast from 'react-hot-toast';
import { cn } from '../../../shared/utils/cn';

interface InstanceOption {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'disconnected';
}

const SAMPLE_INSTANCES: InstanceOption[] = [
  { id: '1', name: 'iContábil Principal', phone: '(91) 98402-7568', status: 'connected' },
  { id: '2', name: 'Atendimento Comercial', phone: '(91) 98112-4400', status: 'connected' },
  { id: '3', name: 'Suporte Fiscal & DP', phone: '(91) 99345-1212', status: 'disconnected' },
];

export function EvolutionStatusBanner() {
  const {
    loading,
    config,
    setConfig,
    showQrModal,
    setShowQrModal,
    handleConnect,
    handleDisconnect,
    handleReconnect,
    handleRefreshQrCode,
    handleCheckStatus,
    refetch
  } = useEvolution();

  const [selectedInstance, setSelectedInstance] = useState<InstanceOption>(SAMPLE_INSTANCES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(45);

  // Status can be controlled by current config or simulated toggle
  const isConnected = config.status === 'connected';

  // 45s Timer for QR Code expiry
  useEffect(() => {
    if (!showQrModal) {
      setQrCountdown(45);
      return;
    }

    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          handleRefreshQrCode();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQrModal]);

  // Polling every 5 seconds when QR Modal is open or connecting
  useEffect(() => {
    if (!showQrModal && config.status !== 'connecting' && config.status !== 'qr_code') return;

    const pollInterval = setInterval(async () => {
      // Simulate/Check if connected
      const res = await handleCheckStatus();
      if (config.status === 'connected') {
        setShowQrModal(false);
        toast.success('WhatsApp conectado! ✅');
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [showQrModal, config.status]);

  const handleSimulateConnection = () => {
    setConfig(prev => ({ ...prev, status: 'connected' }));
    setShowQrModal(false);
    toast.success('WhatsApp conectado! ✅');
  };

  return (
    <>
      {/* Top Banner Bar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between text-xs shrink-0 select-none">
        {/* Left: Instance Status Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          {isConnected ? (
            <div className="flex items-center gap-2 font-medium min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-extrabold text-foreground truncate">
                {config.connectedPhone || selectedInstance.phone}
              </span>
              <span className="text-muted-foreground font-normal shrink-0">
                — {selectedInstance.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-bold text-destructive min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
              </span>
              <span>🔴 WhatsApp desconectado</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <>
              {/* Instance selector dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 font-bold text-foreground bg-muted/70 hover:bg-muted border border-border/70 rounded-lg transition-colors shadow-2xs"
                >
                  <Phone size={13} className="text-emerald-500" />
                  <span>Trocar Instância</span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                    <div className="px-3 py-1 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1">
                      Instâncias Conectadas
                    </div>
                    {SAMPLE_INSTANCES.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => {
                          setSelectedInstance(inst);
                          setConfig(prev => ({
                            ...prev,
                            connectedPhone: inst.phone,
                            status: inst.status
                          }));
                          setIsDropdownOpen(false);
                          toast.success(`Alternado para: ${inst.name}`);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-muted transition-colors text-xs",
                          selectedInstance.id === inst.id && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{inst.name}</p>
                          <p className="text-[10px] text-muted-foreground">{inst.phone}</p>
                        </div>
                        {inst.status === 'connected' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsManageModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/60 rounded-lg transition-colors shadow-2xs"
              >
                <Settings size={13} />
                <span>Gerenciar</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  await handleReconnect();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1 font-bold text-foreground bg-muted hover:bg-muted/80 border border-border/80 rounded-lg transition-colors shadow-2xs"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Reconectar</span>
              </button>

              <button
                onClick={async () => {
                  await handleConnect();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
              >
                <QrCode size={13} />
                <span>Ver QR Code</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal Inline: Ver QR Code */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <QrCode size={18} />
                </div>
                <h3 className="font-extrabold text-sm text-foreground">Reconectar WhatsApp</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Image Box */}
            <div className="text-center space-y-3">
              <div 
                onClick={handleSimulateConnection}
                title="Clique aqui para simular a leitura do QR Code"
                className="p-3 bg-white rounded-2xl border border-border shadow-inner inline-block mx-auto cursor-pointer hover:scale-102 transition-transform"
              >
                {config.qrCodeUrl ? (
                  <img
                    src={config.qrCodeUrl}
                    alt="QR Code Evolution API"
                    className="w-48 h-48 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <RefreshCw size={24} className="animate-spin text-primary" />
                    <span className="text-xs font-semibold">Gerando QR Code...</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-left bg-muted/30 p-3 rounded-xl border border-border/60 text-xs space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">Instruções no celular:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-relaxed">
                  <li>Abra o WhatsApp no celular</li>
                  <li>Toque em <strong className="text-foreground">⋮ (Menu)</strong> → <strong className="text-foreground">Aparelhos Conectados</strong></li>
                  <li>Aponte a câmera para o QR Code acima</li>
                </ol>
              </div>
            </div>

            {/* Expiry Bar & Actions */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setQrCountdown(45);
                  handleRefreshQrCode();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Atualizar QR</span>
              </button>

              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                Expira em: <strong className="text-foreground">{qrCountdown}s ⏱</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inline: Gerenciar Instâncias */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-primary" />
                <h3 className="font-extrabold text-sm text-foreground">Gerenciar Instâncias Evolution API</h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {SAMPLE_INSTANCES.map((inst) => (
                <div key={inst.id} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-foreground">{inst.name}</p>
                    <p className="text-muted-foreground text-[11px]">{inst.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inst.status === 'connected' ? (
                      <button
                        onClick={handleDisconnect}
                        className="px-2.5 py-1 text-[11px] font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors"
                      >
                        Desconectar
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setIsManageModalOpen(false);
                          await handleConnect();
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Conectar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
