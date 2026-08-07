import React, { useState } from 'react';
import { X, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { whatsappService } from '../../services/whatsappService';
import toast from 'react-hot-toast';

interface NewQuickResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function NewQuickResponseModal({ isOpen, onClose, onCreated }: NewQuickResponseModalProps) {
  const { userData } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [shortcut, setShortcut] = useState('/');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Preencha o título e a mensagem.');
      return;
    }

    const formattedShortcut = shortcut.startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`;

    setSaving(true);
    try {
      await whatsappService.createQuickResponse(companyId, {
        shortcut: formattedShortcut,
        title: title.trim(),
        content: content.trim()
      });
      toast.success('Resposta rápida criada com sucesso!');
      setShortcut('/');
      setTitle('');
      setContent('');
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      toast.error('Erro ao salvar resposta rápida.');
    } finally {
      setSaving(false);
    }
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    setContent((prev) => prev + ` ${placeholder} `);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-card-foreground">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 font-bold">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Nova Resposta Rápida</h3>
              <p className="text-[11px] text-muted-foreground">Crie atalhos personalizados para atendimento</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Atalho (inicia com /)
            </label>
            <input
              type="text"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              placeholder="/minharesposta"
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Título da Resposta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Confirmação de Recebimento"
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                Conteúdo da Mensagem
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertPlaceholder('{{nome}}')}
                  className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-mono rounded hover:bg-primary/20 transition-colors"
                  title="Inserir nome do contato"
                >
                  + &#123;&#123;nome&#125;&#125;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertPlaceholder('{{empresa}}')}
                  className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono rounded hover:bg-purple-500/20 transition-colors"
                  title="Inserir empresa do contato"
                >
                  + &#123;&#123;empresa&#125;&#125;
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite a mensagem padrão... Use {{nome}} e {{empresa}} para dinamizar."
              className="w-full bg-muted/40 border border-border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              {saving ? 'Salvando...' : 'Criar Resposta Rápida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
