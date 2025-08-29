// Removed for single-user app - no need for complex permission system
// import { User } from '@/stores/auth-store';

// // Permission constants for better type safety - matching actual database permissions
// export const PERMISSIONS = {
//   // User Management
//   USERS: {
//     VIEW: 'users.view',
//     CREATE: 'users.create',
//     UPDATE: 'users.update',
//     DELETE: 'users.delete',
//     ACTIVATE: 'users.activate',
//     DEACTIVATE: 'users.deactivate',
//   },

//   // Role Management
//   ROLES: {
//     VIEW: 'roles.view',
//     CREATE: 'roles.create',
//     UPDATE: 'roles.update',
//     DELETE: 'roles.delete',
//   },

//   // Project Management
//   PROJECTS: {
//     VIEW_ALL: 'projects.view_all',
//     VIEW_OWN: 'projects.view_own',
//     CREATE: 'projects.create',
//     UPDATE_ALL: 'projects.update_all',
//     UPDATE_OWN: 'projects.update_own',
//     DELETE_ALL: 'projects.delete_all',
//     DELETE_OWN: 'projects.delete_own',
//     ASSIGN: 'projects.assign',
//     MANAGE_MEMBERS: 'projects.manage_members',
//   },

//   // Article Management (singular as per database)
//   ARTICLES: {
//     VIEW: 'article.view',
//     CREATE: 'article.create',
//     UPDATE: 'article.update',
//     DELETE: 'article.delete',
//     PUBLISH: 'article.publish',
//     APPROVE: 'article.approve',
//   },

//   // Topic Management (using same permissions as Articles since they're both content types)
//   TOPICS: {
//     VIEW: 'article.view',
//     CREATE: 'article.create',
//     UPDATE: 'article.update',
//     DELETE: 'article.delete',
//     PUBLISH: 'article.publish',
//     APPROVE: 'article.approve',
//   },



//   // System Settings
//   SETTINGS: {
//     VIEW: 'settings.view',
//     UPDATE: 'settings.update',
//     SYSTEM_CONFIG: 'settings.system_config',
//   },

//   // Agency Management
//   AGENCY: {
//     VIEW: 'agency_users.view',
//     CREATE: 'agency_users.create',
//     UPDATE: 'agency_users.update',
//     DELETE: 'agency_users.delete',
//     MANAGE_MEMBERS: 'agency_users.manage_members',
//   },

//   // Reports & Analytics
//   REPORTS: {
//     VIEW: 'reports.view',
//     EXPORT: 'reports.export',
//     ANALYTICS: 'reports.analytics',
//   },

//   // Notifications
//   NOTIFICATIONS: {
//     VIEW: 'notifications.view',
//     SEND: 'notifications.send',
//     MANAGE: 'notifications.manage',
//   },

//   // Designations
//   DESIGNATIONS: {
//     VIEW: 'designations.view',
//     CREATE: 'designations.create',
//     UPDATE: 'designations.update',
//     DELETE: 'designations.delete',
//   },

//   // AI System Prompts
//   AI_SYSTEM_PROMPT: {
//     VIEW: 'ai_system_prompt.view',
//     CREATE: 'ai_system_prompt.create',
//     UPDATE: 'ai_system_prompt.update',
//     DELETE: 'ai_system_prompt.delete',
//   },

//   // General AI Guidelines
//   GENERAL_AI_GUIDELINES: {
//     VIEW: 'general_ai_guidelines.view',
//     CREATE: 'general_ai_guidelines.create',
//     UPDATE: 'general_ai_guidelines.update',
//     DELETE: 'general_ai_guidelines.delete',
//   },

//   // Activity Logs
//   ACTIVITY_LOG: {
//     VIEW: 'activity_log.view',
//   },

//   // Project Activity
//   PROJECT_ACTIVITY: {
//     VIEW: 'project_activity.view',
//   },

//   // Time Tracking Logs
//   TIME_TRACK_LOGS: {
//     VIEW_ALL: 'time_track_logs.view_all',
//     VIEW_OWN: 'time_track_logs.view_own',
//   },

