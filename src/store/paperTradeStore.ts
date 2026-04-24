import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export type OptionType     = 'CE' | 'PE';
export type UnderlyingType = 'index' | 'equity';
export type TradeStatus    = 'open' | 'closed';

export interface PaperTrade {
  id:             string;
  symbol:         string;
  underlyingType: UnderlyingType;
  optionType:     OptionType;
  strike:         number;
  expiry:         string;
  lotSize:        number;
  lots:           number;
  entryPrice:     number;
  stopLoss:       number;
  target:         number;
  entryAt:        string;
  exitPrice?:     number;
  exitAt?:        string;
  status:         TradeStatus;
  pnl?:           number;
  ltp?:           number;   // in-memory only, not persisted
  notes?:         string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApi(t: any): PaperTrade {
  return {
    id:             t.id,
    symbol:         t.symbol,
    underlyingType: (t.underlying_type ?? 'index') as UnderlyingType,
    optionType:     (t.option_type ?? 'CE') as OptionType,
    strike:         t.strike,
    expiry:         t.expiry,
    lotSize:        t.lot_size  ?? 1,
    lots:           t.lots      ?? 1,
    entryPrice:     t.entry_price,
    stopLoss:       t.stop_loss ?? 0,
    target:         t.target    ?? 0,
    exitPrice:      t.exit_price ?? undefined,
    exitAt:         t.closed_at  ?? undefined,
    entryAt:        t.created_at ?? '',
    status:         (t.status ?? 'open') as TradeStatus,
    pnl:            t.pnl ?? undefined,
    notes:          t.notes ?? undefined,
  };
}

export function tradePnl(trade: PaperTrade): number {
  if (trade.status === 'closed') return trade.pnl ?? 0;
  const ltp = trade.ltp ?? trade.entryPrice;
  return (ltp - trade.entryPrice) * trade.lotSize * trade.lots;
}

export function tradeRFactor(trade: PaperTrade): number | null {
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  if (risk < 0.001) return null;
  return parseFloat((Math.abs(trade.target - trade.entryPrice) / risk).toFixed(2));
}

interface PaperTradeState {
  trades:       PaperTrade[];
  loading:      boolean;
  error:        string | null;
  fetchTrades:  () => Promise<void>;
  createTrade:  (t: Omit<PaperTrade, 'id' | 'entryAt' | 'status' | 'ltp' | 'pnl'>) => Promise<void>;
  closeTrade:   (id: string, exitPrice: number) => Promise<void>;
  deleteTrade:  (id: string) => Promise<void>;
  updateLtp:    (id: string, ltp: number) => void;
}

export const usePaperTradeStore = create<PaperTradeState>((set) => ({
  trades:  [],
  loading: false,
  error:   null,

  fetchTrades: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/trades/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ trades: data.map(fromApi), loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load trades', loading: false });
    }
  },

  createTrade: async (t) => {
    try {
      const res = await apiFetch('/api/trades/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol:          t.symbol,
          underlying_type: t.underlyingType,
          option_type:     t.optionType,
          strike:          t.strike,
          expiry:          t.expiry,
          lot_size:        t.lotSize,
          lots:            t.lots,
          entry_price:     t.entryPrice,
          stop_loss:       t.stopLoss,
          target:          t.target,
          notes:           t.notes ?? null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = fromApi(await res.json());
      set((s) => ({ trades: [created, ...s.trades] }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to create trade' });
    }
  },

  closeTrade: async (id, exitPrice) => {
    try {
      const res = await apiFetch(
        `/api/trades/${id}/close?exit_price=${exitPrice}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = fromApi(await res.json());
      set((s) => ({ trades: s.trades.map((t) => (t.id === id ? updated : t)) }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to close trade' });
    }
  },

  deleteTrade: async (id) => {
    try {
      const res = await apiFetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({ trades: s.trades.filter((t) => t.id !== id) }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to delete trade' });
    }
  },

  updateLtp: (id, ltp) =>
    set((s) => ({ trades: s.trades.map((t) => (t.id === id ? { ...t, ltp } : t)) })),
}));
