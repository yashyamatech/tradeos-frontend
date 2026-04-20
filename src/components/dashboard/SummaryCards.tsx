'use client';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { useHoldingsStore } from '@/store/holdingsStore';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function SummaryCards() {
  const { holdings, totalInvested, currentValue, totalPnl, totalPnlPct } = useHoldingsStore();

  const invested = totalInvested();
  const current = currentValue();
  const pnl = totalPnl();
  const pnlPct = totalPnlPct();
  const isProfit = pnl >= 0;

  const cards = [
    { title: 'Total Invested', value: fmt(invested), icon: Wallet, sub: `${holdings.length} holdings` },
    { title: 'Current Value', value: fmt(current), icon: BarChart3, sub: 'at LTP' },
    {
      title: 'Total P&L',
      value: `${isProfit ? '+' : ''}${fmt(pnl)}`,
      icon: isProfit ? TrendingUp : TrendingDown,
      sub: `${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%`,
      color: isProfit ? 'text-profit' : 'text-loss',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
            <c.icon className={`h-4 w-4 ${c.color ?? 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${c.color ?? ''}`}>{c.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
