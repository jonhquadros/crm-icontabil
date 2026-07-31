import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import toast from 'react-hot-toast';
import { documentService } from '../services/documentService';
import { DocumentFolder } from '../types';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentFolder: DocumentFolder | null;
}

export function CreateFolderModal({ isOpen, onClose, companyId, currentFolder }: CreateFolderModalProps) {
  const [loading, setLoading] = useState(false);
  const [folderName, setFolderName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      toast.error('O nome da pasta é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await documentService.createFolder({
        companyId,
        parentId: currentFolder?.id || null,
        name: folderName.trim(),
        path: currentFolder ? `${currentFolder.path}/${folderName.trim()}` : `/${folderName.trim()}`
      });
      toast.success('Pasta criada com sucesso!');
      setFolderName('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar pasta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Pasta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome da Pasta</label>
          <Input 
            autoFocus
            placeholder="Ex: Contratos 2024" 
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" loading={loading}>Criar Pasta</Button>
        </div>
      </form>
    </Modal>
  );
}
