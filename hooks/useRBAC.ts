import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import {
  hasPermission,
  canAccessModule,
  isAdmin,
  isSuperAdmin,
  getHighestRole,
  getUserPermissions,
  getAccessibleModules,
  canManageUsers,
  canApprove,
  getRoleDisplayName,
  ADMIN_ROLES,
  PERMISSIONS,
} from '../lib/rbac';

export interface UseRBACReturn {
  // User roles
  userRoles: string[];
  highestRole: string;
  roleDisplayName: string;
  
  // Admin checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  
  // Permissions
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  
  // Module access
  accessibleModules: string[];
  canAccessModule: (moduleName: string) => boolean;
  
  // Specific checks
  canManageUsers: (scope: 'all' | 'department') => boolean;
  canApprove: (type: 'planner' | 'diary', level: 'hod' | 'principal') => boolean;
  
  // Loading state
  loading: boolean;
  
  // Refresh function
  refreshRoles: () => Promise<void>;
}

/**
 * Hook for Role-Based Access Control
 * Provides all RBAC functionality for components
 */
export function useRBAC(): UseRBACReturn {
  const { user } = useAuthStore();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async () => {
    if (!user) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch user's roles from user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const roles = data?.map((item: any) => item.role?.name).filter(Boolean) || [];
      setUserRoles(roles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user?.id]);

  // Computed values
  const highestRole = getHighestRole(userRoles);
  const roleDisplayName = getRoleDisplayName(highestRole);
  const permissions = getUserPermissions(userRoles);
  const accessibleModules = getAccessibleModules(userRoles);

  return {
    // User roles
    userRoles,
    highestRole,
    roleDisplayName,
    
    // Admin checks
    isAdmin: isAdmin(userRoles),
    isSuperAdmin: isSuperAdmin(userRoles),
    
    // Permissions
    permissions,
    hasPermission: (permission: string) => hasPermission(userRoles, permission),
    
    // Module access
    accessibleModules,
    canAccessModule: (moduleName: string) => canAccessModule(userRoles, moduleName),
    
    // Specific checks
    canManageUsers: (scope: 'all' | 'department') => canManageUsers(userRoles, scope),
    canApprove: (type: 'planner' | 'diary', level: 'hod' | 'principal') => 
      canApprove(userRoles, type, level),
    
    // Loading state
    loading,
    
    // Refresh function
    refreshRoles: fetchUserRoles,
  };
}

/**
 * Hook to check if user has specific permission
 * Simpler version for quick permission checks
 */
export function usePermission(permission: string): boolean {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}

/**
 * Hook to check module access
 * Simpler version for quick module access checks
 */
export function useModuleAccess(moduleName: string): boolean {
  const { canAccessModule } = useRBAC();
  return canAccessModule(moduleName);
}

// Export RBAC constants for use in components
export { ADMIN_ROLES, PERMISSIONS };
