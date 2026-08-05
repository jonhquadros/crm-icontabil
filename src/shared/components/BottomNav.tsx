import { LayoutGrid, Users, MessageSquare, CheckSquare, BarChart3 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';

export function BottomNav() {
  const items = [
    { icon: LayoutGrid, label: 'Dashboard', to: '/dashboard' },
    { icon: Users, label: 'Clientes', to: '/dashboard/clients' },
    { icon: MessageSquare, label: 'WhatsApp', to: '/dashboard/whatsapp' },
    { icon: CheckSquare, label: 'Tarefas', to: '/dashboard/tasks' },
    { icon: BarChart3, label: 'Relatórios', to: '/dashboard/reports' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-40 px-2 pb-safe">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 p-2 text-xs",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