//   // Subscriptions
//   SUBSCRIPTIONS: {
//     VIEW: 'subscriptionlist.view',
//     CREATE: 'subscriptions.create',
//     UPDATE: 'subscriptions.update',
//     DELETE: 'subscriptions.delete',
//   },
// } as const;

// Removed for single-user app - no need for complex permission system
// // Feature-based permission groups
// export const FEATURE_PERMISSIONS = {
//   USER_MANAGEMENT: [
//     PERMISSIONS.USERS.VIEW,
//     PERMISSIONS.USERS.CREATE,
//     PERMISSIONS.USERS.UPDATE,
//     PERMISSIONS.USERS.DELETE,
//     PERMISSIONS.USERS.ACTIVATE,
//     PERMISSIONS.USERS.DEACTIVATE,
//   ],
//   ROLE_MANAGEMENT: [
//     PERMISSIONS.ROLES.VIEW,
//     PERMISSIONS.ROLES.CREATE,
//     PERMISSIONS.ROLES.UPDATE,
//     PERMISSIONS.ROLES.DELETE,
//   ],
//   PROJECT_MANAGEMENT: [
//     PERMISSIONS.PROJECTS.VIEW_ALL,
//     PERMISSIONS.PROJECTS.VIEW_OWN,
//     PERMISSIONS.PROJECTS.CREATE,
//     PERMISSIONS.PROJECTS.UPDATE_ALL,
//     PERMISSIONS.PROJECTS.UPDATE_OWN,
//     PERMISSIONS.PROJECTS.DELETE_ALL,
//     PERMISSIONS.PROJECTS.DELETE_OWN,
//     PERMISSIONS.PROJECTS.ASSIGN,
//     PERMISSIONS.PROJECTS.MANAGE_MEMBERS,
//   ],
//   CONTENT_MANAGEMENT: [
//     PERMISSIONS.ARTICLES.VIEW,
//     PERMISSIONS.ARTICLES.CREATE,
//     PERMISSIONS.ARTICLES.UPDATE,
//     PERMISSIONS.ARTICLES.DELETE,
//     PERMISSIONS.ARTICLES.PUBLISH,
//     PERMISSIONS.ARTICLES.APPROVE,
//     PERMISSIONS.TOPICS.VIEW,
//     PERMISSIONS.TOPICS.CREATE,
//     PERMISSIONS.TOPICS.UPDATE,
//     PERMISSIONS.TOPICS.DELETE,
//   ],
//   SYSTEM_ADMIN: [
//     PERMISSIONS.SETTINGS.VIEW,
//     PERMISSIONS.SETTINGS.UPDATE,
//     PERMISSIONS.SETTINGS.SYSTEM_CONFIG,
//     PERMISSIONS.REPORTS.VIEW,
//     PERMISSIONS.REPORTS.EXPORT,
//     PERMISSIONS.REPORTS.ANALYTICS,
//   ],
// } as const;

// // Role-based access levels
// export const ROLE_ACCESS_LEVELS = {
//   ADMIN: 'admin',
//   AGENCY_OWNER: 'agency_owner',
//   PROJECT_MANAGER: 'project_manager',
//   ACCOUNT_MANAGER: 'account_manager',
//   AGENCY_MEMBER: 'agency_member',
//   STAFF: 'staff',
// } as const;

// // Utility to check if a user has a specific permission
// export function hasPermission(user: User | null, permission: string): boolean {
//   if (!user || !user.role || !user.role.permissions) {
//     return false;
//   }

//   // Check if user has the specific permission
//   return user.role.permissions.includes(permission);
// }

// // Utility to check if a user has any of the specified permissions
// export function hasAnyPermission(
//   user: User | null,
//   permissions: string[]
// ): boolean {
//   if (!user || !user.role || !user.role.permissions) {
//     return false;
//   }

//   return permissions.some((permission) =>
//     user.role.permissions.includes(permission)
//   );
// }

