import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Mail, Copy, Check, MessageSquare, ExternalLink, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export function InviteModal({ isOpen, onClose, userEmail, userName, userPhone }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/login?invite=${encodeURIComponent(userEmail)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link de convite copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Convite de Acesso ao CRM');
    const body = encodeURIComponent(
      `Olá ${userName || 'Usuário'},\n\n` +
      `Você foi convidado a acessar o sistema CRM.\n` +
      `Para aceitar o convite e definir sua senha, acesse o link abaixo:\n\n` +
      `${inviteLink}\n\n` +
      `Atenciosamente,\nEquipe CRM`
    );
    window.open(`mailto:${userEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = userPhone?.replace(/\D/g, '') || '';
    const text = encodeURIComponent(
      `Olá ${userName || ''}! Você foi convidado para o nosso CRM.\n\nAcesse seu link de convite: ${inviteLink}`
    );
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convite de Acesso">
      <div className="space-y-5">
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Convite Ativo / Reenviado</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              O registro do convite para <strong className="text-foreground">{userEmail}</strong> foi atualizado. Utilize os canais abaixo para enviar o link direto.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Link Único de Convite</label>
          <div className="flex gap-2">
            <Input 
              value={inviteLink} 
              readOnly 
              className="bg-muted/40 font-mono text-xs select-all"
            />
            <Button 
              type="button" 
              onClick={handleCopy} 
              variant={copied ? 'success' : 'primary'}
              className="shrink-0 gap-1.5"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-muted-foreground uppercase">Opções de Envio Direto</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleSendEmail}
              className="flex items-center justify-center gap-2 p-3 bg-card border border-border hover:border-primary/50 hover:bg-muted/50 rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm"
            >
              <Send size={16} className="text-primary" />
              Abrir Cliente de E-mail
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-2 p-3 bg-card border border-border hover:border-success/50 hover:bg-success/5 rounded-xl text-xs font-semibold text-foreground transition-all shadow-sm"
            >
              <MessageSquare size={16} className="text-success" />
              Enviar via WhatsApp
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-border mt-4">
          <Button onClick={onClose}>Concluir</Button>
        </div>
      </div>
    </Modal>
  );
}
