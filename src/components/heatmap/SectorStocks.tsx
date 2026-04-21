'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { HeatmapType } from '@/store/nseStore';
import { useWishlistStore } from '@/store/wishlistStore';

interface Stock {
  symbol: string;
  lastPrice: number;
  high: number;
  low: number;
  change: number;
  pctChange: number;
  volume: number;
  vwap: number;
  lastUpdated: string;
  series: string;
}

type SortKey = keyof Stock;

function fmtPrice(n: number | null | undefined) {
  if (n == null || n === 0) return '-';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtVol(v: number | null | undefined) {
  if (v == null) return '-';
  const n = Number(v);
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function SectorStocks({ indexName, heatmapType = 'sectoral' }: { indexName: string; heatmapType?: HeatmapType }) {
  const [stocks, setStocks]   = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [sort, setSort]       = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'pctChange', dir: 'desc' });

  const wishlistItems  = useWishlistStore((s) => s.items);
  const addToWishlist  = useWishlistStore((s) => s.add);

  useEffect(() => {
    if (!indexName) return;
    setLoading(true); setError('');
    apiFetch(`/api/nse/sector/${encodeURIComponent(indexName)}?type=${heatmapType}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setStocks(d.stocks ?? []))
      .catch(() => setError('Failed to load stocks'))
      .finally(() => setLoading(false));
  }, [indexName, heatmapType]);

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  }

  const sorted = [...stocks].sort((a, b) => {
    const va = Number(a[sort.key] ?? 0);
    const vb = Number(b[sort.key] ?? 0);
    return sort.dir === 'asc' ? va - vb : vb - va;
  });

  const SH = ({ col, label, className }: { col: SortKey; label: string; className?: string }) => (
    <TableHead
      className={cn('cursor-pointer select-none hover:text-foreground whitespace-nowrap', className)}
      onClick={() => toggleSort(col)}
    >
      {label}{sort.key === col ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </TableHead>
  );

  if (loading) return (
    <div className="flex items-center gap-2 justify-center py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading...
    </div>
  );
  if (error) return (
    <div className="p-6 text-center">
      <p className="text-destructive text-sm">{error}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => setError('')}>Retry</Button>
    </div>
  );
  if (!stocks.length) return <p className="text-muted-foreground text-sm p-6">No data</p>;

  return (
    <div>
      <p className="text-xs text-muted-foreground px-5 py-2 border-b border-border">
        {stocks.length} stocks &bull; click column header to sort &bull; <span className="text-primary">+</span> to add to watchlist
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Symbol</TableHead>
            <SH col="lastPrice" label="LTP"    className="text-right" />
            <SH col="pctChange" label="Chg %"  className="text-right" />
            <SH col="change"    label="Chg"    className="text-right" />
            <SH col="high"      label="High"   className="text-right" />
            <SH col="low"       label="Low"    className="text-right" />
            <SH col="vwap"      label="VWAP"   className="text-right" />
            <SH col="volume"    label="Volume" className="text-right" />
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => {
            const up = Number(s.pctChange) >= 0;
            const inWatchlist = wishlistItems.some((w) => w.symbol === s.symbol);
            return (
              <TableRow key={s.symbol}>
                <TableCell className="pl-5">
                  <div className="font-mono font-semibold">{s.symbol}</div>
                  {s.series && s.series !== 'EQ' && (
                    <div className="text-[10px] text-muted-foreground">{s.series}</div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">{fmtPrice(s.lastPrice)}</TableCell>
                <TableCell className="text-right">
                  <span className={cn('font-mono font-semibold', up ? 'text-profit' : 'text-loss')}>
                    {up ? '+' : ''}{Number(s.pctChange).toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className={cn('text-right font-mono text-sm', up ? 'text-profit' : 'text-loss')}>
                  {up ? '+' : ''}{Number(s.change).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-400">{fmtPrice(s.high)}</TableCell>
                <TableCell className="text-right font-mono text-red-400">{fmtPrice(s.low)}</TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">{fmtPrice(s.vwap)}</TableCell>
                <TableCell className="text-right font-mono">{fmtVol(s.volume)}</TableCell>
                <TableCell className="pr-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-7 w-7 p-0 rounded-full',
                      inWatchlist ? 'text-profit hover:text-profit' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => !inWatchlist && addToWishlist({
                      symbol: s.symbol,
                      sector: indexName,
                      addedLtp: s.lastPrice,
                      addedPctChange: s.pctChange,
                    })}
                    title={inWatchlist ? 'In watchlist' : 'Add to watchlist'}
                  >
                    {inWatchlist
                      ? <Check className="h-3.5 w-3.5" />
                      : <Plus className="h-3.5 w-3.5" />}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
