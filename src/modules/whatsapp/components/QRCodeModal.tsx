import React from 'react';
import { X, RefreshCw, QrCode, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl?: string;
  instanceName: string;
  onRefreshQrCode: () => void;
  isLoading: boolean;
}

export function QRCodeModal({
  isOpen,
  onClose,
  qrCodeUrl,
  instanceName,
  onRefreshQrCode,
  isLoading
}: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Conectar WhatsApp Web</h3>
              <p className="text-xs text-muted-foreground">Instância: {instanceName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Abra o WhatsApp no seu celular, vá em <strong className="text-foreground">Dispositivos Conectados</strong> &gt; <strong className="text-foreground">Conectar Dispositivo</strong> e aponte a câmera para o QR Code abaixo:
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto relative group">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code Evolution API" 
                className="w-56 h-56 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <RefreshCw size={32} className="animate-spin text-primary" />
                <span className="text-xs">Gerando QR Code...</span>
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-left flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p>O QR Code expira automaticamente a cada 45 segundos por motivos de segurança.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshQrCode} 
            isLoading={isLoading}
            className="gap-2 text-xs"
          >
            <RefreshCw size={14} /> Atualizar QR Code
          </Button>

          <Button size="sm" onClick={onClose} className="text-xs">
            Concluído
          </Button>
        </div>
      </div>
    </div>
  );
}
