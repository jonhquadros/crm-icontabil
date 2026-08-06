import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { usePermission } from '../../shared/hooks/usePermission';
import { rbacLogger } from '../../shared/utils/rbacLogger';
import { UserPermissions, ModulePermissions } from '../../modules/users/types';
import toast from 'react-hot-toast';

interface RoutePermissionGuardProps {
  module: keyof UserPermissions;
  action?: keyof ModulePermissions;
  children: React.ReactNode;
}

export function RoutePermissionGuard({ module, action = 'view', children }: RoutePermissionGuardProps) {
  const { user, userData, loading } = useAuth();
  const { hasPermission } = usePermission();
  const location = useLocation();
  const loggedRef = useRef<string>('');

  const isPermitted = hasPermission(module, action);

  useEffect(() => {
    if (loading || !user) return;

    // Log access attempt
    const logKey = `${user.uid}-${location.pathname}-${module}-${action}-${isPermitted}`;
    if (loggedRef.current !== logKey) {
      loggedRef.current = logKey;
      rbacLogger.logAccessAttempt(
        user.uid,
        user.email || '',
        userData?.role || 'none',
        location.pathname,
        module,
        action,
        isPermitted,
        isPermitted ? undefined : `Acesso negado para ação '${action}' no módulo '${module}'`
      );

      if (!isPermitted) {
        toast.error(`Acesso negado ao módulo ${module}`);
      }
    }
  }, [loading, user, userData, location.pathname, module, action, isPermitted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isPermitted) {
    // Prevent rendering of any CRM components and redirect back safely
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
