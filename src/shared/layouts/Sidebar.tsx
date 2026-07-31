import React from 'react';
import { LayoutGrid, Users, MessageSquare, Calendar, FileText, CheckSquare, BarChart3, Settings, LogOut, Shield, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';
import { usePermission } from '../hooks/usePermission';

interface SidebarProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
}

interface NavItemProps {
  icon: any;
  label: string;
  to: string;
  key?: string;
}

const NavItem = ({ icon: Icon, label, to }: NavItemProps) => (
  <NavLink
    to={to}
    end={to === '/dashboard'}
    className={({ isActive }) => cn(
      'flex items-center px-6 py-3 transition-colors gap-3 border-l-4',
      isActive 
        ? 'text-sidebar-accent-foreground bg-sidebar-accent border-primary' 
        : 'text-sidebar-foreground border-transparent hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
    )}
  >
    <Icon size={20} className="opacity-70" />
    {label}
  </NavLink>
);

export function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const { hasPermission, isAdmin } = usePermission();

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', to: '/dashboard', show: hasPermission('dashboard') },
    { icon: Users, label: 'Clientes', to: '/dashboard/clients', show: hasPermission('clients') },
    { icon: Layout, label: 'Kanban', to: '/dashboard/kanban', show: hasPermission('kanban') },
    { icon: MessageSquare, label: 'WhatsApp', to: '/dashboard/whatsapp', show: hasPermission('whatsapp') },
  ].filter(item => item.show);

  const resourceItems = [
    { icon: Calendar, label: 'Agenda', to: '/dashboard/tasks', show: hasPermission('calendar') },
    { icon: FileText, label: 'Documentos', to: '/dashboard/documents', show: hasPermission('documents') },
    { icon: CheckSquare, label: 'Tarefas', to: '/dashboard/tasks', show: hasPermission('tasks') },
    { icon: BarChart3, label: 'Relatórios', to: '/dashboard/reports', show: hasPermission('reports') },
    { icon: Settings, label: 'Configurações', to: '/dashboard/settings', show: true },
    { icon: Shield, label: 'Usuários', to: '/dashboard/users', show: isAdmin },
  ].filter(item => item.show);

  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-border text-sidebar-foreground h-full shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-accent/50">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-primary/20">iC</div>
        <div className="flex flex-col">
          <span className="text-white font-bold tracking-tight leading-tight">iContábil</span>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">CRM Professional</span>
        </div>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Operações</div>
        {navItems.map((item) => (
          <NavItem key={`${item.to}-${item.label}`} icon={item.icon} label={item.label} to={item.to} />
        ))}
        
        <div className="px-6 py-3 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Recursos</div>
        {resourceItems.map((item) => (
          <NavItem key={`${item.to}-${item.label}`} icon={item.icon} label={item.label} to={item.to} />
        ))}
      </nav>
      
      <div className="p-6 border-t border-sidebar-accent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent border border-slate-700 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className={cn(
              "text-[10px] truncate uppercase tracking-wider font-bold",
              userRole === 'Carregando...' ? "text-muted-foreground animate-pulse" : "text-primary"
            )}>
              {userRole}
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="text-sidebar-foreground hover:text-white transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
