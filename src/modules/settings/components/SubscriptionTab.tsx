import React from 'react';
import { CreditCard, CheckCircle, FileText, Download } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import toast from 'react-hot-toast';

export function SubscriptionTab() {
  return (
    <div className="space-y-6">
      {/* Active Plan Card */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-xl border border-primary/20 shadow-md p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary">Plano Ativo</Badge>
              <span className="text-xs text-muted-foreground">Renovação automática ativa</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">iContábil CRM Professional</h3>
            <p className="text-xs text-muted-foreground">Gerenciamento avançado de pipeline, contatos e integrações WhatsApp.</p>
          </div>

          <div className="text-right md:text-left space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Valor do plano</p>
            <p className="text-2xl font-extrabold text-foreground">
              R$ 299,00<span className="text-xs font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="text-xs text-success font-semibold flex items-center gap-1">
              <CheckCircle size={12} /> Próxima renovação em 15/08/2026
            </p>
          </div>
        </div>

        <div className="h-px bg-border my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Contatos / Leads</span>
              <span className="text-foreground font-bold">142 / 500 (28%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '28.4%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Usuários Operacionais</span>
              <span className="text-foreground font-bold">3 / 10 (30%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '30%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Armazenamento em Nuvem</span>
              <span className="text-foreground font-bold">2.4 GB / 20 GB (12%)</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '12%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="font-bold text-base text-foreground">Histórico de Cobrança</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Faturas e recibos anteriores do serviço contratado.</p>
        </div>

        <div className="divide-y divide-border">
          {[
            { invoiceId: 'INV-2026-003', date: '15 de Julho, 2026', amount: 'R$ 299,00', status: 'paga' },
            { invoiceId: 'INV-2026-002', date: '15 de Junho, 2026', amount: 'R$ 299,00', status: 'paga' },
            { invoiceId: 'INV-2026-001', date: '15 de Maio, 2026', amount: 'R$ 299,00', status: 'paga' },
          ].map((invoice) => (
            <div key={invoice.invoiceId} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{invoice.invoiceId}</p>
                  <p className="text-xs text-muted-foreground">{invoice.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm font-bold text-foreground">{invoice.amount}</span>
                <Badge variant="success">Paga</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toast.success(`Download da fatura ${invoice.invoiceId} iniciado!`)}
                >
                  <Download size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
