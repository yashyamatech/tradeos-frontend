import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  id: string;
  symbol: string;
  sector: string;
  addedLtp: number;
  addedPctChange: number;
  addedAt: string;
  entry: string;
  stopLoss: string;
  target: string;
}

interface WishlistState {
  items: WatchlistItem[];
  add: (item: Omit<WatchlistItem, 'id' | 'entry' | 'stopLoss' | 'target' | 'addedAt'>) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Pick<WatchlistItem, 'entry' | 'stopLoss' | 'target'>>) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        if (get().items.some((i) => i.symbol === item.symbol)) return;
        set((s) => ({
          items: [
            ...s.items,
            {
              ...item,
              id: `${item.symbol}-${Date.now()}`,
              entry: item.addedLtp ? String(item.addedLtp) : '',
              stopLoss: '',
              target: '',
              addedAt: new Date().toISOString(),
            },
          ],
        }));
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      update: (id, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'tradeos-wishlist' }
  )
);

export function calcRFactor(entry: string, stopLoss: string, target: string): number | null {
  const e = Number(entry);
  const sl = Number(stopLoss);
  const t = Number(target);
  if (!e || !sl || !t) return null;
  const risk = Math.abs(e - sl);
  if (risk < 0.001) return null;
  return parseFloat((Math.abs(t - e) / risk).toFixed(2));
}
