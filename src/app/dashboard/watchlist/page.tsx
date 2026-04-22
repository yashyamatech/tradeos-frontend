import { ScripSearch } from '@/components/watchlist/ScripSearch';
import { WatchlistTable } from '@/components/watchlist/WatchlistTable';

export default function WatchlistPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          Search any NSE scrip or add from the heatmap. Set entry, SL, and target to evaluate the R-factor.
        </p>
      </div>

      <ScripSearch />

      <WatchlistTable />
    </div>
  );
}
