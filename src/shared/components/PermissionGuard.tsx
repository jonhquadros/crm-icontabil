import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { UserPermissions, ModulePermissions } from '../../modules/users/types';

interface PermissionGuardProps {
  module: keyof UserPermissions;
  action?: keyof ModulePermissions;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ 
  module, 
  action = 'view', 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
