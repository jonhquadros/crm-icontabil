import React, { useState } from 'react';
import { 
  MessageSquare, 
  Zap, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  QrCode, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Eye, 
  EyeOff,
  Phone,
  Radio
} from 'lucide-react';
import { EvolutionConfig } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { QRCodeModal } from './QRCodeModal';
import { useEvolution } from '../hooks/useEvolution';

interface EvolutionConfigCardProps {
  // Can be embedded in Settings Page
}

export function EvolutionConfigCard() {
  const [showApiKey, setShowApiKey] = useState(false);
  const {
    loading,
    config,
    setConfig,
    showQrModal,
    setShowQrModal,
    handleSaveConfig,
    handleTestConnection,
    handleConnect,
    handleDisconnect,
    handleReconnect,
    handleRefreshQrCode,
    handleCheckStatus,
  } = useEvolution();

  const getStatusBadge = (status: EvolutionConfig['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Conectado (Online)</Badge>;
      case 'connecting':
        return <Badge variant="warning">Conectando...</Badge>;
      case 'qr_code':
        return <Badge variant="warning">Aguardando QR Code</Badge>;
      case 'error':
        return <Badge variant="danger">Erro de Conexão</Badge>;
      default:
        return <Badge variant="default">Desconectado</Badge>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveConfig(config);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              Integração Evolution API (WhatsApp Multi-device)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte a API de WhatsApp corporativo do escritório para envio de mensagens, lembretes e automações.
            </p>
          </div>
        </div>
        <div>
          {getStatusBadge(config.status)}
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">URL da API (Evolution Host)</label>
            <Input
              placeholder="https://api.suaevolution.com"
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">API Key (Autenticação)</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="••••••••••••••••••••"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nome da Instância</label>
            <Input
              placeholder="icontabil-session"
              value={config.instanceName}
              onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Número Conectado (Padrão)</label>
            <Input
              icon={<Phone size={18} />}
              placeholder="(91) 98402-7568"
              value={config.connectedPhone}
              onChange={(e) => setConfig({ ...config, connectedPhone: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">URL do Webhook (Eventos Recebidos)</label>
            <Input
              placeholder="https://sua-empresa.com.br/api/webhooks/evolution"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              className="gap-2 text-xs"
            >
              <Zap size={14} className="text-amber-500" />
              Testar Conexão
            </Button>

            {config.status === 'disconnected' ? (
              <Button
                type="button"
                size="sm"
                onClick={handleConnect}
                isLoading={loading}
                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Wifi size={14} /> Conectar Instância
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                isLoading={loading}
                className="gap-2 text-xs text-red-600 hover:bg-red-500/10"
              >
                <WifiOff size={14} /> Desconectar
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              isLoading={loading}
              className="gap-2 text-xs"
            >
              <RefreshCw size={14} /> Reconectar
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="gap-2 text-xs"
            >
              <QrCode size={14} /> Gerar QR Code
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckStatus}
              className="gap-2 text-xs"
            >
              <Radio size={14} /> Ver Status
            </Button>
          </div>

          <Button type="submit" isLoading={loading} className="gap-2 text-xs">
            <Save size={14} /> Salvar Parâmetros
          </Button>
        </div>
      </form>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrCodeUrl={config.qrCodeUrl}
        instanceName={config.instanceName}
        onRefreshQrCode={handleRefreshQrCode}
        isLoading={loading}
      />
    </div>
  );
}
