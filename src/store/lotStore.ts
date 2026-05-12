import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface StockLot {
  id:        string;
  symbol:    string;
  lotSize:   number;
  notes?:    string;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(l: any): StockLot {
  return {
    id:        l.id,
    symbol:    l.symbol,
    lotSize:   l.lot_size,
    notes:     l.notes ?? undefined,
    createdAt: l.created_at ?? '',
    updatedAt: l.updated_at ?? '',
  };
}

async function apiError(res: Response, fallback: string): Promise<string> {
  try { const b = await res.json(); return b.detail ?? fallback; }
  catch { return fallback; }
}

function sortBySymbol(lots: StockLot[]) {
  return [...lots].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

interface LotState {
  lots:      StockLot[];
  loading:   boolean;
  error:     string | null;
  fetchLots:  () => Promise<void>;
  createLot:  (symbol: string, lotSize: number, notes?: string) => Promise<boolean>;
  updateLot:  (id: string, symbol: string, lotSize: number, notes?: string) => Promise<boolean>;
  deleteLot:  (id: string) => Promise<void>;
}

export const useLotStore = create<LotState>((set) => ({
  lots: [], loading: false, error: null,

  fetchLots: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/lots/');
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      set({ lots: sortBySymbol((await res.json()).map(fromApi)), loading: false });
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to load lots', loading: false }); }
  },

  createLot: async (symbol, lotSize, notes) => {
    set({ error: null });
    try {
      const res = await apiFetch('/api/lots/', {
        method: 'POST',
        body: JSON.stringify({ symbol, lot_size: lotSize, notes: notes || null }),
      });
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      const created = fromApi(await res.json());
      set((s) => ({ lots: sortBySymbol([...s.lots, created]) }));
      return true;
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to create lot' }); return false; }
  },

  updateLot: async (id, symbol, lotSize, notes) => {
    set({ error: null });
    try {
      const res = await apiFetch(`/api/lots/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ symbol, lot_size: lotSize, notes: notes || null }),
      });
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      const updated = fromApi(await res.json());
      set((s) => ({ lots: sortBySymbol(s.lots.map((l) => l.id === id ? updated : l)) }));
      return true;
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to update lot' }); return false; }
  },

  deleteLot: async (id) => {
    set({ error: null });
    try {
      const res = await apiFetch(`/api/lots/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      set((s) => ({ lots: s.lots.filter((l) => l.id !== id) }));
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to delete lot' }); }
  },
}));
