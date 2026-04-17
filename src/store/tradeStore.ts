import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Trade {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  mode: 'paper' | 'live';
  status: 'open' | 'closed';
  pnl?: number;
}

interface TradeState {
  openTrades: Trade[];
  closedTrades: Trade[];
  dailyPnL: number;
  isHalted: boolean;
  isLiveMode: boolean;
  setHalted: (halted: boolean) => void;
  setLiveMode: (live: boolean) => void;
  addTrade: (trade: Trade) => void;
  closeTrade: (id: string, exitPrice: number, pnl: number) => void;
  resetDaily: () => void;
}

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      openTrades: [],
      closedTrades: [],
      dailyPnL: 0,
      isHalted: false,
      isLiveMode: false,

      setHalted: (halted) => set({ isHalted: halted }),
      setLiveMode: (live) => set({ isLiveMode: live }),

      addTrade: (trade) =>
        set((s) => ({ openTrades: [...s.openTrades, trade] })),

      closeTrade: (id, exitPrice, pnl) =>
        set((s) => {
          const trade = s.openTrades.find((t) => t.id === id);
          if (!trade) return s;
          const newDailyPnL = s.dailyPnL + pnl;
          return {
            openTrades: s.openTrades.filter((t) => t.id !== id),
            closedTrades: [...s.closedTrades, { ...trade, status: 'closed', pnl }],
            dailyPnL: newDailyPnL,
            // Auto-halt if daily loss limit hit
            isHalted: newDailyPnL <= -750,
          };
        }),

      resetDaily: () => set({ dailyPnL: 0, isHalted: false }),
    }),
    { name: 'tradeos-store' }
  )
);
