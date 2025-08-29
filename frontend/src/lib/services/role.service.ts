// Commented out for single-user application
// import api from '@/lib/api';

// Protected role codes that cannot be deleted or have their code edited
// Commented out for single-user application
// export const PROTECTED_ROLE_CODES = {
//   IS_AGENCY_OWNER_ROLE_CODE: 'agency_owner',
//   IS_AGENCY_MEMBER_ROLE_CODE: 'agency_member',
//   IS_ADMIN_ROLE_CODE: 'admin',
//   IS_PROJECT_MANAGER_CODE: 'project_manager',
//   IS_ACCOUNT_MANAGER_CODE: 'account_manager',
// } as const;

// export const PROTECTED_ROLE_CODES_LIST = Object.values(PROTECTED_ROLE_CODES);

// Types for role API
export interface Role {
  id: string;
  code: string;
  name: string;
  user_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  permissions?: string[];
}

export interface Permission {
  feature: string;
  capability: string[];
}

export interface RoleListResponse {
  status: boolean;
  message: string;
  data: Role[];
  pagination?: {
    total_records: number;
    current_page: number;
    total_pages: number;
  };
}

export interface RoleDetailResponse {
  status: boolean;
  message: string;
  data: Role;
}

export interface PermissionsResponse {
  status: boolean;
  message: string;
  data: Permission[];
}

export interface CreateRolePayload {
  name: string;
  code: string;
  permissions: string[];
}

export interface CreateRoleResponse {
  status: boolean;
  message: string;
  data: Role;
}

export interface DeleteRoleResponse {
  status: boolean;
  message: string;
}

export interface GetRolesParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

// Commented out for single-user application - role management not needed
// class RoleService {
//   /**
//    * Check if a role is protected from deletion/editing
//    */
//   isProtectedRole(roleCode: string): boolean {
//     return PROTECTED_ROLE_CODES_LIST.includes(roleCode as any);
//   }

//   /**
//    * Get list of roles
//    */
//   async getRoles(params: GetRolesParams = {}): Promise<RoleListResponse> {
//     try {
//       const response = await api.get<RoleListResponse>('/roles', { params });
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   /**
//    * Get role by ID
//    */
//   async getRoleById(roleId: string): Promise<RoleDetailResponse> {
//     try {
//       const response = await api.get<RoleDetailResponse>(`/roles/${roleId}`);
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   /**
//    * Create new role
//    */
//   async createRole(payload: CreateRolePayload): Promise<CreateRoleResponse> {
//     try {
//       const response = await api.post<CreateRoleResponse>('/roles', payload);
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   /**
//    * Update role
//    */
//   async updateRole(
//     roleId: string,
//     payload: Partial<CreateRolePayload>
//   ): Promise<CreateRoleResponse> {
//     try {
//       const response = await api.patch<CreateRoleResponse>(
//         `/roles/${roleId}`,
//         payload
//       );
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   /**
//    * Delete role
//    */
//   async deleteRole(roleId: string): Promise<DeleteRoleResponse> {
//     try {
//       const response = await api.delete<DeleteRoleResponse>(`/roles/${roleId}`);
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   /**
//    * Get all permissions
//    */
//   async getPermissions(): Promise<PermissionsResponse> {
//     try {
//       const response = await api.get<PermissionsResponse>('/roles/permissions');
//       return response.data;
//     } catch (error) {
//       throw this.handleError(error);
//     }
//   }

//   /**
//    * Handle API errors
//    */
//   private handleError(error: any): Error {
//     if (error.response) {
//       // Server responded with error status
//       const message = error.response.data?.message || 'An error occurred';
//       return new Error(message);
//     } else if (error.request) {
//       // Request was made but no response received
//       return new Error('Network error. Please check your connection.');
//     } else {
//       // Something else happened
//       return new Error(error.message || 'An unexpected error occurred');
//     }
//   }
// }

// Simplified service for single-user application
class RoleService {
  async getPermissions(): Promise<PermissionsResponse> {
    // Return empty permissions for single-user application
    return {
      status: true,
      message: 'No permissions needed for single user',
      data: []
    };
  }
}

export default new RoleService();
