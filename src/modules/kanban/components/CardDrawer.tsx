import React, { useState, useEffect } from 'react';
import { 
  X,
  MessageSquare,
  CheckSquare,
  Paperclip,
  Clock,
  ListChecks,
  FileText,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  MessageCircle,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  History,
  Tag,
  Briefcase
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetClose
} from '../../../shared/components/ui/Sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/Tabs';
import { Badge } from '../../../shared/components/ui/Badge';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { ConfirmModal } from '../../../shared/components/ui/ConfirmModal';
import { KanbanCard, ChecklistItem, NoteItem, TimelineEvent } from '../../clients/types';
import { kanbanService } from '../services/kanbanService';
import { documentService } from '../../documents/services/documentService';
import { taskService } from '../../tasks/services/taskService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { getFormattedUserName } from '../../../shared/utils/userUtils';

interface CardDrawerProps {
  card: KanbanCard | null;
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; label: string; color: string }[];
  initialEditMode?: boolean;
}

const DEFAULT_CHECKLIST_MODEL: { title: string }[] = [
  { title: 'Contrato Social / Requerimento de Empresário' },
  { title: 'CPF e RG dos sócios' },
  { title: 'Comprovante de endereço dos sócios' },
  { title: 'Comprovante do local de instalação (Inscrição Imobiliária)' },
  { title: 'CNPJ (se empresa já constituída)' },
  { title: 'Procuração assinada' },
  { title: 'Certificado Digital (e-CPF / e-CNPJ)' },
  { title: 'Alvará de Funcionamento / Licenças' },
];