// // Utility to check if a user has all of the specified permissions
// export function hasAllPermissions(
//   user: User | null,
//   permissions: string[]
// ): boolean {
//   if (!user || !user.role || !user.role.permissions) {
//     return false;
//   }

//   return permissions.every((permission) =>
//     user.role.permissions.includes(permission)
//   );
// }

// // Utility to check if a user has a specific role
// export function hasRole(user: User | null, roleCode: string): boolean {
//   if (!user || !user.role) {
//     return false;
//   }

//   return user.role.code === roleCode;
// }

// // Utility to check if a user has any of the specified roles
// export function hasAnyRole(user: User | null, roleCodes: string[]): boolean {
//   if (!user || !user.role) {
//     return false;
//   }

//   return roleCodes.includes(user.role.code);
// }

// // Utility to check if a user has access to a specific feature
// export function hasFeatureAccess(
//   user: User | null,
//   feature: keyof typeof FEATURE_PERMISSIONS
// ): boolean {
//   if (!user || !user.role || !user.role.permissions) {
//     return false;
//   }

//   const featurePermissions = FEATURE_PERMISSIONS[feature];
//   return featurePermissions.some((permission) =>
//     user.role.permissions.includes(permission)
//   );
// }

// // Utility to get user's permission level for a feature
// export function getFeaturePermissionLevel(
//   user: User | null,
//   feature: keyof typeof FEATURE_PERMISSIONS
// ): 'none' | 'partial' | 'full' {
//   if (!user || !user.role || !user.role.permissions) {
//     return 'none';
//   }

//   const featurePermissions = FEATURE_PERMISSIONS[feature];
//   const userPermissions = user.role.permissions;

//   const hasPermissions = featurePermissions.filter((permission) =>
//     userPermissions.includes(permission)
//   );

//   if (hasPermissions.length === 0) {
//     return 'none';
//   } else if (hasPermissions.length === featurePermissions.length) {
//     return 'full';
//   } else {
//     return 'partial';
//   }
// }

// // Utility to check if user can perform an action on a resource
// export function canPerformAction(
//   user: User | null,
//   action: string,
//   resource?: any
// ): boolean {
//   if (!user || !user.role || !user.role.permissions) {
//     return false;
//   }

//   // Check basic permission
//   const permission = `${resource?.type || 'general'}.${action}`;
//   const hasBasicPermission = hasPermission(user, permission);

//   // If no resource-specific logic, return basic permission
//   if (!resource) {
//     return hasBasicPermission;
//   }

//   // Resource-specific permission logic
//   switch (resource.type) {
//     case 'project':
//       return hasBasicPermission && canAccessProject(user, resource);
//     case 'article':
//       return hasBasicPermission && canAccessArticle(user, resource);
//     case 'user':
//       return hasBasicPermission && canAccessUser(user, resource);
//     default:
//       return hasBasicPermission;
//   }
// }

// // Helper function to check project access
// function canAccessProject(user: User, project: any): boolean {
//   // Admin can access all projects
//   if (hasRole(user, ROLE_ACCESS_LEVELS.ADMIN)) {
//     return true;
//   }

//   // Agency owner can access projects in their agency
//   if (hasRole(user, ROLE_ACCESS_LEVELS.AGENCY_OWNER)) {
//     return project.agency_id === user.agency_detail?.id;
//   }

//   // Project manager can access assigned projects
//   if (hasRole(user, ROLE_ACCESS_LEVELS.PROJECT_MANAGER)) {
//     return (
//       project.assigned_users?.includes(user.id) ||
//       project.created_by === user.id
//     );
//   }

//   // Check if user is assigned to the project
//   return (
//     project.assigned_users?.includes(user.id) || project.created_by === user.id
//   );
// }

// // Helper function to check article access
// function canAccessArticle(user: User, article: any): boolean {
//   // Admin can access all articles
//   if (hasRole(user, ROLE_ACCESS_LEVELS.ADMIN)) {
//     return true;
//   }

//   // Author can always access their own articles
//   if (article.created_by === user.id) {
//     return true;
//   }

