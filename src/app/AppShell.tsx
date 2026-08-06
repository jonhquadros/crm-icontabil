/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './providers/AuthProvider';
import { Sidebar } from '../shared/layouts/Sidebar';
import { Header } from '../shared/layouts/Header';
import { Button } from '../shared/components/ui/Button';
import { BottomNav } from '../shared/components/BottomNav';
import '../styles/globals.css';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { userData, user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserRoleLabel = () => {
    if (!userData) return 'Carregando...';
    switch (userData.role) {
      case 'global_admin': return 'Administrador Global';
      case 'admin': return 'Administrador';
      case 'operator': return 'Operador';
      case 'viewer': return 'Visualizador';
      default: return 'Usuário';
    }
  };

  const userName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const userRole = getUserRoleLabel();

  return (
    <div className="flex h-screen w-full bg-background font-sans text-foreground overflow-hidden">
      {/* Mobile/Tablet Drawer Sidebar */}
      <div className="lg:hidden">
        <Sidebar 
          userName={userName}
          userRole={userRole}
          onLogout={handleLogout}
          isOpen={sidebarDrawerOpen}
          isDrawer
          onClose={() => setSidebarDrawerOpen(false)}
        />
      </div>

      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar 
          userName={userName}
          userRole={userRole}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarDrawerOpen(!sidebarDrawerOpen)} />

        {/* Diagnostic Warning for missing profile */}
        {!loading && user && !userData && (
          <div className="mx-8 mt-4 p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-3 text-warning">
            <ShieldAlert size={20} />
            <div className="flex-1">
              <p className="text-sm font-bold">Perfil não encontrado</p>
              <p className="text-xs">Seu usuário não possui um perfil no banco de dados. Algumas funções podem estar indisponíveis.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
              Voltar ao Login
            </Button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>

        <BottomNav />

        {/* Footer */}
        <footer className="h-12 border-t border-border bg-card flex items-center justify-between px-8 text-[10px] font-bold text-muted-foreground shrink-0">
          <div className="flex gap-6 uppercase tracking-widest">
            <span>v. 2.0.0 — ARQUITETURA SAAS</span>
          </div>

        </footer>
      </main>
    </div>
  );
}
