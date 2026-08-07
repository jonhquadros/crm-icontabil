import React, { useState } from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import { Chat } from '../../types';
import { taskService } from '../../../tasks/services/taskService';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { CheckCircle2, Loader2, User } from 'lucide-react';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onTaskCreated?: () => void;
  initialTitle?: string;
}

export function QuickTaskModal({ isOpen, onClose, chat, onTaskCreated, initialTitle }: QuickTaskModalProps) {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [title, setTitle] = useState(initialTitle || '');
  const [assignedTo, setAssignedTo] = useState(userData?.name || 'Atendente');

  React.useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await taskService.createTask({
        companyId,
        title: `${title} — ${chat.contactName}`,
        description: `Criado no WhatsApp para ${chat.contactName} (${chat.companyName || chat.contactPhone})`,
        dueDate: dueDate as any,
        status: 'todo',
        priority,
        assignedTo,
        category: 'WhatsApp',
        clientId: chat.clientId || undefined,
        createdBy: user?.uid || 'user_demo',
      } as any);

      setShowSuccess(true);
      if (onTaskCreated) onTaskCreated();
      
      setTimeout(() => {
        setShowSuccess(false);
        setTitle('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error creating quick task:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Nova Tarefa — ${chat.contactName} ${chat.companyName ? `(${chat.companyName})` : ''}`}
    >
      {showSuccess ? (
        <div className="py-8 text-center space-y-3 animate-in fade-in">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 animate-bounce" />
          <h4 className="text-base font-bold text-foreground">Tarefa Criada com Sucesso!</h4>
          <p className="text-xs text-muted-foreground">Vinculada à conta de {chat.contactName}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Título da Tarefa</label>
            <input
              type="text"
              required
              placeholder="Ex: Enviar balancete do mês, solicitar documentos..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <User size={13} /> Responsável
              </label>
              <input
                type="text"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Prazo</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Prioridade</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Baixa', color: 'border-blue-500/40 text-blue-600 bg-blue-500/10' },
                { id: 'medium', label: 'Média', color: 'border-amber-500/40 text-amber-600 bg-amber-500/10' },
                { id: 'high', label: 'Alta', color: 'border-red-500/40 text-red-600 bg-red-500/10' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as any)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    priority === p.id 
                      ? `${p.color} ring-2 ring-primary/20 shadow-2xs` 
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  ● {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="text-xs gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Criar Tarefa ✓</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
