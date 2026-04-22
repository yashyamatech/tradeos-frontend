import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OptionType      = 'CE' | 'PE';
export type UnderlyingType  = 'index' | 'equity';
export type TradeStatus     = 'open' | 'closed';

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
  ltp?:           number;
  notes?:         string;
}

export function tradePnl(trade: PaperTrade): number {
  const price = trade.status === 'closed'
    ? (trade.exitPrice ?? trade.entryPrice)
    : (trade.ltp      ?? trade.entryPrice);
  return (price - trade.entryPrice) * trade.lotSize * trade.lots;
}

export function tradeRFactor(trade: PaperTrade): number | null {
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  if (risk < 0.001) return null;
  return parseFloat((Math.abs(trade.target - trade.entryPrice) / risk).toFixed(2));
}

interface PaperTradeState {
  trades:      PaperTrade[];
  addTrade:    (t: Omit<PaperTrade, 'id' | 'entryAt' | 'status'>) => void;
  closeTrade:  (id: string, exitPrice: number) => void;
  updateLtp:   (id: string, ltp: number) => void;
  removeTrade: (id: string) => void;
}

export const usePaperTradeStore = create<PaperTradeState>()(
  persist(
    (set) => ({
      trades: [],
      addTrade: (t) =>
        set((s) => ({
          trades: [
            ...s.trades,
            { ...t, id: `pt-${Date.now()}`, entryAt: new Date().toISOString(), status: 'open' },
          ],
        })),
      closeTrade: (id, exitPrice) =>
        set((s) => ({
          trades: s.trades.map((t) =>
            t.id === id
              ? { ...t, exitPrice, exitAt: new Date().toISOString(), status: 'closed' }
              : t
          ),
        })),
      updateLtp: (id, ltp) =>
        set((s) => ({ trades: s.trades.map((t) => (t.id === id ? { ...t, ltp } : t)) })),
      removeTrade: (id) =>
        set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
    }),
    { name: 'tradeos-paper-trades' }
  )
);
