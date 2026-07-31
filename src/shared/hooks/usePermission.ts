import { useAuth } from '../../app/providers/AuthProvider';
import { UserPermissions, ModulePermissions } from '../../modules/users/types';

export function usePermission() {
  const { userData } = useAuth();

  const hasPermission = (
    module: keyof UserPermissions, 
    action: keyof ModulePermissions = 'view'
  ): boolean => {
    if (!userData) {
      console.warn(`Permission check for ${module}:${action} failed: User data not loaded.`);
      return false;
    }

    const role = userData.role?.toLowerCase();
    
    // Global admin has all permissions
    if (role === 'global_admin') return true;
    
    // Admin has all permissions in their company
    if (role === 'admin') return true;

    const permissions = userData?.permissions;
    if (!permissions) {
      console.warn(`Permission check for ${module}:${action} failed: No permissions object found for role ${role}.`);
      return false;
    }

    const modulePerms = permissions[module];
    if (!modulePerms) {
      console.warn(`Permission check for ${module}:${action} failed: Module ${module} not found in permissions.`);
      return false;
    }

    const result = !!modulePerms[action];
    if (!result) {
      console.debug(`Permission check for ${module}:${action} returned false.`);
    }
    
    return result;
  };

  const role = userData?.role?.toLowerCase();
  const isAdmin = role === 'admin' || role === 'global_admin';

  return { hasPermission, isAdmin, role: userData?.role };
}
