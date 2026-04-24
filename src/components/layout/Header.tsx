'use client';
import { useTradeStore } from '@/store/tradeStore';

export function Header() {
  const trades = useTradeStore((s) => s.trades);

  // Sum P&L of trades closed today
  const today = new Date().toDateString();
  const dailyPnL = trades
    .filter((t) => t.status === 'closed' && t.closedAt && new Date(t.closedAt).toDateString() === today)
    .reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-primary text-lg">TradeOS</span>
        <span className="text-xs text-muted-foreground">Personal Trading Dashboard</span>
      </div>

      <div className="font-mono text-sm">
        {trades.length > 0 && (
          <span className={dailyPnL >= 0 ? 'text-profit' : 'text-loss'}>
            Today: {dailyPnL >= 0 ? '+' : ''}₹{dailyPnL.toFixed(0)}
          </span>
        )}
      </div>
    </header>
  );
}
