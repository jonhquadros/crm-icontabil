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
    batch.set(userRef, {
      name: email.split('@')[0],
      email: email,
      role: 'admin',
      companyId: 'comp_default',
      companyName: 'iContábil Accounting Solutions',
      active: true,
      permissions: {
        dashboard: { view: true },
        clients: { view: true, create: true, edit: true, delete: true },
        documents: { view: true, create: true, edit: true, delete: true },
        tasks: { view: true, create: true, edit: true, delete: true },
        reports: { view: true },
        users: { view: true, create: true, edit: true, delete: true }
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

  await batch.commit();
};
