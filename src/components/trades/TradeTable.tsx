'use client';
import { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore, tradeRFactor, Trade } from '@/store/tradeStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function fmtPnl(v: number) {
  const sign = v >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CloseRow({ trade, onCancel }: { trade: Trade; onCancel: () => void }) {
  const closeTrade = useTradeStore((s) => s.closeTrade);
  const [exit, setExit] = useState(String(trade.entryPrice));
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    await closeTrade(trade.id, Number(exit));
    setBusy(false); onCancel();
  }
  return (
    <div className="flex items-center gap-1">
      <Input type="number" step="0.05" value={exit} onChange={(e) => setExit(e.target.value)}
        className="w-24 h-6 text-xs font-mono" />
      <Button size="sm" className="h-6 px-2 text-xs" onClick={submit} disabled={busy}>Exit</Button>
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}><X className="h-3 w-3" /></Button>
    </div>
  );
}

export function TradeTable({ trades, showClose = true }: { trades: Trade[]; showClose?: boolean }) {
  const deleteTrade = useTradeStore((s) => s.deleteTrade);
  const [closingId, setClosingId] = useState<string | null>(null);

  if (trades.length === 0)
    return <div className="text-center py-16 text-muted-foreground text-sm">No trades here yet.</div>;

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Symbol</TableHead>
            <TableHead className="text-center">Dir</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">SL / Target</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead className="text-right">P&amp;L</TableHead>
            <TableHead className="text-center">R</TableHead>
            <TableHead className="text-right pr-4"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const r     = tradeRFactor(trade);
            const pnl   = trade.pnl ?? 0;
            const pnlCx = pnl >= 0 ? 'text-profit' : 'text-loss';
            return (
              <TableRow key={trade.id}>
                <TableCell className="pl-4">
                  <div className="font-mono font-semibold">{trade.symbol}</div>
                  {trade.notes && <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{trade.notes}</div>}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={trade.direction === 'BUY' ? 'default' : 'destructive'} className="text-[10px] py-0 h-4">
                    {trade.direction === 'BUY'
                      ? <TrendingUp className="h-2.5 w-2.5 mr-0.5 inline" />
                      : <TrendingDown className="h-2.5 w-2.5 mr-0.5 inline" />}
                    {trade.direction}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{trade.quantity}</TableCell>
                <TableCell className="text-right font-mono text-sm">₹{trade.entryPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  <span className="text-loss">{trade.stopLoss > 0 ? `₹${trade.stopLoss.toFixed(2)}` : '—'}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-profit">{trade.target > 0 ? `₹${trade.target.toFixed(2)}` : '—'}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className={cn('text-right font-mono text-sm font-semibold', trade.status === 'open' ? 'text-muted-foreground' : pnlCx)}>
                  {trade.status === 'closed' ? fmtPnl(pnl) : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {r !== null
                    ? <span className={cn('font-mono font-bold text-xs', r >= 2 ? 'text-profit' : r >= 1 ? 'text-yellow-400' : 'text-loss')}>{r}R</span>
                    : '—'}
                </TableCell>
                <TableCell className="text-right pr-4">
                  {trade.status === 'open' && showClose && (
                    closingId === trade.id
                      ? <CloseRow trade={trade} onCancel={() => setClosingId(null)} />
                      : <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setClosingId(trade.id)}>Close</Button>
                  )}
                  {trade.status === 'closed' && (
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-loss"
                      onClick={() => deleteTrade(trade.id)}><X className="h-3 w-3" /></Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
