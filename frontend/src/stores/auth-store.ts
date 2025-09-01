import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: {
      _id: '68b3753a60d95aed066d72fe',
      email: 'drabadiya@taskme.biz'
    },
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGIzNzUzYTYwZDk1YWVkMDY2ZDcyZmUiLCJlbWFpbCI6ImRyYWJhZGl5YUB0YXNrbWUuYml6IiwiaWF0IjoxNzU2NzIzMDA1LCJleHAiOjE3NTY4MDk0MDV9.TcQVZ_rt6ZDTQV9nsABH4993Hch-kIWsTjMJOIL0lu0',
    refreshToken: null,
    isAuthenticated: true,
    
    login: (user: User, token: string, refreshToken?: string) => {
      set({
        user,
        token,
        refreshToken: refreshToken || null,
        isAuthenticated: true
      });
    },
    
    logout: () => {
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false
      });
    },
    
    setToken: (token: string) => {
      set((state) => ({
        ...state,
        token,
        isAuthenticated: !!token
      }));
    }
  }),
  {
    name: 'auth-storage',
  }
));
