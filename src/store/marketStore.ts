import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

interface KotakAuthState {
  authenticated: boolean;
  authDate: string | null;
  connecting: boolean;
  disconnecting: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useMarketStore = create<KotakAuthState>((set) => ({
  authenticated: false,
  authDate: null,
  connecting: false,
  disconnecting: false,
  error: null,

  fetchStatus: async () => {
    try {
      const res = await apiFetch('/api/auth/status');
      const data = await res.json();
      set({ authenticated: data.authenticated, authDate: data.auth_date });
    } catch {
      set({ authenticated: false });
    }
  },

  connect: async () => {
    set({ connecting: true, error: null });
    try {
      const res = await apiFetch('/api/auth/login', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Login failed');
      set({ authenticated: true, authDate: data.auth_date, connecting: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Error', connecting: false });
    }
  },

  disconnect: async () => {
    set({ disconnecting: true, error: null });
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch { /* best-effort */ }
    set({ authenticated: false, authDate: null, disconnecting: false });
  },
}));
