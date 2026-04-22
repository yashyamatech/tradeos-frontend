'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { usePaperTradeStore } from '@/store/paperTradeStore';
import { PaperTradeTable } from '@/components/trades/PaperTradeTable';
import { PaperTradeForm } from '@/components/trades/PaperTradeForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TradesPage() {
  const trades     = usePaperTradeStore((s) => s.trades);
  const updateLtp  = usePaperTradeStore((s) => s.updateLtp);
  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');

  const [formOpen, setFormOpen] = useState(false);
  const [polling,  setPolling]  = useState(false);

  // Read live store state inside the callback so the interval never stales
  const pollLtps = useCallback(async () => {
    const { trades: live } = usePaperTradeStore.getState();
    const open = live.filter((t) => t.status === 'open');
    if (open.length === 0) return;
    setPolling(true);
    try {
      const groups = new Map<string, { symbol: string; underlyingType: string }>();
      for (const t of open) {
        const key = `${t.symbol}__${t.underlyingType}`;
        if (!groups.has(key)) groups.set(key, { symbol: t.symbol, underlyingType: t.underlyingType });
      }
      for (const { symbol, underlyingType } of groups.values()) {
        try {
          const res = await apiFetch(`/api/nse/option-chain?symbol=${symbol}&type=${underlyingType}`);
          if (!res.ok) continue;
          const chain = await res.json();
          const rows: Array<{ strikePrice: number; expiryDate: string; CE?: { lastPrice: number }; PE?: { lastPrice: number } }> = chain.data ?? [];
          for (const trade of open) {
            if (trade.symbol !== symbol || trade.underlyingType !== underlyingType) continue;
            const row = rows.find((r) => r.strikePrice === trade.strike && r.expiryDate === trade.expiry);
            if (row) {
              const ltp = row[trade.optionType]?.lastPrice;
              if (ltp !== undefined && ltp > 0) updateLtp(trade.id, ltp);
            }
          }
        } catch { /* continue next group */ }
      }
    } finally {
      setPolling(false);
    }
  }, [updateLtp]);

  useEffect(() => {
    pollLtps();
    const id = setInterval(pollLtps, 30_000);
    return () => clearInterval(id);
  }, [pollLtps]);

  const totalOpenPnl = openTrades.reduce((sum, t) => {
    const ltp = t.ltp ?? t.entryPrice;
    return sum + (ltp - t.entryPrice) * t.lotSize * t.lots;
  }, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Paper Trades</h1>
          <p className="text-sm text-muted-foreground">Simulated F&amp;O — live premiums via NSE option chain</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={pollLtps} disabled={polling}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', polling && 'animate-spin')} />
            {polling ? 'Refreshing…' : 'Refresh LTP'}
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Trade
          </Button>
        </div>
      </div>

      {openTrades.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-sm">
          <span className="text-muted-foreground">Open P&amp;L</span>
          <span className={cn('font-mono font-bold', totalOpenPnl >= 0 ? 'text-profit' : 'text-loss')}>
            {totalOpenPnl >= 0 ? '+' : ''}₹{Math.abs(totalOpenPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground">· auto-refreshes every 30s</span>
        </div>
      )}

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({openTrades.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedTrades.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-3">
          <PaperTradeTable trades={openTrades} showClose />
        </TabsContent>
        <TabsContent value="closed" className="mt-3">
          <PaperTradeTable trades={closedTrades} showClose={false} />
        </TabsContent>
      </Tabs>

      <PaperTradeForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
