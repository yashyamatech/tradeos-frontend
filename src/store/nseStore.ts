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

export type HeatmapType = 'sectoral' | 'broad' | 'thematic' | 'strategy';

interface NseState {
  sectors: Sector[];
  activeType: HeatmapType;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  setType: (t: HeatmapType) => void;
  fetch: (type?: HeatmapType) => Promise<void>;
}

const API = () => process.env.NEXT_PUBLIC_API_URL ?? '';

export const useNseStore = create<NseState>((set, get) => ({
  sectors: [],
  activeType: 'sectoral',
  loading: false,
  error: null,
  lastUpdated: null,

  setType: (t) => {
    set({ activeType: t, sectors: [] });
    get().fetch(t);
  },

  fetch: async (type) => {
    const t = type ?? get().activeType;
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API()}/api/nse/heatmap?type=${t}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ sectors: data.sectors ?? [], loading: false, lastUpdated: new Date() });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed', loading: false });
    }
  },
}));
