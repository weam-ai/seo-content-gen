// Single-user application - simplified permissions (always allow all actions)
export function usePermissions() {
  return {
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
    hasRole: () => true,
    hasAnyRole: () => true,
    hasFeatureAccess: () => true,
    getFeaturePermissionLevel: () => 'full' as const,
    canPerformAction: () => true,
    canAccessRoute: () => true,
    isAdmin: true,
    isAgencyOwner: true,
    isProjectManager: true,
    isAccountManager: true,
    isAgencyMember: true,
    isStaff: true,
  };
}

// Simplified permission hooks for single-user application

export function useProjectPermissions() {
  return {
    canViewProjects: true,
    canCreateProjects: true,
    canUpdateProjects: true,
    canDeleteProjects: true,
    canAssignProjects: true,
    canManageProjectMembers: true,
    canManageProjects: true,
  };
}

export function useArticlePermissions() {
  return {
    canViewArticles: true,
    canCreateArticles: true,
    canUpdateArticles: true,
    canDeleteArticles: true,
    canPublishArticles: true,
    canApproveArticles: true,
    canManageArticles: true,
  };
}

export function useTopicPermissions() {
  return {
    canViewTopics: true,
    canCreateTopics: true,
    canUpdateTopics: true,
    canDeleteTopics: true,
    canManageTopics: true,
  };
}





export function useSettingsPermissions() {
  return {
    canViewSettings: true,
    canUpdateSettings: true,
    canSystemConfig: true,
    canManageSettings: true,
  };
}



// Notification permissions removed for single-user application

// Hook for checking if user can access specific features
export function useFeatureAccess() {
  return {
    canAccessUserManagement: false, // Removed for single-user
    canAccessRoleManagement: false, // Removed for single-user
    canAccessProjectManagement: true,
    canAccessContentManagement: true,
    canAccessSystemAdmin: true,

    getUserManagementLevel: () => 'none',
    getRoleManagementLevel: () => 'none',
    getProjectManagementLevel: () => 'full',
    getContentManagementLevel: () => 'full',
    getSystemAdminLevel: () => 'full',
  };
}

// Hook for role-based access
export function useRoleAccess() {
  const {
    isAdmin,
    isAgencyOwner,
    isProjectManager,
    isAccountManager,
    isAgencyMember,
    isStaff,
  } = usePermissions();

  return {
    isAdmin,
    isAgencyOwner,
    isProjectManager,
    isAccountManager,
    isAgencyMember,
    isStaff,

    // Role hierarchy checks
    isSuperAdmin: isAdmin,
    isManagementLevel:
      isAdmin || isAgencyOwner || isProjectManager || isAccountManager,
    isAgencyLevel: isAgencyOwner || isAgencyMember,
    isStaffLevel: isStaff,
  };
}

export function useIndustryGuidelinePermissions() {
  return {
    canViewIndustryGuidelines: true,
    canCreateIndustryGuidelines: true,
    canUpdateIndustryGuidelines: true,
    canDeleteIndustryGuidelines: true,
    canManageIndustryGuidelines: true,
  };
}

export function useSystemPromptPermissions() {
  return {
    canViewSystemPrompts: true,
    canCreateSystemPrompts: true,
    canUpdateSystemPrompts: true,
    canDeleteSystemPrompts: true,
    canManageSystemPrompts: true,
  };
}

export function useActivityLogPermissions() {
  return {
    canViewActivityLogs: true,
  };
}

export function useProjectActivityPermissions() {
  return {
    canViewProjectActivity: true,
  };
}