export function CardDrawer({ card, isOpen, onClose, columns, initialEditMode }: CardDrawerProps) {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('resumo');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    clientName: '',
    companyName: '',
    phone: '',
    whatsapp: '',
    email: '',
    document: '',
    clientType: 'PJ' as 'PF' | 'PJ' | 'MEI',
    taxRegime: 'Simples Nacional' as any,
    responsible: '',
    origin: '',
    priority: 'medium' as any,
    labels: [] as string[],
    addressStreet: '',
    addressNumber: '',
    addressCity: '',
    addressState: '',
  });

  // Note State
  const [newNoteText, setNewNoteText] = useState('');

  // Task State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [linkedTasks, setLinkedTasks] = useState<any[]>([]);

  // Checklist State
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // WhatsApp State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  // Documents State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (card) {
      const addr = card.address;
      const isAddrObj = typeof addr === 'object' && addr !== null;
      setEditForm({
        clientName: card.clientName || '',
        companyName: card.companyName || '',
        phone: card.phone || '',
        whatsapp: card.whatsapp || card.phone || '',
        email: card.email || '',
        document: card.document || '',
        clientType: card.clientType || 'PJ',
        taxRegime: card.taxRegime || 'Simples Nacional',
        responsible: card.responsible || user?.email?.split('@')[0] || 'Atendente',
        origin: card.origin || '',
        priority: card.priority || 'medium',
        labels: card.labels || [],
        addressStreet: isAddrObj ? (addr.street || '') : (typeof addr === 'string' ? addr : ''),
        addressNumber: isAddrObj ? (addr.number || '') : '',
        addressCity: isAddrObj ? (addr.city || '') : '',
        addressState: isAddrObj ? (addr.state || '') : '',
      });
      setIsEditing(initialEditMode || false);
    }
  }, [card, user, initialEditMode]);

  // Subscribe to tasks linked to this card/client
  useEffect(() => {
    if (!card || !userData?.companyId) return;
    const unsub = taskService.subscribeToTasks(userData.companyId, (allTasks) => {
      const filtered = allTasks.filter(t => t.clientId === card.id || t.title.includes(card.clientName));
      setLinkedTasks(filtered);
    });
    return () => unsub();
  }, [card, userData?.companyId]);

  // Subscribe to documents
  useEffect(() => {
    if (!card || !userData?.companyId) return;
    const unsub = documentService.subscribeToCardFiles(userData.companyId, card.id, (files) => {
      setDocuments(files);
    });
    return () => unsub();
  }, [card, userData?.companyId]);

  if (!card) return null;

  const column = columns.find(c => c.id === card.column);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-danger/10 text-danger border-danger/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  // Checklist Calculations
  const checklist: ChecklistItem[] = card.checklist && card.checklist.length > 0
    ? card.checklist
    : DEFAULT_CHECKLIST_MODEL.map((item, idx) => ({
        id: `chk_${idx}`,
        title: item.title,
        completed: false,
        completedBy: undefined,
        completedAt: undefined
      }));

  const checklistCompletedCount = checklist.filter(i => i.completed).length;
  const checklistProgress = checklist.length > 0 ? Math.round((checklistCompletedCount / checklist.length) * 100) : 0;

  // Save edit form
  const handleSaveEdit = async () => {
    try {
      const updatePayload: Partial<KanbanCard> = {
        clientName: editForm.clientName,
        companyName: editForm.companyName,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        email: editForm.email,
        document: editForm.document,
        clientType: editForm.clientType,
        taxRegime: editForm.taxRegime,
        responsible: editForm.responsible,
        origin: editForm.origin,
        priority: editForm.priority,
        address: {
          street: editForm.addressStreet,
          number: editForm.addressNumber,
          city: editForm.addressCity,
          state: editForm.addressState,
          complement: '',
          neighborhood: '',
          zipCode: ''
        }
      };

      await kanbanService.updateCard(card.id, updatePayload);
      await kanbanService.addTimelineEvent(card.id, {
        type: 'created',
        title: 'Dados cadastrais atualizados',
        description: 'Os dados do cliente/oportunidade foram atualizados.',
        author: user?.email || 'Usuário'
      }, card.timeline);

      toast.success('Card atualizado com sucesso!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar alterações');
    }
  };

  // Move Column
  const handleMoveStage = async (newColId: string) => {
    if (newColId === card.column) return;
    try {
      const oldColName = columns.find(c => c.id === card.column)?.label || card.column;
      const newColName = columns.find(c => c.id === newColId)?.label || newColId;

      await kanbanService.updateCardPosition(card.id, newColId, card.position);
      await kanbanService.addTimelineEvent(card.id, {
        type: 'stage_change',
        title: 'Mudança de etapa',
        description: `Etapa alterada de "${oldColName}" para "${newColName}".`,
        author: user?.email || 'Usuário'
      }, card.timeline);

      toast.success(`Movido para ${newColName}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao mover etapa');
    }
  };

  // Delete Card
  const handleDeleteCard = async () => {
    if (!card) return;
    try {
      await kanbanService.deleteCard(card.id);
      toast.success('Card excluído com sucesso');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir card');
    }
  };

  // Delete File
  const handleDeleteFile = async () => {
    if (!fileToDelete || !card) return;
    try {
      await documentService.deleteFile(fileToDelete.id);
      
      // Decrement documentsCount of the card
      await kanbanService.updateCard(card.id, {
        documentsCount: Math.max(0, (card.documentsCount || 0) - 1)
      });

      toast.success('Arquivo excluído com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir arquivo');
    } finally {
      setFileToDelete(null);
    }
  };

  // Checklist toggle
  const handleToggleChecklist = async (itemId: string) => {
    const updatedChecklist = checklist.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed ? new Date().toISOString() : undefined,
          completedBy: !item.completed ? (user?.email || 'Usuário') : undefined
        };
      }
      return item;
    });

    const newCompletedCount = updatedChecklist.filter(i => i.completed).length;
    const isNowAllDone = newCompletedCount === updatedChecklist.length;

    try {
      await kanbanService.updateChecklist(card.id, updatedChecklist);
      await kanbanService.addTimelineEvent(card.id, {
        type: 'checklist',
        title: 'Checklist atualizado',
        description: `Progresso: ${newCompletedCount}/${updatedChecklist.length} itens concluídos.`,
        author: user?.email || 'Usuário'
      }, card.timeline);

      if (isNowAllDone) {
        toast.success('🎉 Checklist 100% concluído! Responsável notificado.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar checklist');
    }
  };

  // Add Custom Checklist Item
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}`,
      title: newChecklistItem.trim(),
      completed: false
    };

    const updatedChecklist = [...checklist, newItem];

    try {
      await kanbanService.updateChecklist(card.id, updatedChecklist);
      setNewChecklistItem('');
      toast.success('Item adicionado ao checklist');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao adicionar item ao checklist');
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      const author = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Administrador';
      await kanbanService.addNote(card.id, newNoteText.trim(), author, card.notesList);
      await kanbanService.addTimelineEvent(card.id, {
        type: 'note',
        title: 'Observação registrada',
        description: `"${newNoteText.trim().substring(0, 50)}..."`,
        author
      }, card.timeline);

      setNewNoteText('');
      toast.success('Nota salva com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao adicionar nota');
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !userData?.companyId) return;

    try {
      const creatorName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Administrador';
      await taskService.createTask({
        companyId: userData.companyId,
        title: `${newTaskTitle.trim()} - (${card.clientName})`,
        status: 'todo',
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? (new Date(newTaskDueDate) as any) : null,
        clientId: card.id,
        createdBy: creatorName
      });

      await kanbanService.addTimelineEvent(card.id, {
        type: 'task',
        title: 'Nova tarefa criada',
        description: `Tarefa: ${newTaskTitle.trim()}`,
        author: creatorName
      }, card.timeline);

      // Increment tasks counter on card
      await kanbanService.updateCard(card.id, {
        tasksCount: (card.tasksCount || 0) + 1
      });

      setNewTaskTitle('');
      setNewTaskDueDate('');
      toast.success('Tarefa vinculada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar tarefa');
    }
  };

  // Send WhatsApp message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      text: chatMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setChatMessage('');

    try {
      await kanbanService.addTimelineEvent(card.id, {
        type: 'message',
        title: 'Mensagem enviada via WhatsApp',
        description: `"${newMsg.text.substring(0, 60)}..."`,
        author: user?.email || 'Usuário'
      }, card.timeline);

      await kanbanService.updateCard(card.id, {
        messagesCount: (card.messagesCount || 0) + 1
      });

      toast.success('Mensagem enviada!');
    } catch (err) {
      console.error(err);
    }
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!card || !files || files.length === 0 || !userData?.companyId) return;

    setUploadingDoc(true);
    try {
      const file = files[0];
      
      // Determine folder name from the Kanban card client or company registration
      const folderName = card.companyName?.trim() || card.clientName?.trim() || 'Geral';
      
      // Get or create folder
      const folderId = await documentService.getOrCreateFolderByName(userData.companyId, folderName);
      
      await documentService.uploadFile(file, userData.companyId, folderId, user?.uid || 'user', card.id);

      await kanbanService.addTimelineEvent(card.id, {
        type: 'document',
        title: 'Documento anexado',
        description: `Arquivo: ${file.name}`,
        author: user?.email || 'Usuário'
      }, card.timeline);

      await kanbanService.updateCard(card.id, {
        documentsCount: (card.documentsCount || 0) + 1
      });

      toast.success('Documento enviado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Timeline list merging default events + card.timeline
  const initEvent: TimelineEvent = {
    id: 'init_card',
    type: 'created',
    title: 'Cliente / Oportunidade Criada',
    description: `Lead cadastrado na etapa "${column?.label || card.column}"`,
    author: getFormattedUserName(card.createdBy || card.responsible, [], userData),
    createdAt: card.createdAt?.toDate ? card.createdAt.toDate().toISOString() : new Date().toISOString()
  };

  const timelineEvents: TimelineEvent[] = [
    ...(card.timeline || []),
    initEvent
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Icon mapping for timeline
  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created': return <User className="text-primary" size={16} />;
      case 'stage_change': return <ArrowRight className="text-warning" size={16} />;
      case 'message': return <MessageCircle className="text-success" size={16} />;
      case 'document': return <Paperclip className="text-indigo-500" size={16} />;
      case 'task': return <CheckSquare className="text-purple-500" size={16} />;
      case 'note': return <FileText className="text-amber-500" size={16} />;
      case 'checklist': return <ListChecks className="text-emerald-500" size={16} />;
      default: return <Clock className="text-muted-foreground" size={16} />;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Header do Drawer */}
      <SheetHeader className="pb-4 border-b border-border bg-muted/20 -mx-6 px-6 pt-6 mb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={`border font-bold uppercase ${getPriorityColor(card.priority)}`}>
                {getPriorityLabel(card.priority)}
              </Badge>
              
              {/* Selector de Etapa Atual */}
              <div className="relative group">
                <select 
                  value={card.column}
                  onChange={(e) => handleMoveStage(e.target.value)}
                  className="bg-background border border-border rounded-md text-xs font-semibold px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>
                      Etapa: {col.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SheetTitle className="text-xl font-bold truncate">
              {card.companyName || card.clientName}
            </SheetTitle>

            {card.companyName && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                <User size={12} />
                Contato: {card.clientName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors"
                title="Ações Rápidas"
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                    <button 
                      onClick={() => { setShowMenu(false); setIsEditing(true); setActiveTab('resumo'); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
                    >
                      <Edit2 size={14} /> Editar Dados
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button 
                      onClick={() => { setShowMenu(false); setIsDeleteModalOpen(true); }}
                      className="w-full text-left px-3 py-2 text-xs text-danger hover:bg-danger/10 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Excluir Oportunidade
                    </button>
                  </div>
                </>
              )}
            </div>

            <SheetClose onClick={onClose}>
              <X size={20} className="text-muted-foreground hover:text-foreground" />
            </SheetClose>
          </div>
        </div>
        
        {/* Barra de Ações Rápidas em botões */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/50 text-xs">
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="sm" 
            className="h-8 gap-1.5 bg-background"
            onClick={() => { setIsEditing(!isEditing); setActiveTab('resumo'); }}
          >
            <Edit2 size={13} /> {isEditing ? 'Cancelar Edição' : 'Editar'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 bg-background hover:border-success/50 hover:text-success"
            onClick={() => setActiveTab('whatsapp')}
          >
            <MessageCircle size={13} className="text-success" /> WhatsApp
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 bg-background"
            onClick={() => setActiveTab('tarefas')}
          >
            <CheckSquare size={13} /> Nova Tarefa
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 bg-background"
            onClick={() => setActiveTab('notas')}
          >
            <FileText size={13} /> Adicionar Nota
          </Button>
        </div>
      </SheetHeader>

      {/* Abas do Drawer */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col -mx-6">
        <div className="px-6 pb-2 border-b border-border/40">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/40 overflow-x-auto flex-nowrap hide-scrollbar gap-1">
            <TabsTrigger value="resumo" className="gap-1.5 text-xs shrink-0"><FileText size={13} /> Resumo</TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 text-xs shrink-0"><Clock size={13} /> Timeline</TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-1.5 text-xs shrink-0"><MessageSquare size={13} /> WhatsApp</TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-1.5 text-xs shrink-0"><CheckSquare size={13} /> Tarefas ({linkedTasks.length})</TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 text-xs shrink-0"><Paperclip size={13} /> Documentos</TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5 text-xs shrink-0">
              <ListChecks size={13} /> Checklist
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                {checklistProgress}%
              </span>
            </TabsTrigger>
            <TabsTrigger value="notas" className="gap-1.5 text-xs shrink-0"><FileText size={13} /> Notas ({(card.notesList || []).length})</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-xs shrink-0"><History size={13} /> Histórico</TabsTrigger>
          </TabsList>
        </div>

        <SheetContent className="px-6 flex-1 h-0 overflow-y-auto pt-4">
          {/* Aba Resumo */}
          <TabsContent value="resumo" className="h-full mt-0 focus-visible:ring-0">
            {isEditing ? (
              <div className="space-y-4 pb-12">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Editar Cadastro do Card</h3>
                  <Button size="sm" variant="primary" onClick={handleSaveEdit}>
                    Salvar Alterações
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Cliente / Nome Oportunidade</label>
                    <Input 
                      value={editForm.clientName || ''} 
                      onChange={e => setEditForm({...editForm, clientName: e.target.value})} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Nome da Empresa (Razão Social)</label>
                    <Input 
                      value={editForm.companyName || ''} 
                      onChange={e => setEditForm({...editForm, companyName: e.target.value})} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Tipo de Cliente</label>
                    <select 
                      value={editForm.clientType || 'PJ'} 
                      onChange={e => setEditForm({...editForm, clientType: e.target.value as any})}
                      className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs mt-1"
                    >
                      <option value="PJ">Pessoa Jurídica (PJ)</option>
                      <option value="PF">Pessoa Física (PF)</option>
                      <option value="MEI">Microempreendedor (MEI)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Regime Tributário</label>
                    <select 
                      value={editForm.taxRegime || 'Simples Nacional'} 
                      onChange={e => setEditForm({...editForm, taxRegime: e.target.value as any})}
                      className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs mt-1"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI">MEI</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">CPF / CNPJ</label>
                    <Input 
                      value={editForm.document || ''} 
                      onChange={e => setEditForm({...editForm, document: e.target.value})} 
                      className="mt-1"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Email</label>
                    <Input 
                      value={editForm.email || ''} 
                      onChange={e => setEditForm({...editForm, email: e.target.value})} 
                      className="mt-1"
                      placeholder="email@cliente.com"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Telefone</label>
                    <Input 
                      value={editForm.phone || ''} 
                      onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">WhatsApp</label>
                    <Input 
                      value={editForm.whatsapp || ''} 
                      onChange={e => setEditForm({...editForm, whatsapp: e.target.value})} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Responsável</label>
                    <Input 
                      value={editForm.responsible || ''} 
                      onChange={e => setEditForm({...editForm, responsible: e.target.value})} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Origem do Lead</label>
                    <Input 
                      value={editForm.origin || ''} 
                      onChange={e => setEditForm({...editForm, origin: e.target.value})} 
                      className="mt-1"
                      placeholder="Ex: Google, Indicação"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Logradouro / Rua</label>
                    <Input 
                      value={editForm.addressStreet || ''} 
                      onChange={e => setEditForm({...editForm, addressStreet: e.target.value})} 
                      className="mt-1"
                      placeholder="Rua / Av..."
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground uppercase text-[10px]">Número / Cidade / UF</label>
                    <Input 
                      value={editForm.addressCity || ''} 
                      onChange={e => setEditForm({...editForm, addressCity: e.target.value})} 
                      className="mt-1"
                      placeholder="Ex: São Paulo - SP"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button variant="primary" size="sm" onClick={handleSaveEdit}>Salvar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-12 text-sm">
                {/* Bloco 1: Dados Cadastrais */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User size={14} className="text-primary" />
                      Dados Cadastrais Completo
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {card.clientType || 'PJ'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Tipo / Regime</span>
                      <p className="text-xs font-medium mt-0.5">{card.clientType || 'PJ'} - {card.taxRegime || 'Simples Nacional'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">CPF / CNPJ</span>
                      <p className="text-xs font-medium mt-0.5">{card.document || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span>
                      <p className="text-xs font-medium mt-0.5 truncate">{card.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Telefone</span>
                      <p className="text-xs font-medium mt-0.5 flex items-center gap-1">
                        <Phone size={12} className="text-muted-foreground" />
                        {card.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">WhatsApp</span>
                      <p className="text-xs font-medium mt-0.5 flex items-center gap-1 text-success">
                        <MessageCircle size={12} />
                        {card.whatsapp || card.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Origem do Lead</span>
                      <p className="text-xs font-medium mt-0.5 capitalize">{card.origin || '-'}</p>
                    </div>
                  </div>

                  {card.address && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} /> Endereço Completo
                      </span>
                      <p className="text-xs mt-0.5 text-foreground">
                        {typeof card.address === 'object' 
                          ? `${card.address.street || ''} ${card.address.number || ''}, ${card.address.city || ''} ${card.address.state || ''}`
                          : card.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bloco 2: Gestão do Card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                    <Briefcase size={14} className="text-primary" />
                    Atribuição & Pipeline
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Responsável</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar size="sm" fallback={card.responsible.substring(0,2)} className="w-6 h-6" />
                        <span className="text-xs font-semibold">{card.responsible}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Data de Entrada</span>
                      <p className="text-xs font-medium mt-1 flex items-center gap-1">
                        <CalendarIcon size={12} className="text-muted-foreground" />
                        {card.createdAt?.toDate ? format(card.createdAt.toDate(), "dd/MM/yyyy HH:mm") : '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Etiquetas</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {card.labels?.length ? card.labels.map((lbl, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                            {lbl}
                          </Badge>
                        )) : <span className="text-xs text-muted-foreground">Nenhuma etiqueta</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba Timeline */}
          <TabsContent value="timeline" className="h-full mt-0 focus-visible:ring-0">
            <div className="space-y-4 pb-12">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Histórico Cronológico de Ações
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative flex items-start gap-3 text-xs group">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center shadow-xs">
                      {getTimelineIcon(evt.type)}
                    </div>
                    
                    <div className="flex-1 bg-card border border-border rounded-lg p-3">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-bold text-foreground">{evt.title}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(evt.createdAt), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{evt.description}</p>
                      <div className="mt-2 text-[10px] text-muted-foreground/80 flex items-center gap-1">
                        <User size={10} /> por <span className="font-medium text-foreground">{getFormattedUserName(evt.author, [], userData)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Aba WhatsApp */}
          <TabsContent value="whatsapp" className="h-full mt-0 focus-visible:ring-0 flex flex-col justify-between">
            <div className="flex-1 space-y-3 pb-4">
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center justify-between text-xs text-success">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} />
                  <span>Conversa Evolution API com {card.whatsapp || card.phone}</span>
                </div>
                <Badge variant="outline" className="text-[9px] bg-success/20 border-success/30 text-success">
                  Online
                </Badge>
              </div>

              {/* Message List */}
              <div className="space-y-3 min-h-[220px] bg-muted/20 border border-border rounded-xl p-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                    <p>Nenhuma mensagem trocada recentemente.</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">Envie uma mensagem abaixo para iniciar o atendimento.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-2.5 text-xs ${
                        m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
                      }`}>
                        <p>{m.text}</p>
                        <span className="text-[9px] opacity-70 block text-right mt-1">
                          {format(m.timestamp, 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Input Send */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-border">
              <Input 
                placeholder="Escreva uma mensagem no WhatsApp..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                className="text-xs"
              />
              <Button type="submit" variant="primary" size="sm" className="gap-1.5 shrink-0">
                <Send size={14} /> Enviar
              </Button>
            </form>
          </TabsContent>

          {/* Aba Tarefas */}
          <TabsContent value="tarefas" className="h-full mt-0 focus-visible:ring-0 space-y-4 pb-12">
            {/* Form criar tarefa */}
            <form onSubmit={handleCreateTask} className="bg-muted/30 border border-border p-3 rounded-xl space-y-3">
              <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Plus size={14} /> Criar Tarefa Vinculada
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <Input 
                    placeholder="Título da tarefa..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
                <div>
                  <Input 
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <select 
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as any)}
                  className="bg-background border border-border rounded-md px-2 py-1 text-xs"
                >
                  <option value="low">Baixa Prioridade</option>
                  <option value="medium">Média Prioridade</option>
                  <option value="high">Alta Prioridade</option>
                  <option value="urgent">Urgente</option>
                </select>
                <Button type="submit" size="sm" variant="primary" className="h-7 text-xs gap-1">
                  Adicionar
                </Button>
              </div>
            </form>

            {/* Lista de Tarefas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Tarefas Existentes ({linkedTasks.length})</h4>
              {linkedTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma tarefa cadastrada para este card.</p>
              ) : (
                linkedTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={16} className={t.status === 'completed' ? 'text-success' : 'text-muted-foreground'} />
                      <span className={t.status === 'completed' ? 'line-through text-muted-foreground' : 'font-medium'}>
                        {t.title}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {t.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="docs" className="h-full mt-0 focus-visible:ring-0 space-y-4 pb-12">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-semibold">Anexar Documentos do Cliente (Cloudinary)</p>
              <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG, DOCX até 10MB</p>
              <input 
                type="file" 
                id="drawer-file-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 text-xs gap-1.5"
                disabled={uploadingDoc}
                onClick={() => document.getElementById('drawer-file-upload')?.click()}
              >
                {uploadingDoc ? 'Enviando...' : 'Selecionar Arquivo'}
              </Button>
            </div>

            {/* Lista de Documentos */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Arquivos Anexados ({documents.length})</h4>
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhum documento anexado ainda.</p>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip size={14} className="text-primary shrink-0" />
                      <span className="font-medium truncate">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-primary hover:underline"
                      >
                        Visualizar
                      </a>
                      <button 
                        onClick={() => setFileToDelete(doc)}
                        className="text-xs text-danger hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Aba Checklist */}
          <TabsContent value="checklist" className="h-full mt-0 focus-visible:ring-0 space-y-4 pb-12">
            {/* Structural progress bar */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <ListChecks size={16} className="text-primary" />
                  Progresso dos Documentos
                </span>
                <span className="font-bold text-primary">{checklistProgress}% ({checklistCompletedCount}/{checklist.length})</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>

              {checklistProgress === 100 && (
                <div className="bg-success/10 border border-success/30 text-success p-2 rounded-lg text-xs flex items-center gap-2 mt-2 font-medium">
                  <CheckCircle2 size={16} />
                  <span>Todos os documentos coletados com sucesso! Responsável notificado.</span>
                </div>
              )}
            </div>

            {/* Inserir Item Avulso */}
            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <Input 
                placeholder="Adicionar documento/item avulso ao checklist..."
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                className="text-xs"
              />
              <Button type="submit" size="sm" variant="outline" className="gap-1 shrink-0">
                <Plus size={14} /> Adicionar
              </Button>
            </form>

            {/* Item List */}
            <div className="space-y-1.5">
              {checklist.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    item.completed ? 'bg-success/5 border-success/20 text-muted-foreground' : 'bg-card border-border hover:bg-muted/30'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}} // handled by div onClick
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className={`flex-1 ${item.completed ? 'line-through' : 'font-medium text-foreground'}`}>
                    {item.title}
                  </span>
                  {item.completed && item.completedBy && (
                    <span className="text-[10px] text-muted-foreground">
                      Concluído por {item.completedBy}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Aba Notas */}
          <TabsContent value="notas" className="h-full mt-0 focus-visible:ring-0 space-y-4 pb-12">
            <form onSubmit={handleAddNote} className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nova Observação Interna</label>
              <textarea 
                rows={3}
                placeholder="Digite detalhes, anotações de ligações ou reuniões..."
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" variant="primary" className="gap-1 text-xs">
                  <FileText size={14} /> Salvar Observação
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Observações Registradas ({(card.notesList || []).length})</h4>
              {(!card.notesList || card.notesList.length === 0) ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma observação registrada.</p>
              ) : (
                card.notesList.map(note => (
                  <div key={note.id} className="p-3 bg-card border border-border rounded-lg text-xs space-y-1">
                    <p className="text-foreground whitespace-pre-wrap">{note.text}</p>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>{note.author}</span>
                      <span>{formatDistanceToNow(new Date(note.createdAt), { locale: ptBR, addSuffix: true })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="historico" className="h-full mt-0 focus-visible:ring-0 space-y-3 pb-12">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <History size={16} className="text-primary" />
              Log de Auditoria do Card
            </h3>

            <div className="bg-card border border-border rounded-xl p-4 text-xs space-y-3">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">ID do Card:</span>
                <span className="font-mono">{card.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Criado por:</span>
                <span className="font-medium">{getFormattedUserName(card.createdBy, [], userData)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Data de Criação:</span>
                <span>{card.createdAt?.toDate ? format(card.createdAt.toDate(), "dd/MM/yyyy HH:mm:ss") : '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Última Interação:</span>
                <span>{card.lastInteraction?.toDate ? format(card.lastInteraction.toDate(), "dd/MM/yyyy HH:mm:ss") : '-'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Tempo Parado na Etapa:</span>
                <span>{card.stuckSince?.toDate ? formatDistanceToNow(card.stuckSince.toDate(), { locale: ptBR }) : '0 min'}</span>
              </div>
            </div>
          </TabsContent>
        </SheetContent>
      </Tabs>
    </Sheet>

    <ConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDeleteCard}
      title="Excluir Oportunidade"
      message="Tem certeza que deseja excluir esta oportunidade permanentemente?"
    />

    <ConfirmModal
      isOpen={!!fileToDelete}
      onClose={() => setFileToDelete(null)}
      onConfirm={handleDeleteFile}
      title="Excluir Arquivo"
      message={`Tem certeza que deseja excluir o arquivo "${fileToDelete?.name}" permanentemente do banco de dados?`}
    />
  </>
);
}
