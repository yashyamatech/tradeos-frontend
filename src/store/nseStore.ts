import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface Sector {
  name: string;
  last: number;
  change: number;
  pctChange: number;
  open: number;
  high: number;
  low: number;
  advances: number;
  declines: number;
  unchanged: number;
}

export type HeatmapType = 'sectoral' | 'broad';

interface NseState {
  sectors: Sector[];
  activeType: HeatmapType;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  setType: (t: HeatmapType) => void;
  fetch: (type?: HeatmapType) => Promise<void>;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

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
      const res = await apiFetch(`/api/nse/heatmap?type=${t}`);
      if (!res.ok) {
        const msg = await parseError(res, `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const data = await res.json();
      set({ sectors: data.sectors ?? [], loading: false, lastUpdated: new Date() });
    } catch (e: unknown) {
      const msg =
        e instanceof TypeError && e.message === 'Failed to fetch'
          ? 'Cannot reach backend — check NEXT_PUBLIC_API_URL'
          : e instanceof Error
          ? e.message
          : 'Failed to load';
      set({ error: msg, loading: false });
    }
  },
}));
