import { useEffect } from 'react';

/**
 * Custom hook for Server-Sent Events (SSE) integration
 * Used for real-time AI content streaming
 */
export function useSSE(requestId: string, onUpdate: (data: any) => void) {
  useEffect(() => {
    if (!requestId) return;
    
    const url = `${import.meta.env.VITE_API_BASE_URL}/sse/${requestId}`;
    const eventSource = new window.EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'content_update') {
          onUpdate(data.content);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [requestId, onUpdate]);
}

export default useSSE;