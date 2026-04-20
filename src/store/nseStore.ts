import { create } from 'zustand';

export interface Sector {
  name: string;
  last: number;
  change: number;
  pctChange: number;
  open: number;
  high: number;
  low: number;
  yearHigh: number;
  yearLow: number;
  advances: number;
  declines: number;
  unchanged: number;
}

interface NseState {
  sectors: Sector[];
  timestamp: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetch: () => Promise<void>;
}

const API = () => process.env.NEXT_PUBLIC_API_URL ?? '';

export const useNseStore = create<NseState>((set) => ({
  sectors: [],
  timestamp: null,
  loading: false,
  error: null,
  lastUpdated: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API()}/api/nse/heatmap`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        sectors: data.sectors ?? [],
        timestamp: data.timestamp,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed', loading: false });
    }
  },
}));
