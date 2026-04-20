'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Holding {
  tradingSymbol?: string;
  isin?: string;
  quantity?: number;
  averagePrice?: number;
  ltp?: number;
  pnl?: number;
  pnlPercent?: number;
  [key: string]: unknown;
}

export function HoldingsTable() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const api = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${api}/api/market/holdings`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const raw = data?.holdings?.data ?? data?.holdings ?? [];
        setHoldings(Array.isArray(raw) ? raw : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load holdings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading holdings...
          </div>
        ) : error ? (
          <p className="text-destructive text-sm py-4">{error}</p>
        ) : holdings.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No holdings found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">LTP</TableHead>
                <TableHead className="text-right">P&amp;L</TableHead>
                <TableHead className="text-right">P&amp;L %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h, i) => {
                const pnl = h.pnl ?? 0;
                const pnlPct = h.pnlPercent ?? 0;
                const isProfit = Number(pnl) >= 0;
                return (
                  <TableRow key={h.isin ?? i}>
                    <TableCell className="font-medium font-mono">
                      {h.tradingSymbol ?? h.isin ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{h.quantity ?? '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {h.averagePrice ? `₹${Number(h.averagePrice).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {h.ltp ? `₹${Number(h.ltp).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isProfit ? 'profit' : 'loss'}>
                        {isProfit ? '+' : ''}₹{Number(pnl).toFixed(0)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs ${isProfit ? 'text-profit' : 'text-loss'}`}>
                      {isProfit ? '+' : ''}{Number(pnlPct).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
