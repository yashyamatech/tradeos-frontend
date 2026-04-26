'use client';
import { useEffect, useRef, useState } from 'react';
import { useNseStore, Sector, HeatmapType } from '@/store/nseStore';
import { Button } from '@/components/ui/button';
import { SectorStocks } from '@/components/heatmap/SectorStocks';
import { RefreshCw, Loader2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS: { key: HeatmapType; label: string }[] = [
  { key: 'sectoral', label: 'Sectoral Indices' },
  { key: 'broad',    label: 'Broad Market' },
];

function heatColor(pct: number) {
  if (pct >= 2)    return 'bg-emerald-600 border-emerald-500';
  if (pct >= 1)    return 'bg-emerald-600/70 border-emerald-600/50';
  if (pct >= 0.3)  return 'bg-emerald-700/40 border-emerald-700/30';
  if (pct >= 0)    return 'bg-emerald-900/30 border-emerald-900/20';
  if (pct >= -0.3) return 'bg-red-900/30 border-red-900/20';
  if (pct >= -1)   return 'bg-red-700/40 border-red-700/30';
  if (pct >= -2)   return 'bg-red-600/70 border-red-600/50';
  return 'bg-red-600 border-red-500';
}

function SectorCard({ s, active, onClick }: { s: Sector; active: boolean; onClick: () => void }) {
  const pct  = Number(s.pctChange);
  const isUp = pct >= 0;
  const total = (s.advances || 0) + (s.declines || 0) + (s.unchanged || 0);
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col justify-between rounded-lg border p-4 min-h-[130px]',
        'transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer select-none',
        heatColor(pct),
        active && 'ring-2 ring-white/60'
      )}
    >
      <div>
        <p className="text-xs font-medium text-white/70 uppercase tracking-wide leading-tight line-clamp-2">
          {s.name?.replace('NIFTY ', '')}
        </p>
        <p className="text-xl font-bold font-mono text-white mt-1">
          {Number(s.last).toLocaleString('en-IN')}
        </p>
      </div>
      <div className="mt-2">
        <div className={cn('flex items-center gap-1 text-base font-bold font-mono', isUp ? 'text-emerald-300' : 'text-red-300')}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? '+' : ''}{pct.toFixed(2)}%
        </div>
        <p className="text-xs text-white/50">{isUp ? '+' : ''}{Number(s.change).toFixed(2)} pts</p>
        {total > 0 && (
          <div className="flex gap-2 mt-1.5 text-[11px]">
            <span className="text-emerald-300">▲ {s.advances}</span>
            <span className="text-red-300">▼ {s.declines}</span>
            {s.unchanged > 0 && <span className="text-white/40">– {s.unchanged}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {[
        { label: '> +2%', cls: 'bg-emerald-600' },
        { label: '+1%',   cls: 'bg-emerald-600/70' },
        { label: '~0%',   cls: 'bg-emerald-900/30' },
        { label: '-1%',   cls: 'bg-red-700/40' },
        { label: '< -2%', cls: 'bg-red-600' },
      ].map((s) => (
        <div key={s.label} className="flex items-center gap-1">
          <div className={cn('w-3 h-3 rounded-sm', s.cls)} />
          <span className="text-[11px] text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SectorHeatmap() {
  const { sectors, loading, error, lastUpdated, activeType, fetch, setType } = useNseStore();
  const [selected, setSelected] = useState<Sector | null>(null);
  const stocksSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch();
    const id = setInterval(() => fetch(), 60_000);
    return () => clearInterval(id);
  }, []);

  function handleSelectSector(s: Sector) {
    const isSame = selected?.name === s.name;
    if (isSame) {
      setSelected(null);
      return;
    }
    setSelected(s);
    setTimeout(() => {
      stocksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  const sorted = [...sectors].sort((a, b) => Number(b.pctChange) - Number(a.pctChange));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">NSE Heatmap</h1>
          <p className="text-sm text-muted-foreground">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString('en-IN')} • auto-refreshes every 60s`
              : 'Source: nseindia.com • click a sector tile to see its stocks below'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Legend />
          <Button variant="outline" size="sm" onClick={() => fetch()} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setType(tab.key); setSelected(null); }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeType === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="py-16 text-center">
          <p className="text-destructive text-sm mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetch()}>Retry</Button>
        </div>
      ) : loading && sectors.length === 0 ? (
        <div className="flex items-center gap-2 justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Fetching NSE data...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sorted.map((s) => (
            <SectorCard
              key={s.name}
              s={s}
              active={selected?.name === s.name}
              onClick={() => handleSelectSector(s)}
            />
          ))}
        </div>
      )}

      {selected && (
        <div ref={stocksSectionRef} className="mt-2 border border-border rounded-lg overflow-hidden scroll-mt-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div>
              <h2 className="font-semibold text-sm">{selected.name}</h2>
              <p className="text-xs text-muted-foreground">
                {Number(selected.last).toLocaleString('en-IN')}
                {' • '}
                <span className={Number(selected.pctChange) >= 0 ? 'text-profit' : 'text-loss'}>
                  {Number(selected.pctChange) >= 0 ? '+' : ''}{Number(selected.pctChange).toFixed(2)}%
                </span>
                {' • ▲'}{selected.advances}{' ▼'}{selected.declines}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SectorStocks indexName={selected.name} heatmapType={activeType} />
        </div>
      )}
    </div>
  );
}
