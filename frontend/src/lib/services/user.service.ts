import api from '@/lib/api';
import { User } from '@/stores/auth-store';

// Types for team member API
// interface TeamMember { // Removed for single-user app
//   id: string;
//   staffid: string;
//   agency_id: string;
//   firstname: string;
//   lastname: string;
//   name: string;
//   agency_name: string;
//   profile_image: string | null;
//   role_name: string;
// }

// interface ListMembersResponse { // Removed for single-user app
//   data: TeamMember[];
//   message: string;
//   status: boolean;
// }

interface AgencyMemberManager {
  id: string;
  firstname: string;
  lastname: string;
  profile_image: string | null;
}

export interface AgencyMember {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  profile_image: string | null;
  agency_name: string;
  last_login: string;
  created_at: string;
  designation_name: string | null;
  role_name: string;
  managed_by: AgencyMemberManager[];
}

export interface AgencyMembersResponse {
  status: boolean;
  message: string;
  pagination?: {
    total_records: number;
    current_page: number;
    total_pages: number;
  };
  data: AgencyMember[];
}

export interface GetAgencyMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean | string;
  sort?: string;
  [key: string]: any;
}

export interface CreateAgencyOwnerPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  roleId: string;
  agency_name: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  phonenumber: string;
}

export interface CreateAgencyMemberPayload {
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  roleId: string;
  agencyId?: string;
}

export interface CreateAgencyMemberResponse {
  status: boolean;
  message: string;
}

// export interface StaffMember { // Removed for single-user app
//   id: string;
//   full_name: string;
//   email: string;
//   designation_name: string;
//   role_name: string;
//   last_login: string;
//   agency_name: string | null;
//   is_active: boolean;
//   profile_image: string | null;
//   created_at: string;
//   managed_by: any | null;
// }

// export interface StaffMembersResponse { // Removed for single-user app
//   status: boolean;
//   message: string;
//   pagination: {
//     total_records: number;
//     current_page: number;
//     total_pages: number;
//   };
//   data: StaffMember[];
// }

// export interface GetStaffMembersParams { // Removed for single-user app
//   page?: number;
//   limit?: number;
//   search?: string;
//   active?: boolean | string;
//   sort?: string;
//   [key: string]: any;
// }

export interface UserDetailsResponse {
  status: boolean;
  message: string;
  data: {
    id: string;
    created_at: string;
    email: string;
    firstname: string;
    lastname: string;
    phonenumber: string;
    profile_image: string | null;
    dob: string | null;
    gender: string;
    active: boolean;
    two_factor_auth_enabled: boolean;
    email_signature: string;
    is_wfh: boolean | null;
    date_of_joining: string | null;
    agency_profile_preferences: string | null;
    calendly_url: string | null;
    google_drive: string | null;
    role: {
      id: string;
      created_at: string;
      code: string;
      name: string;
      getPermissions: string[];
    };
    agency_detail: any;
    designation: {
      id: string;
      name: string;
    };
    timezone: string;
    country: string;
    state: string;
    city: string;
    managed_by: User[];
    custom_permissions: {
      id: string;
      permissions: string[];
    } | null;
  };
}

class UserService {
  /**
   * Get list of team members
   */
  // async getTeamMembers(): Promise<ListMembersResponse> { // Removed for single-user app
  //   try {
  //     const response = await api.get<ListMembersResponse>(
  //       '/users/list-members'
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw this.handleError(error);
  //   }
  // }

  /**
   * Get list of agency members
   */
  async getAgencyMembers(
    params: GetAgencyMembersParams = {}
  ): Promise<AgencyMembersResponse> {
    try {
      const response = await api.get<AgencyMembersResponse>(
        '/users/agency-members',
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of staff members
   */
  // async getStaffMembers( // Removed for single-user app
  //   params: GetStaffMembersParams = {}
  // ): Promise<StaffMembersResponse> {
  //   try {
  //     const response = await api.get<StaffMembersResponse>(
  //       '/users/staff-members',
  //       { params }
  //     );
  //     return response.data;
  //   } catch (error) {
  //     throw this.handleError(error);
  //   }
  // }

  /**
   * Get user
   */
  async getUser(id: string): Promise<User> {
    try {
      const response = await api.get<User>('/users/' + id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user details by ID
   */
  async getUserDetails(id: string): Promise<UserDetailsResponse> {
    try {
      const response = await api.get<UserDetailsResponse>(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update staff member status (activate/inactive)
   */
  async updateStaffMemberStatus(
    userId: string,
    active: boolean
  ): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.patch<{ status: boolean; message: string }>(
        `/users/${userId}`,
        { active }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update staff member details
   */
  async updateStaffMember(
    userId: string,
    payload: any
  ): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.patch<{ status: boolean; message: string }>(
        `/users/${userId}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new agency member
   */
  async createAgencyMember(
    payload: CreateAgencyOwnerPayload | CreateAgencyMemberPayload
  ): Promise<CreateAgencyMemberResponse> {
    try {
      const response = await api.post<CreateAgencyMemberResponse>(
        '/users',
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk assign staff members to agencies/managers
   */
  async staffBulkAction(payload: {
    agency_ids: string[];
    managers_ids: string[];
    is_primary: boolean;
    is_remove: boolean;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.post<{ status: boolean; message: string }>(
        '/users/staff-bulk-action',
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of designations
   */
  async getDesignations(): Promise<{
    status: boolean;
    message: string;
    data: { id: string; name: string }[];
  }> {
    try {
      const response = await api.get('/designations/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of roles
   */
  async getRoles(): Promise<{
    status: boolean;
    message: string;
    data: { id: string; code: string; name: string }[];
  }> {
    try {
      const response = await api.get('/roles/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Assign or update a custom permission for a user
   */
  async assignUserPermission({
    userId,
    permission,
    delete: isDelete = false,
  }: {
    userId: string;
    permission: string[];
    delete?: boolean;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.post<{ status: boolean; message: string }>(
        '/roles/user-permissions',
        {
          userId,
          permission,
          delete: isDelete,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single agency member by ID
   */
  async getUserById(id: string): Promise<any> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an agency member by ID
   */
  async updateUser(
    id: string,
    payload: any
  ): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.patch<{ status: boolean; message: string }>(
        `/users/${id}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a staff member by ID
   */
  async deleteStaffMember(
    id: string
  ): Promise<{ status: boolean; message: string }> {
    try {
      const response = await api.delete<{ status: boolean; message: string }>(
        `/users/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new UserService();
// export type { TeamMember }; // Removed for single-user app

/**
 * Auto login as another user (admin functionality)
 */
// autoLogin function removed - not needed in single-user application
