import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

async function runAudit() {
  console.log('================================================================');
  console.log('INICIANDO AUDITORIA DE PERMISSÕES DO CRM - USUÁRIO: jonhquadros');
  console.log('================================================================\n');

  try {
    // 1. Carregar Configurações do Firebase
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Arquivo de configuração não encontrado: ${configPath}`);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    const db = getFirestore(app, config.firestoreDatabaseId);
    console.log(`Conectado ao banco de dados: ${config.firestoreDatabaseId}\n`);

    // 2. Buscar o usuário pelo e-mail
    const targetEmail = 'jonhquadros@gmail.com';
    const q = query(collection(db, 'users'), where('email', '==', targetEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`[AVISO] Usuário '${targetEmail}' não encontrado no banco de dados.`);
      console.log('Se o usuário fizer login pela primeira vez, ele será criado com a política correta atualizada no AuthProvider.\n');
      console.log('================================================================');
      process.exit(0);
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`[INFO] Usuário encontrado:`);
    console.log(`- ID do Documento: ${userId}`);
    console.log(`- Nome: ${userData.name}`);
    console.log(`- E-mail: ${userData.email}`);
    console.log(`- Função Atual (Role): '${userData.role}'`);
    console.log(`- Permissões Atuais:`, JSON.stringify(userData.permissions, null, 2));
    console.log('\n--- ANALISANDO VIOLAÇÕES DE SEGURANÇA (RBAC) ---\n');

    const violations: string[] = [];
    let needsUpdate = false;

    // A regra de negócio exige: papel 'viewer' e apenas acesso de visualização nos módulos permitidos, sem acesso ao módulo 'users'
    const targetRole = 'viewer';
    const correctPermissions = {
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
    };

    // 3. Verificar a Função (Role)
    if (userData.role !== targetRole) {
      violations.push(`Função incorreta: Esperada '${targetRole}', encontrada '${userData.role}'.`);
      needsUpdate = true;
    }

    // 4. Analisar Permissões por Módulo e remover acessos residuais / mutações
    const currentPermissions = userData.permissions || {};
    
    for (const [moduleKey, targetPerms] of Object.entries(correctPermissions)) {
      const currentPerms = currentPermissions[moduleKey] || {};
      
      // Verificar se possui ações não autorizadas (create, edit, delete)
      if (currentPerms.create === true) {
        violations.push(`Acesso residual: Permissão de criação ('create') ativa no módulo '${moduleKey}'.`);
        needsUpdate = true;
      }
      if (currentPerms.edit === true) {
        violations.push(`Acesso residual: Permissão de edição ('edit') ativa no módulo '${moduleKey}'.`);
        needsUpdate = true;
      }
      if (currentPerms.delete === true) {
        violations.push(`Acesso residual: Permissão de exclusão ('delete') ativa no módulo '${moduleKey}'.`);
        needsUpdate = true;
      }

      // Verificar se possui acesso ao módulo restrito 'users'
      if (moduleKey === 'users' && currentPerms.view === true) {
        violations.push(`Acesso residual grave: Permissão de visualização ('view') ativa no módulo restrito de usuários ('users').`);
        needsUpdate = true;
      }

      // Verificar se as permissões gerais batem exatamente com as de visualizador
      if (
        currentPerms.view !== targetPerms.view ||
        currentPerms.create !== targetPerms.create ||
        currentPerms.edit !== targetPerms.edit ||
        currentPerms.delete !== targetPerms.delete
      ) {
        needsUpdate = true;
      }
    }

    // 5. Aplicar Correções se necessário
    if (needsUpdate) {
      console.log('⚠️ VIOLAÇÕES DETECTADAS:');
      violations.forEach(v => console.log(`  - ${v}`));
      
      console.log('\n[CORREÇÃO] Atualizando o perfil no Firestore para conformidade total de visualização...');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: targetRole,
        permissions: correctPermissions,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Correção aplicada com sucesso!');
      console.log(`- Nova Função: '${targetRole}'`);
      console.log(`- Permissões corrigidas para somente leitura (view-only) e exclusão total do módulo 'users'.`);
    } else {
      console.log('✅ NENHUMA VIOLAÇÃO DETECTADA.');
      console.log(`O usuário '${targetEmail}' já está devidamente configurado com perfil de '${targetRole}' e permissões estritas de visualização.`);
    }

    console.log('\n================================================================');
    console.log('FIM DA AUDITORIA');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO DURANTE A AUDITORIA:', error);
    process.exit(1);
  }
}

runAudit();
