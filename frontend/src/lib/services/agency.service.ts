// Agency service removed for single-user application
// import api from '@/lib/api';

// interface AgencyUser {
//   id: string;
//   staffid: string;
//   agency_id: string;
//   firstname: string;
//   lastname: string;
//   name: string;
//   agency_name: string;
//   profile_image: string | null;
// }

// interface AgenciesResponse {
//   status: boolean;
//   message: string;
//   data: AgencyUser[];
// }

// class AgencyService {
//   /**
//    * Fetch list of agencies (users associated with agencies)
//    */
//   async getAgencies(): Promise<AgenciesResponse> {
//     try {
//       const response = await api.get<AgenciesResponse>('/users/list-agencies');
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
//       const message = error.response.data?.message || 'An error occurred';
//       return new Error(message);
//     } else if (error.request) {
//       return new Error('Network error. Please check your connection.');
//     } else {
//       return new Error(error.message || 'An unexpected error occurred');
//     }
//   }
// }

// export default new AgencyService();
// export type { AgencyUser };

// Placeholder export for single-user application
export default {};
export type AgencyUser = {};
