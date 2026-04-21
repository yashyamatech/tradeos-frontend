'use client';
import { Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlistStore, calcRFactor } from '@/store/wishlistStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function fmtPrice(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function RBadge({ r }: { r: number | null }) {
  if (r === null) return <span className="text-muted-foreground text-xs font-mono">—</span>;
  const color = r >= 2 ? 'text-profit' : r >= 1 ? 'text-yellow-400' : 'text-loss';
  return (
    <span className={cn('font-mono font-bold text-sm', color)}>
      {r}R
    </span>
  );
}

export function WatchlistTable() {
  const items    = useWishlistStore((s) => s.items);
  const remove   = useWishlistStore((s) => s.remove);
  const update   = useWishlistStore((s) => s.update);
  const clear    = useWishlistStore((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Your watchlist is empty.</p>
        <p className="text-xs mt-1">Go to NSE Heatmap → click a sector → tap <strong>+</strong> next to any stock.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clear}>
          Clear all
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Symbol</TableHead>
              <TableHead className="text-right">Added LTP</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Stop Loss</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-center">R-Factor</TableHead>
              <TableHead className="text-right">Risk / Reward</TableHead>
              <TableHead className="text-right pr-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const r = calcRFactor(item.entry, item.stopLoss, item.target);
              const e  = Number(item.entry);
              const sl = Number(item.stopLoss);
              const t  = Number(item.target);
              const riskPt   = e && sl ? Math.abs(e - sl) : null;
              const rewardPt = e && t  ? Math.abs(t - e)  : null;

              return (
                <TableRow key={item.id}>
                  <TableCell className="pl-4">
                    <div className="font-mono font-semibold">{item.symbol}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[110px]">{item.sector}</div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="font-mono text-sm">{fmtPrice(item.addedLtp)}</div>
                    <div className={cn('text-[10px]', item.addedPctChange >= 0 ? 'text-profit' : 'text-loss')}>
                      {item.addedPctChange >= 0 ? '+' : ''}{item.addedPctChange.toFixed(2)}%
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.05"
                      value={item.entry}
                      onChange={(e) => update(item.id, { entry: e.target.value })}
                      className="w-24 h-7 text-right text-xs font-mono ml-auto"
                      placeholder="Entry"
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.05"
                      value={item.stopLoss}
                      onChange={(e) => update(item.id, { stopLoss: e.target.value })}
                      className="w-24 h-7 text-right text-xs font-mono ml-auto border-loss/40"
                      placeholder="SL"
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.05"
                      value={item.target}
                      onChange={(e) => update(item.id, { target: e.target.value })}
                      className="w-24 h-7 text-right text-xs font-mono ml-auto border-profit/40"
                      placeholder="Target"
                    />
                  </TableCell>

                  <TableCell className="text-center">
                    <RBadge r={r} />
                    {r !== null && r >= 2 && (
                      <div className="text-[9px] text-profit mt-0.5">Good setup</div>
                    )}
                    {r !== null && r < 1 && (
                      <div className="text-[9px] text-loss mt-0.5">Poor R</div>
                    )}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {riskPt !== null && rewardPt !== null ? (
                      <>
                        <span className="text-loss">-{riskPt.toFixed(2)}</span>
                        {' / '}
                        <span className="text-profit">+{rewardPt.toFixed(2)}</span>
                      </>
                    ) : '—'}
                  </TableCell>

                  <TableCell className="text-right pr-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-loss"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        R-Factor = reward ÷ risk. &nbsp;≥2R = good setup &nbsp;|&nbsp; 1–2R = marginal &nbsp;|&nbsp; &lt;1R = avoid
      </p>
    </div>
  );
}
