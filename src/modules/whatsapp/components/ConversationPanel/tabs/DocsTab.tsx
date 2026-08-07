import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Send, 
  Download, 
  FileCheck, 
  File, 
  Image as ImageIcon, 
  Loader2,
  Plus
} from 'lucide-react';
import { Chat } from '../../../types';
import { DocumentFile } from '../../../../documents/types';
import { documentService } from '../../../../documents/services/documentService';
import { useAuth } from '../../../../../app/providers/AuthProvider';
import { Button } from '../../../../../shared/components/ui/Button';

interface DocsTabProps {
  chat: Chat;
  onSendDocumentToChat?: (fileUrl: string, fileName: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'contrato', label: 'Contratos' },
  { id: 'pessoal', label: 'Pessoais' },
  { id: 'empresarial', label: 'Empresariais' },
  { id: 'nota', label: 'Notas' },
  { id: 'other', label: 'Outros' },
];

export function DocsTab({ chat, onSendDocumentToChat }: DocsTabProps) {
  const { userData, user } = useAuth();
  const companyId = userData?.companyId || 'empresa_demo';

  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Subscribe to documents in this company
    const unsubscribe = documentService.subscribeToFiles(companyId, null, (docList) => {
      // Filter documents belonging to this contact/client
      const filtered = docList.filter(d => {
        if (chat.clientId && (d as any).clientId === chat.clientId) return true;
        if (d.name?.toLowerCase().includes(chat.contactName.toLowerCase())) return true;
        if (chat.companyName && d.name?.toLowerCase().includes(chat.companyName.toLowerCase())) return true;
        return true; // Show company docs available
      });
      setFiles(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId, chat.clientId, chat.contactName, chat.companyName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await documentService.uploadFile(
        file,
        companyId,
        null,
        user?.uid || 'user_demo',
        null
      );
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert(err.message || 'Erro ao enviar documento.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredFiles = files.filter(f => {
    if (selectedCategory === 'all') return true;
    return (f.category || 'other').toLowerCase() === selectedCategory;
  });

  const getFileIcon = (type?: string, name?: string) => {
    if (type?.includes('image') || name?.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return <ImageIcon size={15} className="text-purple-500 shrink-0" />;
    }
    if (type?.includes('pdf') || name?.endsWith('.pdf')) {
      return <FileCheck size={15} className="text-red-500 shrink-0" />;
    }
    return <File size={15} className="text-blue-500 shrink-0" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Upload Trigger */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <FileText size={12} /> Documentos do Cliente
        </label>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          <span>Upload</span>
        </Button>
      </div>

      {/* Categories Horizontal Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Files List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-6 text-muted-foreground space-y-2">
          <Loader2 size={20} className="animate-spin text-primary" />
          <span className="text-xs">Carregando documentos...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-6 text-center bg-muted/20 rounded-xl border border-dashed border-border space-y-2">
          <FileText size={28} className="mx-auto text-muted-foreground/60" />
          <p className="text-xs font-semibold text-muted-foreground">Nenhum documento encontrado</p>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-7 gap-1"
          >
            <Plus size={12} />
            <span>Upload de Documento</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredFiles.map((file) => (
            <div 
              key={file.id} 
              className="p-2.5 bg-card border border-border rounded-xl flex items-center justify-between gap-2 text-xs hover:border-primary/40 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file.type, file.name)}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate leading-tight">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Send via WhatsApp button */}
                {onSendDocumentToChat && file.url && (
                  <button
                    onClick={() => onSendDocumentToChat(file.url, file.name)}
                    title="Enviar via WhatsApp"
                    className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Send size={13} />
                  </button>
                )}
                {/* Download / Open Link */}
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Baixar Documento"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Download size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
