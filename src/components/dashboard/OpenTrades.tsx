'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function OpenTrades() {
  const { data, isLoading } = useQuery({
    queryKey: ['open-trades'],
    queryFn: () => api.get('/api/trades/open'),
    refetchInterval: 3_000,
  });

  const trades = data?.trades ?? [];

  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-4">
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Open Trades</h2>
      {isLoading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : trades.length === 0 ? (
        <p className="text-slate-500 text-sm">No open trades</p>
      ) : (
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-slate-500 text-xs">
              <th className="text-left py-1">Symbol</th>
              <th className="text-left">Dir</th>
              <th className="text-right">Entry</th>
              <th className="text-right">SL</th>
              <th className="text-right">Target</th>
              <th className="text-right">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t: any) => (
              <tr key={t.id} className="border-t border-surface-border">
                <td className="py-1.5">{t.symbol}</td>
                <td className={t.direction === 'BUY' ? 'text-profit' : 'text-loss'}>{t.direction}</td>
                <td className="text-right">{t.entry_price}</td>
                <td className="text-right text-loss">{t.stop_loss}</td>
                <td className="text-right text-profit">{t.target}</td>
                <td className="text-right">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
