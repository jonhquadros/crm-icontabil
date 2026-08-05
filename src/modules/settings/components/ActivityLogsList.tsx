import React from 'react';
import { Sparkles, Clock, AlertTriangle, CheckCircle, User, Shield, Globe } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { cn } from '../../../shared/utils/cn';

interface ActivityLogsListProps {
  logs: AuditLogEntry[];
}

export function ActivityLogsList({ logs }: ActivityLogsListProps) {
  const defaultLogs: AuditLogEntry[] = [
    {
      id: '1',
      title: 'Status de Oportunidade alterado',
      description: "Oportunidade 'Silva & Santos Advogados' movida para Reunião de Fechamento.",
      time: 'há 10 minutos',
      type: 'updated',
      author: 'Administrador'
    },
    {
      id: '2',
      title: 'Integração Webhook Disparada',
      description: 'Webhook de novo lead integrado com sucesso com a plataforma de automação.',
      time: 'há 1 hora',
      type: 'integration',
      author: 'Sistema'
    },
    {
      id: '3',
      title: 'Perfil do Escritório Atualizado',
      description: 'Dados da empresa e e-mail corporativo salvos.',
      time: 'há 3 horas',
      type: 'updated',
      author: 'Administrador'
    },
    {
      id: '4',
      title: 'Instância de WhatsApp Conectada',
      description: 'Status da Evolution API validado com sucesso.',
      time: 'há 1 dia',
      type: 'integration',
      author: 'Sistema'
    },
    {
      id: '5',
      title: 'Políticas de Segurança Salvas',
      description: 'Timeout de sessão atualizado para 60 minutos.',
      time: 'há 2 dias',
      type: 'security',
      author: 'Administrador'
    }
  ];

  const displayLogs = logs.length > 0 ? logs : defaultLogs;

  const getIcon = (type: string) => {
    switch (type) {
      case 'integration':
        return { icon: Globe, color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' };
      case 'security':
        return { icon: Shield, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
      case 'created':
        return { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
      default:
        return { icon: Sparkles, color: 'bg-primary/10 text-primary' };
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/30">
        <h3 className="font-bold text-base text-foreground">Logs de Atividade e Rastreabilidade</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Histórico auditável das ações críticas realizadas no iContábil CRM.
        </p>
      </div>

      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {displayLogs.map((log, logIdx) => {
              const { icon: IconComponent, color } = getIcon(log.type);
              const isLast = logIdx === displayLogs.length - 1;

              return (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card",
                          color
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-bold text-foreground">{log.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{log.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <User size={10} /> por <span className="font-medium text-foreground">{log.author}</span>
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-muted-foreground">
                          <time>{log.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
