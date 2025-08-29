// Gender enum
export enum EnumGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

// Single user role - no complex permissions needed
export enum UserRole {
  USER = 'user',
}

// Role types for single-user application
export const ROLES_TYPES = {
  IS_ADMIN_ROLE_CODE: 'user', // Single user has access to all their data
};

// Simple user type for single-user application
export type User = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
};