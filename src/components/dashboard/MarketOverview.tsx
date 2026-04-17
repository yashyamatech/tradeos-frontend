'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const INDICES = ['NIFTY', 'FINNIFTY', 'BANKNIFTY'];

export function MarketOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => api.get('/api/market/quote/NIFTY'),
    refetchInterval: 5_000,
  });

  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-4">
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Market Overview</h2>
      <div className="flex gap-6">
        {INDICES.map((idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-xs text-slate-500">{idx}</span>
            <span className="font-mono text-lg text-white">
              {isLoading ? '—' : '...'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
