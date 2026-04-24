'use client';
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore } from '@/store/tradeStore';
import { TradeTable } from '@/components/trades/TradeTable';
import { TradeForm } from '@/components/trades/TradeForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TradesPage() {
  const trades      = useTradeStore((s) => s.trades);
  const loading     = useTradeStore((s) => s.loading);
  const error       = useTradeStore((s) => s.error);
  const fetchTrades = useTradeStore((s) => s.fetchTrades);

  const openTrades   = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');

  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const totalClosedPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trade Journal</h1>
          <p className="text-sm text-muted-foreground">Entries saved to PostgreSQL</p>
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

      {!loading && closedTrades.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-sm">
          <span className="text-muted-foreground">Realised P&amp;L</span>
          <span className={cn('font-mono font-bold', totalClosedPnl >= 0 ? 'text-profit' : 'text-loss')}>
            {totalClosedPnl >= 0 ? '+' : ''}₹{Math.abs(totalClosedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
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
