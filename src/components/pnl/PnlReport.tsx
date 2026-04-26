'use client';
import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore, Trade, BROKERAGE_PER_TRADE, tradeNetPnl } from '@/store/tradeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Preset = 'today' | 'week' | 'month' | 'custom';

function localDateStr(d: Date) { return d.toLocaleDateString('en-CA'); }

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (day === 0 ? -6 : 1 - day));
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfDay(d: Date): Date     { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); }

function filterByRange(trades: Trade[], from: Date, to: Date) {
  return trades.filter((t) => { const d = new Date(t.createdAt); return d >= from && d < to; });
}

function fmt(v: number) {
  return `${v >= 0 ? '+' : '-'}₹${Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryCard({ label, trades }: { label: string; trades: Trade[] }) {
  const closed    = trades.filter((t) => t.status === 'closed');
  const grossPnl  = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const brokerage = trades.length * BROKERAGE_PER_TRADE;
  const netPnl    = closed.reduce((s, t) => s + tradeNetPnl(t), 0);
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Trades</div>
          <div className="font-mono font-semibold">{trades.length} <span className="text-muted-foreground text-xs">({closed.length} closed)</span></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Brokerage</div>
          <div className="font-mono font-semibold text-loss">−₹{brokerage.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Gross P&amp;L</div>
          <div className={cn('font-mono font-bold', grossPnl >= 0 ? 'text-profit' : 'text-loss')}>{fmt(grossPnl)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Net P&amp;L</div>
          <div className={cn('font-mono font-bold text-base', netPnl >= 0 ? 'text-profit' : 'text-loss')}>{fmt(netPnl)}</div>
        </div>
      </div>
    </div>
  );
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

export function PnlReport() {
  const trades      = useTradeStore((s) => s.trades);
  const loading     = useTradeStore((s) => s.loading);
  const fetchTrades = useTradeStore((s) => s.fetchTrades);
  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const [preset,     setPreset]     = useState<Preset>('week');
  const [customFrom, setCustomFrom] = useState(localDateStr(new Date()));
  const [customTo,   setCustomTo]   = useState(localDateStr(new Date()));

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const weekTrades  = useMemo(() => filterByRange(trades, startOfWeek(today), endOfDay(today)), [trades]);
  const monthTrades = useMemo(() => filterByRange(trades, startOfMonth(today), endOfDay(today)), [trades]);

  const filteredTrades = useMemo(() => {
    if (preset === 'today') return filterByRange(trades, today, endOfDay(today));
    if (preset === 'week')  return weekTrades;
    if (preset === 'month') return monthTrades;
    return filterByRange(trades, new Date(customFrom), endOfDay(new Date(customTo)));
  }, [trades, preset, customFrom, customTo, weekTrades, monthTrades]);

  const fBrok  = filteredTrades.length * BROKERAGE_PER_TRADE;
  const fGross = filteredTrades.filter((t) => t.status === 'closed').reduce((s, t) => s + (t.pnl ?? 0), 0);
  const fNet   = filteredTrades.filter((t) => t.status === 'closed').reduce((s, t) => s + tradeNetPnl(t), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">P&amp;L Report</h1>
          <p className="text-sm text-muted-foreground">₹{BROKERAGE_PER_TRADE} brokerage per trade</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTrades} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard label="This Week"  trades={weekTrades} />
        <SummaryCard label="This Month" trades={monthTrades} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                preset === p.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent')}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-36 h-8 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To</span>
              <Input type="date" value={customTo}   onChange={(e) => setCustomTo(e.target.value)}   className="w-36 h-8 text-sm" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {PRESETS.find((p) => p.key === preset)?.label} — {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
          </h2>
          {filteredTrades.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Gross <span className={cn('font-mono font-semibold', fGross >= 0 ? 'text-profit' : 'text-loss')}>{fmt(fGross)}</span></span>
              <span className="text-muted-foreground">Brok <span className="font-mono font-semibold text-loss">−₹{fBrok}</span></span>
              <span className="text-muted-foreground">Net <span className={cn('font-mono font-bold', fNet >= 0 ? 'text-profit' : 'text-loss')}>{fmt(fNet)}</span></span>
            </div>
          )}
        </div>

        {filteredTrades.length === 0 ? (
          <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">No trades in this period.</div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-center">Dir</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">Gross P&amp;L</TableHead>
                  <TableHead className="text-right">Brok</TableHead>
                  <TableHead className="text-right pr-4">Net P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => {
                  const closed = trade.status === 'closed';
                  const net    = tradeNetPnl(trade);
                  const date   = new Date(trade.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="pl-4 text-xs text-muted-foreground">{date}</TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold text-sm">{trade.symbol}</div>
                        {trade.notes && <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{trade.notes}</div>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={trade.direction === 'BUY' ? 'default' : 'destructive'} className="text-[10px] py-0 h-4">
                          {trade.direction === 'BUY' ? <TrendingUp className="h-2.5 w-2.5 mr-0.5 inline" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5 inline" />}
                          {trade.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{trade.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₹{trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono text-sm', !closed && 'text-muted-foreground')}>
                        {closed ? fmt(trade.pnl ?? 0) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-loss">−₹{BROKERAGE_PER_TRADE}</TableCell>
                      <TableCell className={cn('text-right font-mono text-sm font-bold pr-4', !closed ? 'text-muted-foreground' : net >= 0 ? 'text-profit' : 'text-loss')}>
                        {closed ? fmt(net) : <span className="text-xs font-normal">open</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
