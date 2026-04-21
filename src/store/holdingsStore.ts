import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface Holding {
  displaySymbol: string;
  symbol: string;
  quantity: number;
  sellableQuantity: number;
  averagePrice: number;
  closingPrice: number;
  mktValue: number;
  holdingCost: number;
  scripId: string;
  exchangeSegment: string;
  instrumentType: string;
}

interface HoldingsState {
  holdings: Holding[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  load: () => Promise<void>;
  totalInvested: () => number;
  currentValue: () => number;
  totalPnl: () => number;
  totalPnlPct: () => number;
}

export const useHoldingsStore = create<HoldingsState>((set, get) => ({
  holdings: [],
  loading: false,
  error: null,
  lastUpdated: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/market/holdings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw: unknown[] = data?.holdings?.data ?? data?.holdings ?? [];
      set({
        holdings: Array.isArray(raw) ? (raw as Holding[]) : [],
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load', loading: false });
    }
  },

  totalInvested: () => get().holdings.reduce((s, h) => s + (Number(h.holdingCost) || 0), 0),
  currentValue:  () => get().holdings.reduce((s, h) => s + (Number(h.mktValue) || 0), 0),
  totalPnl:      () => get().currentValue() - get().totalInvested(),
  totalPnlPct:   () => {
    const inv = get().totalInvested();
    return inv ? (get().totalPnl() / inv) * 100 : 0;
  },
}));
