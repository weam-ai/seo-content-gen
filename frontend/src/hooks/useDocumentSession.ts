import { useState, useEffect } from 'react';
import { useSessionStore } from '@/lib/store/session-store';

export const useDocumentSession = (docId: string) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionStore = useSessionStore();

  useEffect(() => {
    if (docId && sessionStore?.sessionId) {
      // Generate a unique session ID for this document and user
      const generateSessionId = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${docId}-${sessionStore.sessionId}-${timestamp}-${random}`;
      };

      const session = generateSessionId();
      setSessionId(session);
    }
  }, [docId, sessionStore?.sessionId]);

  return { sessionId };
};
