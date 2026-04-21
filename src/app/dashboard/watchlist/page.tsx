import { WatchlistTable } from '@/components/watchlist/WatchlistTable';

export default function WatchlistPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          Add stocks from rising sectors. Set entry, stop loss, and target to evaluate the R-factor before taking a trade.
        </p>
      </div>
      <WatchlistTable />
    </div>
  );
}
