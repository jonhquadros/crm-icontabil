import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export const seedDatabase = async (userId: string, email: string) => {
  const batch = writeBatch(db);

  // 1. Create/Update User Profile
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const isJonh = email.toLowerCase() === 'jonhquadros@gmail.com';
    batch.set(userRef, {
      name: email.split('@')[0],
      email: email,
      role: isJonh ? 'viewer' : 'admin',
      companyId: 'comp_default',
      companyName: 'iContábil Accounting Solutions',
      active: true,
      permissions: isJonh ? {
        dashboard: { view: true, create: false, edit: false, delete: false },
        clients: { view: true, create: false, edit: false, delete: false },
        kanban: { view: true, create: false, edit: false, delete: false },
        whatsapp: { view: true, create: false, edit: false, delete: false },
        calendar: { view: true, create: false, edit: false, delete: false },
        documents: { view: true, create: false, edit: false, delete: false },
        tasks: { view: true, create: false, edit: false, delete: false },
        reports: { view: true, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        campaigns: { view: true, create: false, edit: false, delete: false }
      } : {
        dashboard: { view: true, create: true, edit: true, delete: true },
        clients: { view: true, create: true, edit: true, delete: true },
        kanban: { view: true, create: true, edit: true, delete: true },
        whatsapp: { view: true, create: true, edit: true, delete: true },
        calendar: { view: true, create: true, edit: true, delete: true },
        documents: { view: true, create: true, edit: true, delete: true },
        tasks: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: true, edit: true, delete: true },
        users: { view: true, create: true, edit: true, delete: true },
        campaigns: { view: true, create: true, edit: true, delete: true }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // 2. Create Sample Clients
  const clients = [
    { id: 'cli_1', name: 'Padaria Central Ltda', document: '12.345.678/0001-90', type: 'PJ', taxRegime: 'Simples Nacional', status: 'active' },
    { id: 'cli_2', name: 'TecnoSoft Soluções ME', document: '98.765.432/0001-10', type: 'PJ', taxRegime: 'MEI', status: 'active' },
    { id: 'cli_3', name: 'Construtora Silva S.A.', document: '45.678.123/0001-55', type: 'PJ', taxRegime: 'Lucro Presumido', status: 'active' },
    { id: 'cli_4', name: 'Restaurante Sabor & Arte', document: '23.456.789/0001-22', type: 'PJ', taxRegime: 'Simples Nacional', status: 'lead' },
    { id: 'cli_5', name: 'Consultoria Alpha', document: '34.567.890/0001-33', type: 'PJ', taxRegime: 'Simples Nacional', status: 'active' },
  ];

  clients.forEach(client => {
    const ref = doc(db, 'clients', client.id);
      batch.set(ref, {
        ...client,
        companyId: 'comp_default',
        email: `contato@${client.name.toLowerCase().replace(/\s/g, '')}.com.br`,
        phone: '(11) 9' + Math.floor(10000000 + Math.random() * 90000000),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

  // 3. Create Sample Tasks
  const tasks = [
    { title: 'Apuração do Simples Nacional', category: 'Impostos', priority: 'high', status: 'pending', clientId: 'cli_1' },
    { title: 'Envio da GFIP/SEFIP', category: 'Trabalhista', priority: 'urgent', status: 'pending', clientId: 'cli_3' },
    { title: 'Revisão de Balancete Mensal', category: 'Contabilidade', priority: 'medium', status: 'completed', clientId: 'cli_5' },
    { title: 'Regularização de Alvará', category: 'Legalização', priority: 'high', status: 'pending', clientId: 'cli_4' },
    { title: 'Declaração Anual MEI', category: 'Obrigações', priority: 'medium', status: 'completed', clientId: 'cli_2' },
  ];

    tasks.forEach((task, i) => {
      const ref = doc(db, 'tasks', `task_${i + 1}`);
      batch.set(ref, {
        ...task,
        companyId: 'comp_default',
        description: `Tarefa automatizada para ${task.title} do cliente.`,
        dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        assignedTo: userId,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

  // 4. Create Sample Documents
  const docs = [
    { name: 'Contrato Social.pdf', category: 'Legal', size: '1.2MB', clientId: 'cli_1' },
    { name: 'Balancete_Junho_2026.pdf', category: 'Contábil', size: '450KB', clientId: 'cli_3' },
    { name: 'Guia_DAS_07_2026.pdf', category: 'Impostos', size: '120KB', clientId: 'cli_1' },
    { name: 'Holerites_Equipe.zip', category: 'DP', size: '3.1MB', clientId: 'cli_5' },
  ];

  docs.forEach((docData, i) => {
    const ref = doc(db, 'documents', `doc_${i + 1}`);
    batch.set(ref, {
      ...docData,
      companyId: 'comp_default',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      uploadedBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  // 5. Create 5 Default Pipelines with their stages
  const defaultPipelines = [
    {
      id: 'pipe_prospeccao',
      name: 'Prospecção',
      isDefault: true,
      columns: [
        { id: 'lead', label: 'Novo Lead', color: 'bg-slate-400', order: 0 },
        { id: 'contact', label: 'Primeiro Contato', color: 'bg-primary', order: 1 },
        { id: 'proposal', label: 'Proposta', color: 'bg-indigo-500', order: 2 },
        { id: 'negotiation', label: 'Negociação', color: 'bg-purple-500', order: 3 },
        { id: 'won', label: 'Ganho', color: 'bg-success', order: 4 },
        { id: 'lost', label: 'Perdido', color: 'bg-danger', order: 5 },
      ]
    },
    {
      id: 'pipe_abertura',
      name: 'Abertura de Empresa',
      isDefault: false,
      columns: [
        { id: 'solicitation', label: 'Solicitação', color: 'bg-slate-400', order: 0 },
        { id: 'documentation', label: 'Documentação', color: 'bg-primary', order: 1 },
        { id: 'analysis', label: 'Análise', color: 'bg-warning', order: 2 },
        { id: 'protocol', label: 'Protocolo', color: 'bg-indigo-500', order: 3 },
        { id: 'waiting', label: 'Aguardando', color: 'bg-purple-500', order: 4 },
        { id: 'completed', label: 'Concluído', color: 'bg-success', order: 5 },
      ]
    },
    {
      id: 'pipe_troca',
      name: 'Troca de Contador',
      isDefault: false,
      columns: [
        { id: 'contact', label: 'Contato', color: 'bg-slate-400', order: 0 },
        { id: 'distrato', label: 'Distrato', color: 'bg-primary', order: 1 },
        { id: 'transfer', label: 'Transferência', color: 'bg-warning', order: 2 },
        { id: 'active', label: 'Ativo', color: 'bg-success', order: 3 },
        { id: 'closed', label: 'Encerrado', color: 'bg-danger', order: 4 },
      ]
    },
    {
      id: 'pipe_fiscal',
      name: 'Departamento Fiscal',
      isDefault: false,
      columns: [
        { id: 'receiving', label: 'Recebimento', color: 'bg-slate-400', order: 0 },
        { id: 'analysis', label: 'Análise', color: 'bg-primary', order: 1 },
        { id: 'entry', label: 'Lançamento', color: 'bg-warning', order: 2 },
        { id: 'review', label: 'Revisão', color: 'bg-purple-500', order: 3 },
        { id: 'delivered', label: 'Entregue', color: 'bg-success', order: 4 },
      ]
    },
    {
      id: 'pipe_consultoria',
      name: 'Consultoria',
      isDefault: false,
      columns: [
        { id: 'diagnosis', label: 'Diagnóstico', color: 'bg-slate-400', order: 0 },
        { id: 'proposal', label: 'Proposta', color: 'bg-primary', order: 1 },
        { id: 'execution', label: 'Execução', color: 'bg-warning', order: 2 },
        { id: 'delivery', label: 'Entrega', color: 'bg-purple-500', order: 3 },
        { id: 'closed', label: 'Fechado', color: 'bg-success', order: 4 },
      ]
    }
  ];

  defaultPipelines.forEach((pipeline) => {
    const pipelineRef = doc(db, 'pipelines', pipeline.id);
    batch.set(pipelineRef, {
      id: pipeline.id,
      companyId: 'comp_default',
      name: pipeline.name,
      isDefault: pipeline.isDefault,
      columns: pipeline.columns,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
    });

    // Seed stages subcollection for this pipeline
    pipeline.columns.forEach((col) => {
      const stageRef = doc(db, 'pipelines', pipeline.id, 'stages', col.id);
      batch.set(stageRef, {
        id: col.id,
        pipelineId: pipeline.id,
        companyId: 'comp_default',
        name: col.label,
        color: col.color,
        position: col.order,
        isWon: col.id === 'won' || col.id === 'completed' || col.id === 'active' || col.id === 'delivered',
        isLost: col.id === 'lost' || col.id === 'closed',
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      });
    });
  });

  // 6. Create some sample Kanban Cards distributed across the different pipelines
  const sampleCards = [
    {
      id: 'card_1',
      clientName: 'Roberto Alencar',
      companyName: 'Alencar Alimentos Ltda',
      phone: '(11) 98765-4321',
      priority: 'high',
      origin: 'Google',
      pipelineId: 'pipe_prospeccao',
      column: 'lead',
      responsible: email.split('@')[0],
      labels: ['Contabilidade', 'Urgente']
    },
    {
      id: 'card_2',
      clientName: 'Carla Souza',
      companyName: 'Souza Vestuário',
      phone: '(11) 97777-8888',
      priority: 'medium',
      origin: 'Indicação',
      pipelineId: 'pipe_abertura',
      column: 'solicitation',
      responsible: email.split('@')[0],
      labels: ['Abertura', 'MEI']
    },
    {
      id: 'card_3',
      clientName: 'Marcos Pontes',
      companyName: 'Pontes Logística',
      phone: '(11) 96666-5555',
      priority: 'urgent',
      origin: 'Google',
      pipelineId: 'pipe_troca',
      column: 'contact',
      responsible: email.split('@')[0],
      labels: ['Fiscal']
    },
    {
      id: 'card_4',
      clientName: 'Julia Martins',
      companyName: 'Martins e Filho Ltda',
      phone: '(11) 95555-4444',
      priority: 'low',
      origin: 'Google Ads',
      pipelineId: 'pipe_fiscal',
      column: 'receiving',
      responsible: email.split('@')[0],
      labels: ['Contabilidade']
    }
  ];

  sampleCards.forEach((cardData, idx) => {
    const cardRef = doc(db, 'kanban', cardData.id);
    batch.set(cardRef, {
      ...cardData,
      companyId: 'comp_default',
      active: true,
      position: idx,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stuckSince: serverTimestamp(),
      lastInteraction: serverTimestamp(),
      createdBy: userId,
      messagesCount: 2,
      documentsCount: 1,
      tasksCount: 2,
      tasksCompleted: 1,
      notesCount: 1,
      checklist: [],
      notesList: [],
      timeline: []
    });
  });

  await batch.commit();
};
