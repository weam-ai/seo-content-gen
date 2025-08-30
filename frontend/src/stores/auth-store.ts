import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Designation {
  _id: string;
  name: string;
  description?: string;
}

export interface User {
  _id: string;
  id?: string; // For backward compatibility
  name?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  designation?: Designation;
  profile_image?: string;
}

interface AuthState {
  user: User;
  token: string;
  refreshToken: string;
  isAuthenticated: boolean;
  logout: () => void;
}

// Static user and JWT token for single-user application
const staticUser: User = {
  _id: '68b36dc217326325f119e817',
  id: '68b36dc217326325f119e817', // For backward compatibility
  name: 'SEO User',
  email: 'drabadiya@taskme.biz',
  firstname: 'SEO',
  lastname: 'User',
  designation: {
    _id: '66e01d4145567d34d663bdae',
    name: 'Super Admin'
  },
  profile_image: '/placeholder-user.jpg'
};

const staticToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGIzNmRjMjE3MzI2MzI1ZjExOWU4MTciLCJ1c2VySWQiOiI2OGIzNmRjMjE3MzI2MzI1ZjExOWU4MTciLCJlbWFpbCI6ImRyYWJhZGl5YUB0YXNrbWUuYml6Iiwicm9sZUNvZGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc1NjU4OTU0NywiZXhwIjoxNzU2Njc1OTQ3fQ.j85kIwMM4eUUNF-410Rg3j-ofEYWHDjMyeucThhmenU';

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: staticUser,
    token: staticToken,
    refreshToken: 'static-refresh-token',
    isAuthenticated: true,
    
    logout: () => {
      // For single-user app, logout just resets to the same static user
      set({
        user: staticUser,
        token: staticToken,
        refreshToken: 'static-refresh-token',
        isAuthenticated: true
      });
    }
  }),
  {
    name: 'auth-storage',
  }
));
