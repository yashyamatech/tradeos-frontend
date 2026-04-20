'use client';
import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Stock {
  symbol: string;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  ltp: number;
  volume: number;
  change: number;
  pctChange: number;
  yearHigh?: number;
  yearLow?: number;
}

function fmtPrice(n: number | null | undefined) {
  if (n == null) return '-';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtVol(v: number | null | undefined) {
  if (v == null) return '-';
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export function SectorStocks({ indexName }: { indexName: string }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<{ key: keyof Stock; dir: 'asc' | 'desc' }>({ key: 'pctChange', dir: 'desc' });

  useEffect(() => {
    if (!indexName) return;
    setLoading(true);
    setError('');
    const api = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${api}/api/nse/sector/${encodeURIComponent(indexName)}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setStocks(d.stocks ?? []))
      .catch(() => setError('Failed to load stocks'))
      .finally(() => setLoading(false));
  }, [indexName]);

  function toggleSort(key: keyof Stock) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  }

  const sorted = [...stocks].sort((a, b) => {
    const va = Number(a[sort.key] ?? 0);
    const vb = Number(b[sort.key] ?? 0);
    return sort.dir === 'asc' ? va - vb : vb - va;
  });

  const SortHead = ({ col, label, className }: { col: keyof Stock; label: string; className?: string }) => (
    <TableHead
      className={cn('cursor-pointer select-none hover:text-foreground', className)}
      onClick={() => toggleSort(col)}
    >
      {label}{sort.key === col ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </TableHead>
  );

  if (loading) return (
    <div className="flex items-center gap-2 justify-center py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading stocks...
    </div>
  );

  if (error) return <p className="text-destructive text-sm p-6">{error}</p>;

  if (!stocks.length) return <p className="text-muted-foreground text-sm p-6">No data</p>;

  return (
    <div>
      <p className="text-xs text-muted-foreground px-5 py-2">{stocks.length} stocks • click column to sort</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Symbol</TableHead>
            <SortHead col="ltp" label="LTP" className="text-right" />
            <SortHead col="pctChange" label="Chg %" className="text-right" />
            <SortHead col="open" label="Open" className="text-right" />
            <SortHead col="high" label="High" className="text-right" />
            <SortHead col="low" label="Low" className="text-right" />
            <SortHead col="previousClose" label="Prev Close" className="text-right" />
            <SortHead col="volume" label="Volume" className="text-right pr-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => {
            const up = Number(s.pctChange) >= 0;
            return (
              <TableRow key={s.symbol}>
                <TableCell className="font-mono font-medium pl-5">{s.symbol}</TableCell>
                <TableCell className="text-right font-mono">{fmtPrice(s.ltp)}</TableCell>
                <TableCell className="text-right">
                  <span className={cn('font-mono text-sm font-medium', up ? 'text-profit' : 'text-loss')}>
                    {up ? '+' : ''}{Number(s.pctChange).toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">{fmtPrice(s.open)}</TableCell>
                <TableCell className="text-right font-mono text-emerald-400">{fmtPrice(s.high)}</TableCell>
                <TableCell className="text-right font-mono text-red-400">{fmtPrice(s.low)}</TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">{fmtPrice(s.previousClose)}</TableCell>
                <TableCell className="text-right font-mono pr-5">{fmtVol(s.volume)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
