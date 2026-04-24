'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaperTradeStore, tradePnl, tradeRFactor, PaperTrade } from '@/store/paperTradeStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function fmtPnl(v: number) {
  const sign = v >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CloseRow({ trade, onCancel }: { trade: PaperTrade; onCancel: () => void }) {
  const closeTrade = usePaperTradeStore((s) => s.closeTrade);
  const [exitPrice, setExitPrice] = useState(String(trade.ltp ?? trade.entryPrice));
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    await closeTrade(trade.id, Number(exitPrice));
    setBusy(false);
    onCancel();
  }
  return (
    <div className="flex items-center gap-1">
      <Input type="number" step="0.05" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)}
        className="w-20 h-6 text-xs font-mono" />
      <Button size="sm" className="h-6 px-2 text-xs" onClick={submit} disabled={busy}>Exit</Button>
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function PaperTradeTable({ trades, showClose = true }: { trades: PaperTrade[]; showClose?: boolean }) {
  const deleteTrade = usePaperTradeStore((s) => s.deleteTrade);
  const [closingId, setClosingId] = useState<string | null>(null);

  if (trades.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm">No trades here yet.</div>;
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Contract</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">SL / Target</TableHead>
            <TableHead className="text-right">LTP</TableHead>
            <TableHead className="text-right">P&amp;L</TableHead>
            <TableHead className="text-center">R</TableHead>
            <TableHead className="text-right pr-4"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const pnl   = tradePnl(trade);
            const r     = tradeRFactor(trade);
            const ltp   = trade.status === 'closed' ? trade.exitPrice : trade.ltp;
            const pnlCx = pnl >= 0 ? 'text-profit' : 'text-loss';
            return (
              <TableRow key={trade.id}>
                <TableCell className="pl-4">
                  <div className="font-mono font-semibold text-sm">
                    {trade.symbol} {trade.strike}
                    <Badge variant={trade.optionType === 'CE' ? 'default' : 'destructive'}
                      className="ml-1.5 text-[10px] py-0 h-4">{trade.optionType}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {trade.expiry}&nbsp;·&nbsp;{trade.lots}L × {trade.lotSize}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">₹{trade.entryPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  <span className="text-loss">{trade.stopLoss > 0 ? `₹${trade.stopLoss.toFixed(2)}` : '—'}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-profit">{trade.target > 0 ? `₹${trade.target.toFixed(2)}` : '—'}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {ltp !== undefined ? `₹${ltp.toFixed(2)}` : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className={cn('text-right font-mono text-sm font-semibold', pnlCx)}>{fmtPnl(pnl)}</TableCell>
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
                      onClick={() => deleteTrade(trade.id)}>
                      <X className="h-3 w-3" />
                    </Button>
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
