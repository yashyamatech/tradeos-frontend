import { create } from 'zustand';

interface KotakAuthState {
  authenticated: boolean;
  authDate: string | null;
  sid: string | null;
  connecting: boolean;
  disconnecting: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const API = () => process.env.NEXT_PUBLIC_API_URL ?? '';

export const useMarketStore = create<KotakAuthState>((set) => ({
  authenticated: false,
  authDate: null,
  sid: null,
  connecting: false,
  disconnecting: false,
  error: null,

  fetchStatus: async () => {
    try {
      const res = await window.fetch(`${API()}/api/auth/status`, { cache: 'no-store' });
      const data = await res.json();
      set({ authenticated: data.authenticated, authDate: data.auth_date, sid: data.sid });
    } catch {
      set({ authenticated: false });
    }
  },

  connect: async () => {
    set({ connecting: true, error: null });
    try {
      const res = await window.fetch(`${API()}/api/auth/login`, { method: 'POST', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Login failed');
      set({ authenticated: true, authDate: data.auth_date, sid: data.sid, connecting: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Error', connecting: false });
    }
  },

  disconnect: async () => {
    set({ disconnecting: true, error: null });
    try {
      await window.fetch(`${API()}/api/auth/logout`, { method: 'POST', cache: 'no-store' });
    } catch { /* best-effort */ }
    set({ authenticated: false, authDate: null, sid: null, disconnecting: false });
  },
}));