//   // Check project-based access
//   if (article.project_id) {
//     return canAccessProject(user, { id: article.project_id, type: 'project' });
//   }

//   return false;
// }

// // Helper function to check user access
// function canAccessUser(user: User, targetUser: any): boolean {
//   // Users can always access their own profile
//   if (targetUser.id === user.id) {
//     return true;
//   }

//   // Admin can access all users
//   if (hasRole(user, ROLE_ACCESS_LEVELS.ADMIN)) {
//     return true;
//   }

//   // Agency owner can access users in their agency
//   if (hasRole(user, ROLE_ACCESS_LEVELS.AGENCY_OWNER)) {
//     return targetUser.agency_id === user.agency_detail?.id;
//   }

//   // Project managers can access users assigned to their projects
//   if (hasRole(user, ROLE_ACCESS_LEVELS.PROJECT_MANAGER)) {
//     // This would need to be implemented based on your project-user relationship
//     return false;
//   }

//   return false;
// }

// // Utility to get user's effective permissions (including inherited ones)
// export function getUserEffectivePermissions(user: User | null): string[] {
//   if (!user || !user.role || !user.role.permissions) {
//     return [];
//   }

//   const basePermissions = [...user.role.permissions];

//   // Add role-based inherited permissions
//   switch (user.role.code) {
//     case ROLE_ACCESS_LEVELS.ADMIN:
//       // Admin gets all permissions
//       return Object.values(PERMISSIONS).flatMap((group) =>
//         Object.values(group)
//       );
//     case ROLE_ACCESS_LEVELS.AGENCY_OWNER:
//       // Agency owner gets agency-specific permissions
//       // return [...basePermissions, ...FEATURE_PERMISSIONS.AGENCY_MANAGEMENT];
//       return basePermissions;
//     default:
//       return basePermissions;
//   }
// }

// // Utility to check if user can access a specific route
// export function canAccessRoute(user: User | null, route: string): boolean {
//   if (!user || !user.role) {
//     return false;
//   }

//   // Route-based permission mapping
//   const routePermissions: Record<string, string[]> = {
//     '/setup': [PERMISSIONS.SETTINGS.SYSTEM_CONFIG],
//     '/setup/roles': [PERMISSIONS.ROLES.VIEW],
//     '/setup/users': [PERMISSIONS.USERS.VIEW],
//     '/setup/agency-members': [PERMISSIONS.AGENCY.VIEW],
//     '/projects': [PERMISSIONS.PROJECTS.VIEW_ALL, PERMISSIONS.PROJECTS.VIEW_OWN],
//     '/articles': [PERMISSIONS.ARTICLES.VIEW],
//     '/topics': [PERMISSIONS.TOPICS.VIEW],
  
//     '/reports': [PERMISSIONS.REPORTS.VIEW],
//     '/notifications': [PERMISSIONS.NOTIFICATIONS.VIEW],
//   };

//   // Check if route requires specific permissions
//   const requiredPermissions = routePermissions[route];
//   if (requiredPermissions) {
//     return hasAnyPermission(user, requiredPermissions);
//   }

//   // Default to allowing access for authenticated users
//   return true;
// }

// Simple placeholder functions for single-user app
export function hasPermission(): boolean {
  return true; // Single user has all permissions
}

export function hasAnyPermission(): boolean {
  return true; // Single user has all permissions
}

export function hasAllPermissions(): boolean {
  return true; // Single user has all permissions
}

export function hasRole(): boolean {
  return true; // Single user has all roles
}

export function hasAnyRole(): boolean {
  return true; // Single user has all roles
}

export function hasFeatureAccess(): boolean {
  return true; // Single user has access to all features
}

export function getFeaturePermissionLevel(): 'full' {
  return 'full'; // Single user has full access
}

export function canPerformAction(): boolean {
  return true; // Single user can perform all actions
}

export function getUserEffectivePermissions(): string[] {
  return []; // Not needed for single user
}

export function canAccessRoute(): boolean {
  return true; // Single user can access all routes
}
