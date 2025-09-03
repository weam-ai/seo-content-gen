import { create } from 'zustand';
import { decryptedPersist } from '@/stores/decryption';
import CryptoJS from 'crypto-js';

interface MinimalUser {
  id: string;
  email: string;
}

interface AuthState {
  getUser: () => MinimalUser;
  getJwtToken: () => string;
}

export const useAuthStore = create<AuthState>(() => ({
  getUser: () => {
    try {
      if (typeof window === 'undefined') return null;
      const decrypted = decryptedPersist('user');
      const id = decrypted._id;
      const email = decrypted.email;
      return { id, email } as any;
    } catch(error){
      console.error("getUser -> error", error)
    }
    
  },
  getJwtToken: () => {
    if (typeof window === 'undefined') return '';
    const u = useAuthStore.getState().getUser();

    const secret = `${(import.meta as any).env?.VITE_JWT_SECRET || ''}`;

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { id: u.id, email: u.email };

    const toBase64Url = (obj: unknown) => {
      const json = JSON.stringify(obj);
      const wordArray = CryptoJS.enc.Utf8.parse(json);
      const b64 = CryptoJS.enc.Base64.stringify(wordArray);
      return b64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };

    const headerB64 = toBase64Url(header);
    const payloadB64 = toBase64Url(payload);
    const base = `${headerB64}.${payloadB64}`;
    const signature = CryptoJS.HmacSHA256(base, secret);
    const sigB64 = CryptoJS.enc.Base64.stringify(signature)
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return `${base}.${sigB64}`;
  },
}));