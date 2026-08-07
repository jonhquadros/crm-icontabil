import React, { useState } from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import { Chat } from '../../types';
import { taskService } from '../../../tasks/services/taskService';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { CheckCircle2, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface QuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onEventCreated?: () => void;
  initialTitle?: string;
}

export function QuickEventModal({ isOpen, onClose, chat, onEventCreated, initialTitle }: QuickEventModalProps) {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [title, setTitle] = useState(initialTitle || '');

  React.useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState('Reunião');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSaving(true);
    try {
      await taskService.createTask({
        companyId,
        title: `[${type}] ${title} — ${chat.contactName}`,
        description: `Agendamento: ${note || 'Agendado via WhatsApp'}\nContato: ${chat.contactName} (${chat.contactPhone})`,
        dueDate: `${date}T${time}:00` as any,
        status: 'todo',
        priority: 'medium',
        assignedTo: userData?.name || 'Atendente',
        category: 'Compromisso',
        clientId: chat.clientId || undefined,
        createdBy: user?.uid || 'user_demo',
      } as any);

      setShowSuccess(true);
      if (onEventCreated) onEventCreated();

      setTimeout(() => {
        setShowSuccess(false);
        setTitle('');
        setNote('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Novo Compromisso — ${chat.contactName}`}
    >
      {showSuccess ? (
        <div className="py-8 text-center space-y-3 animate-in fade-in">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 animate-bounce" />
          <h4 className="text-base font-bold text-foreground">Compromisso Agendado com Sucesso!</h4>
          <p className="text-xs text-muted-foreground">{type} marcada para {date} às {time}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Título do Compromisso</label>
            <input
              type="text"
              required
              placeholder="Ex: Reunião sobre alteração contratual, alinhamento fiscal..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <CalendarIcon size={13} /> Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Clock size={13} /> Hora
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Tipo de Agendamento</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="Reunião">Reunião presencial ou online</option>
              <option value="Ligação">Ligação / Phone Call</option>
              <option value="Follow-up">Follow-up comercial</option>
              <option value="Visita">Visita Técnica</option>
              <option value="Prazo Fiscal">Prazo Fiscal</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Observações / Notas</label>
            <textarea
              rows={2}
              placeholder="Notas adicionais sobre a pauta ou link da chamada..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="text-xs gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Salvar Compromisso ✓</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
