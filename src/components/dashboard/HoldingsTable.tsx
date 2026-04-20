'use client';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useHoldingsStore } from '@/store/holdingsStore';

function fmtPrice(n: number | string) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function HoldingsTable() {
  const { holdings, loading, error, fetch, lastUpdated } = useHoldingsStore();

  useEffect(() => { fetch(); }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Holdings</CardTitle>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetch} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading && holdings.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading holdings...
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetch}>Retry</Button>
          </div>
        ) : holdings.length === 0 ? (
          <p className="text-muted-foreground text-sm py-12 text-center">No holdings found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">LTP</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Mkt Value</TableHead>
                <TableHead className="text-right">P&amp;L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h, i) => {
                const pnl = Number(h.mktValue) - Number(h.holdingCost);
                const pnlPct = Number(h.holdingCost) ? (pnl / Number(h.holdingCost)) * 100 : 0;
                const isProfit = pnl >= 0;
                return (
                  <TableRow key={h.scripId ?? i}>
                    <TableCell>
                      <div className="font-medium font-mono">{h.displaySymbol || h.symbol || '-'}</div>
                      <div className="text-xs text-muted-foreground">{h.exchangeSegment}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div>{h.quantity}</div>
                      {h.sellableQuantity !== h.quantity && (
                        <div className="text-xs text-muted-foreground">Sell: {h.sellableQuantity}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmtPrice(h.averagePrice)}</TableCell>
                    <TableCell className="text-right font-mono">{fmtPrice(h.closingPrice)}</TableCell>
                    <TableCell className="text-right font-mono">{fmtPrice(h.holdingCost)}</TableCell>
                    <TableCell className="text-right font-mono">{fmtPrice(h.mktValue)}</TableCell>
                    <TableCell className="text-right">
                      <div className={`font-mono font-medium ${isProfit ? 'text-profit' : 'text-loss'}`}>
                        {isProfit ? '+' : ''}{fmtPrice(pnl)}
                      </div>
                      <div className={`text-xs ${isProfit ? 'text-profit' : 'text-loss'}`}>
                        {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
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
