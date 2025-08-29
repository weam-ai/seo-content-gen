import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface SessionState {
  sessionId: string;
  initSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: '',
  initSession: () => {
    // Generate a new session ID if one doesn't exist
    set({ sessionId: uuidv4() });
  },
}));
