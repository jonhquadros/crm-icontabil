import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  FilePlus,
  Search, 
  Grid, 
  List, 
  MoreVertical, 
  Folder, 
  FileText, 
  FileCode, 
  FileImage, 
  File as FileIcon,
  ChevronRight,
  Download,
  Trash2,
  HardDrive
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { DocumentFile, DocumentFolder } from '../types';
import { Button } from '../../../shared/components/ui/Button';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { cn } from '../../../shared/utils/cn';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function DocumentsPage() {
  const { userData } = useAuth();
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'file' | 'folder' | null;
    id: string | null;
    name: string;
    loading: boolean;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: '',
    loading: false
  });

  // Breadcrumbs state
  const [breadcrumbs, setBreadcrumbs] = useState<DocumentFolder[]>([]);

  useEffect(() => {
    if (!userData?.companyId) return;

    const parentId = currentFolder?.id || null;

    const unsubFolders = documentService.subscribeToFolders(userData.companyId, parentId, (data) => {
      setFolders(data);
      setLoading(false);
    });

    const unsubFiles = documentService.subscribeToFiles(userData.companyId, parentId, (data) => {
      setFiles(data);
    });

    return () => {
      unsubFolders();
      unsubFiles();
    };
  }, [userData?.companyId, currentFolder?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userData?.companyId) {
      toast.error('Empresa não identificada para upload');
      return;
    }

    if (file.size > 10485760) {
      toast.error('O arquivo excede o limite máximo de 10MB.');
      return;
    }

    const toastId = toast.loading('Fazendo upload do arquivo...');
    try {
      await documentService.uploadFile(
        file, 
        userData.companyId, 
        currentFolder?.id || null,
        userData.id
      );
      toast.success('Upload concluído com sucesso!', { id: toastId });
      e.target.value = '';
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message?.replace('Upload failed: ', '') || 'Erro no upload';
      toast.error(errorMessage, { id: toastId });
    }
  };

  const navigateToFolder = (folder: DocumentFolder | null) => {
    if (folder === null) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      setCurrentFolder(folder);
      // Simple breadcrumb logic for demo (would need parent tracking for real depth)
      setBreadcrumbs(prev => [...prev, folder]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setDeleteConfirmState({
      isOpen: true,
      type: 'file',
      id: fileId,
      name: fileName,
      loading: false
    });
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setDeleteConfirmState({
      isOpen: true,
      type: 'folder',
      id: folderId,
      name: folderName,
      loading: false
    });
  };

  const executeDelete = async () => {
    const { type, id } = deleteConfirmState;
    if (!id || !type) return;

    setDeleteConfirmState(prev => ({ ...prev, loading: true }));
    try {
      if (type === 'file') {
        await documentService.deleteFile(id);
        toast.success('Arquivo excluído com sucesso');
      } else {
        await documentService.deleteFolder(id);
        toast.success('Pasta excluída com sucesso');
      }
      setDeleteConfirmState({
        isOpen: false,
        type: null,
        id: null,
        name: '',
        loading: false
      });
    } catch (error: any) {
      console.error(error);
      toast.error(type === 'file' ? 'Erro ao excluir arquivo' : 'Erro ao excluir pasta');
      setDeleteConfirmState(prev => ({ ...prev, loading: false }));
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="text-danger" />;
    if (type.includes('image')) return <FileImage className="text-primary" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileCode className="text-success" />;
    return <FileIcon className="text-muted-foreground" />;
  };

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documentos e Arquivos</h2>
          <p className="text-muted-foreground text-sm">Gerencie documentos dos clientes e do escritório.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsCreateFolderOpen(true)}>
            <FolderPlus size={18} />
            Nova Pasta
          </Button>
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileUpload} />
            <div className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-hover transition-colors font-medium text-sm shadow-sm">
              <FilePlus size={18} />
              Upload
            </div>
          </label>
        </div>
      </div>

      {/* Breadcrumbs & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-2 rounded-xl border border-border">
        <div className="flex items-center gap-2 px-2 overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => navigateToFolder(null)}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Meus Arquivos
          </button>
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} className="text-muted-foreground" />
              <button 
                onClick={() => {
                  // Pop breadcrumbs up to this folder
                  const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
                  setBreadcrumbs(newBreadcrumbs);
                  setCurrentFolder(folder);
                }}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-4 px-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Buscar arquivos..." 
              className="bg-muted/50 border border-border rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded", viewMode === 'grid' && "bg-background shadow-sm")}
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded", viewMode === 'list' && "bg-background shadow-sm")}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-square bg-muted/20 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (filteredFolders.length === 0 && filteredFiles.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
            <HardDrive size={64} className="text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">Esta pasta está vazia</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {/* Folders */}
            {filteredFolders.map(folder => (
              <div 
                key={folder.id}
                onDoubleClick={() => navigateToFolder(folder)}
                className="group flex flex-col items-center p-4 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border relative"
              >
                <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center text-warning mb-3 group-hover:scale-110 transition-transform">
                  <Folder size={32} fill="currentColor" className="fill-warning/20" />
                </div>
                <span className="text-xs font-bold text-center line-clamp-2">{folder.name}</span>
                <div className="absolute top-2 right-2 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                    className="p-1 hover:bg-danger/10 hover:text-danger rounded text-muted-foreground bg-card shadow-sm border border-border"
                    title="Excluir pasta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {/* Files */}
            {filteredFiles.map(file => (
              <div 
                key={file.id}
                className="group flex flex-col items-center p-4 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border relative"
              >
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {getFileIcon(file.type)}
                </div>
                <span className="text-xs font-bold text-center line-clamp-2 px-1">{file.name}</span>
                <span className="text-[10px] text-muted-foreground mt-1">{formatFileSize(file.size)}</span>
                
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card/90 p-1 rounded-lg border border-border shadow-sm">
                  {file.url ? (
                    <a 
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground inline-flex items-center justify-center"
                      title="Baixar"
                    >
                      <Download size={14} />
                    </a>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toast.error('URL não disponível'); }}
                      className="p-1 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground"
                      title="Baixar"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, file.name); }}
                    className="p-1 hover:bg-danger/10 hover:text-danger rounded text-muted-foreground"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nome</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tamanho</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFolders.map(folder => (
                  <tr 
                    key={folder.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onDoubleClick={() => navigateToFolder(folder)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Folder size={18} className="text-warning fill-warning/20" />
                        <span className="text-sm font-bold">{folder.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {folder.createdAt ? format(folder.createdAt?.toDate?.() || new Date(), 'dd MMM yyyy', { locale: ptBR }) : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">--</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                        className="p-1.5 hover:bg-danger/10 hover:text-danger rounded text-muted-foreground transition-colors"
                        title="Excluir pasta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFiles.map(file => (
                  <tr key={file.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <span className="text-sm font-bold">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {file.createdAt ? format(file.createdAt?.toDate?.() || new Date(), 'dd MMM yyyy', { locale: ptBR }) : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {file.url ? (
                        <a 
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={file.name}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground transition-colors inline-flex items-center justify-center"
                          title="Baixar arquivo"
                        >
                          <Download size={16} />
                        </a>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); toast.error('URL não disponível'); }}
                          className="p-1.5 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground transition-colors"
                          title="Baixar arquivo"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, file.name); }}
                        className="p-1.5 hover:bg-danger/10 hover:text-danger rounded text-muted-foreground transition-colors"
                        title="Excluir arquivo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        companyId={userData?.companyId || ''}
        currentFolder={currentFolder}
      />

      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDelete}
        title={deleteConfirmState.type === 'file' ? 'Excluir Arquivo' : 'Excluir Pasta'}
        message={
          deleteConfirmState.type === 'file'
            ? `Tem certeza que deseja excluir o arquivo "${deleteConfirmState.name}" permanentemente?`
            : `Tem certeza que deseja excluir a pasta "${deleteConfirmState.name}" e todos os seus arquivos permanentemente?`
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteConfirmState.loading}
      />
    </div>
  );
}
