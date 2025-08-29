import { create } from 'zustand';

// Role interface removed for single-user application

interface Designation {
  id: string;
  created_at: string;
  name: string;
}

export interface User {
  id: string;
  created_at: string;
  email: string;
  firstname: string;
  lastname: string;
  phonenumber: string;
  profile_image: string;
  dob: string;
  gender: string;
  active: boolean;
  two_factor_auth_enabled: boolean;
  email_signature: string;
  is_wfh: boolean;
  date_of_joining: string;
  agency_profile_preferences: string;
  calendly_url: string;
  google_drive: string;
  // role property removed for single-user application
  agency_detail: any;
  designation: Designation;
  timezone: string;
  country: string;
  state: string;
  city: string;
}

interface AuthState {
  user: User;
  isAuthenticated: boolean;
  token: string;
  refreshToken: string;
  updateUser: (user: Partial<User>) => void;
}

// Static user data for single-user application
const staticUser: User = {
  id: 'static-user-1',
  created_at: new Date().toISOString(),
  email: 'user@seo-content-gen.local',
  firstname: 'SEO',
  lastname: 'User',
  phonenumber: '+1234567890',
  profile_image: '',
  dob: '1990-01-01',
  gender: 'other',
  active: true,
  two_factor_auth_enabled: false,
  email_signature: '',
  is_wfh: false,
  date_of_joining: new Date().toISOString(),
  agency_profile_preferences: '',
  calendly_url: '',
  google_drive: '',
  // role property removed for single-user application
  agency_detail: null,
  designation: {
    id: 'content-creator',
    created_at: new Date().toISOString(),
    name: 'Content Creator'
  },
  timezone: 'UTC',
  country: 'US',
  state: 'CA',
  city: 'San Francisco'
};

export const useAuthStore = create<AuthState>()(() => ({
  user: staticUser,
  isAuthenticated: true,
  token: 'static-jwt-token-for-local-testing',
  refreshToken: 'static-refresh-token-for-local-testing',
  updateUser: () => {
    // No-op for static user - could be enhanced to update static data if needed
  },
}));
