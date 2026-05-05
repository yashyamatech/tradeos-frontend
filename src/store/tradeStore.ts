import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export type TradeDirection = 'BUY' | 'SELL';
export type TradeStatus   = 'open' | 'closed';

export const BROKERAGE_PER_TRADE = 100;

export interface Trade {
  id:         string;
  symbol:     string;
  direction:  TradeDirection;
  quantity:   number;
  entryPrice: number;
  stopLoss:   number;
  target:     number;
  exitPrice?: number;
  pnl?:       number;
  status:     TradeStatus;
  notes?:     string;
  isPaper:    boolean;
  createdAt:  string;
  closedAt?:  string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(t: any): Trade {
  return {
    id:         t.id,
    symbol:     t.symbol,
    direction:  (t.direction ?? 'BUY') as TradeDirection,
    quantity:   t.quantity  ?? 1,
    entryPrice: t.entry_price,
    stopLoss:   t.stop_loss ?? 0,
    target:     t.target    ?? 0,
    exitPrice:  t.exit_price ?? undefined,
    pnl:        t.pnl        ?? undefined,
    status:     (t.status   ?? 'open') as TradeStatus,
    notes:      t.notes      ?? undefined,
    isPaper:    t.is_paper   ?? true,
    createdAt:  t.created_at ?? '',
    closedAt:   t.closed_at  ?? undefined,
  };
}

async function apiError(res: Response, fallback: string): Promise<string> {
  try { const b = await res.json(); return b.detail ?? fallback; }
  catch { return fallback; }
}

export function tradeBrokerage(_t: Trade): number { return BROKERAGE_PER_TRADE; }
export function tradeNetPnl(t: Trade): number {
  if (t.status !== 'closed') return 0;
  return (t.pnl ?? 0) - BROKERAGE_PER_TRADE;
}
export function tradeRFactor(t: Trade): number | null {
  const risk = Math.abs(t.entryPrice - t.stopLoss);
  if (risk < 0.001) return null;
  return parseFloat((Math.abs(t.target - t.entryPrice) / risk).toFixed(2));
}
export function isTradeToday(t: Trade): boolean {
  const d = new Date(t.createdAt), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

interface TradeState {
  trades:      Trade[];
  loading:     boolean;
  error:       string | null;
  fetchTrades: () => Promise<void>;
  createTrade: (t: Omit<Trade, 'id' | 'createdAt' | 'status' | 'pnl'>) => Promise<void>;
  closeTrade:  (id: string, exitPrice: number) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
}

export const useTradeStore = create<TradeState>((set) => ({
  trades: [], loading: false, error: null,

  fetchTrades: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/trades/');
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      set({ trades: (await res.json()).map(fromApi), loading: false });
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to load trades', loading: false }); }
  },

  createTrade: async (t) => {
    set({ error: null });
    try {
      const res = await apiFetch('/api/trades/', {
        method: 'POST',
        body: JSON.stringify({
          symbol: t.symbol, direction: t.direction, quantity: t.quantity,
          entry_price: t.entryPrice, stop_loss: t.stopLoss, target: t.target,
          notes: t.notes ?? null, is_paper: t.isPaper,
        }),
      });
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      set((s) => ({ trades: [fromApi(await res.json()), ...s.trades] }));
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to create trade' }); }
  },

  closeTrade: async (id, exitPrice) => {
    set({ error: null });
    try {
      const res = await apiFetch(`/api/trades/${id}/close?exit_price=${exitPrice}`, { method: 'POST' });
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      const updated = fromApi(await res.json());
      set((s) => ({ trades: s.trades.map((t) => (t.id === id ? updated : t)) }));
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to close trade' }); }
  },

  deleteTrade: async (id) => {
    set({ error: null });
    try {
      const res = await apiFetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await apiError(res, `HTTP ${res.status}`));
      set((s) => ({ trades: s.trades.filter((t) => t.id !== id) }));
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Failed to delete trade' }); }
  },
}));
