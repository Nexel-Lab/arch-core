import type { UserRole } from '@prisma/client'

const getPermissionsByRoleAndPlan = (
  role: UserRole,
  plan: string,
): string[] => {
  const basePermissions = ['read']

  // Role-based permissions
  const rolePermissions: Record<UserRole, string[]> = {
    SUPER_ADMIN: ['admin', 'write', 'delete', 'manage_users', 'manage_billing'],
    ADMIN: ['write', 'delete', 'manage_users'],
    USER: ['write'],
  }

  // Plan-based permissions
  const planPermissions: Record<string, string[]> = {
    FREE: [],
    PLUS: ['create_projects'],
    PRO: ['create_projects', 'advanced_features'],
    ELITE: ['create_projects', 'advanced_features', 'priority_support'],
  }

  return [
    ...basePermissions,
    ...(rolePermissions[role] || []),
    ...(planPermissions[plan] || []),
  ]
}

export { getPermissionsByRoleAndPlan }
