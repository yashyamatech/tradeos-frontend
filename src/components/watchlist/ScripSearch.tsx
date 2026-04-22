'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useWishlistStore } from '@/store/wishlistStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchResult {
  symbol: string;
  name:   string;
  series: string;
}

export function ScripSearch() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding,  setAdding]  = useState<string | null>(null);
  const [open,    setOpen]    = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const add   = useWishlistStore((s) => s.add);
  const items = useWishlistStore((s) => s.items);

  // Debounced search — fires 300 ms after user stops typing
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`/api/nse/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 300);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleAdd(result: SearchResult) {
    setAdding(result.symbol);
    setOpen(false);
    setQuery('');
    try {
      const res = await apiFetch(`/api/nse/quote?symbol=${result.symbol}`);
      const q   = res.ok ? await res.json() : null;
      add({
        symbol:         result.symbol,
        sector:         result.name,
        addedLtp:       q?.lastPrice    ?? 0,
        addedPctChange: q?.pctChange    ?? 0,
      });
    } catch {
      add({ symbol: result.symbol, sector: result.name, addedLtp: 0, addedPctChange: 0 });
    } finally {
      setAdding(null);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <div className="relative">
        {searching
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          : <Search  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        }
        <Input
          className="pl-9"
          placeholder="Search scrip to add (e.g. HDFC, NIFTY…)"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border border-border bg-card shadow-lg max-h-64 overflow-y-auto">
          {results.map((r) => {
            const alreadyAdded = items.some((i) => i.symbol === r.symbol);
            return (
              <div
                key={r.symbol}
                className="flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-mono font-semibold text-sm">{r.symbol}</div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{r.name}</div>
                </div>
                <Button
                  size="sm"
                  variant={alreadyAdded ? 'ghost' : 'outline'}
                  className="h-7 px-2 text-xs shrink-0 ml-2"
                  disabled={alreadyAdded || adding === r.symbol}
                  onClick={() => handleAdd(r)}
                >
                  {adding === r.symbol
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : alreadyAdded
                      ? '✓ Added'
                      : <><Plus className="h-3.5 w-3.5 mr-1" />Add</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {open && results.length === 0 && !searching && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border border-border bg-card shadow-lg px-3 py-4 text-sm text-muted-foreground text-center">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
