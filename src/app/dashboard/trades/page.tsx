'use client';
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore, isTradeToday, tradeNetPnl, BROKERAGE_PER_LEG } from '@/store/tradeStore';
import { TradeTable } from '@/components/trades/TradeTable';
import { TradeForm } from '@/components/trades/TradeForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TradesPage() {
  const trades      = useTradeStore((s) => s.trades);
  const loading     = useTradeStore((s) => s.loading);
  const error       = useTradeStore((s) => s.error);
  const fetchTrades = useTradeStore((s) => s.fetchTrades);

  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // Only show today's trades in the journal
  const todayTrades  = trades.filter(isTradeToday);
  const openTrades   = todayTrades.filter((t) => t.status === 'open');
  const closedTrades = todayTrades.filter((t) => t.status === 'closed');

  const grossPnl    = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const brokerage   = todayTrades.reduce((s, t) => s + (t.status === 'closed' ? BROKERAGE_PER_LEG * 2 : BROKERAGE_PER_LEG), 0);
  const netPnl      = closedTrades.reduce((s, t) => s + tradeNetPnl(t), 0);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trade Journal</h1>
          <p className="text-sm text-muted-foreground">{today} · today’s entries only</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTrades} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />New Trade
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={fetchTrades}>Retry</Button>
        </div>
      )}

      {loading && <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>}

      {/* Today’s P&L summary — shown when there are any trades today */}
      {!loading && todayTrades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Trades today', value: `${todayTrades.length}`, sub: `${openTrades.length} open / ${closedTrades.length} closed`, cx: '' },
            { label: 'Brokerage', value: `−₹${brokerage}`, sub: '₹100 per leg', cx: 'text-loss' },
            { label: 'Gross P&L', value: (grossPnl >= 0 ? '+' : '') + `₹${Math.abs(grossPnl).toFixed(2)}`, sub: 'before brokerage', cx: grossPnl >= 0 ? 'text-profit' : 'text-loss' },
            { label: 'Net P&L', value: (netPnl >= 0 ? '+' : '') + `₹${Math.abs(netPnl).toFixed(2)}`, sub: 'after brokerage', cx: netPnl >= 0 ? 'text-profit' : 'text-loss' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className={cn('font-mono font-bold text-lg mt-0.5', c.cx)}>{c.value}</div>
              <div className="text-[11px] text-muted-foreground">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({openTrades.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closedTrades.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-3"><TradeTable trades={openTrades} showClose /></TabsContent>
          <TabsContent value="closed" className="mt-3"><TradeTable trades={closedTrades} showClose={false} /></TabsContent>
        </Tabs>
      )}

      <TradeForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
