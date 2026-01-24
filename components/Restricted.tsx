import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRBAC } from '../hooks/useRBAC';
import { useThemeStore } from '../store/themeStore';

interface RestrictedProps {
  children: React.ReactNode;
  /** Required permission(s) - user must have at least one */
  permissions?: string | string[];
  /** Required module access */
  module?: string;
  /** Required role(s) - user must have at least one */
  roles?: string | string[];
  /** Show message when access denied */
  showDeniedMessage?: boolean;
  /** Custom denied message */
  deniedMessage?: string;
  /** Fallback component when access denied */
  fallback?: React.ReactNode;
  /** Show loading indicator instead of null while checking permissions */
  showLoadingIndicator?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * Wrapper component to restrict access based on permissions/roles
 * Only renders children if user has required access
 */
export function Restricted({
  children,
  permissions,
  module,
  roles,
  showDeniedMessage = false,
  deniedMessage = 'You do not have permission to access this feature.',
  fallback,
  showLoadingIndicator = true,
  loadingComponent,
}: RestrictedProps) {
  const { userRoles, hasPermission, canAccessModule, loading } = useRBAC();
  const { colors } = useThemeStore();

  // Show loading state instead of null to prevent flash
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    if (showLoadingIndicator) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    return null;
  }

  // Check permissions
  if (permissions) {
    const permissionList = Array.isArray(permissions) ? permissions : [permissions];
    const hasRequiredPermission = permissionList.some(p => hasPermission(p));
    if (!hasRequiredPermission) {
      return renderDenied();
    }
  }

  // Check module access
  if (module && !canAccessModule(module)) {
    return renderDenied();
  }

  // Check roles
  if (roles) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = roleList.some(r => userRoles.includes(r));
    if (!hasRequiredRole) {
      return renderDenied();
    }
  }

  // User has required access
  return <>{children}</>;

  function renderDenied() {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showDeniedMessage) {
      return (
        <View style={[styles.deniedContainer, { backgroundColor: colors.cardBackground, borderColor: colors.error }]}>
          <Text style={[styles.deniedText, { color: colors.error }]}>
            {deniedMessage}
          </Text>
        </View>
      );
    }

    return null;
  }
}

/**
 * HOC to restrict entire screens
 */
export function withRBAC<P extends object>(
  Component: React.ComponentType<P>,
  restrictions: Omit<RestrictedProps, 'children'>
) {
  return function RestrictedComponent(props: P) {
    return (
      <Restricted {...restrictions}>
        <Component {...props} />
      </Restricted>
    );
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  deniedText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
