'use client';
import { MarketOverview } from './MarketOverview';
import { OpenTrades } from './OpenTrades';
import { AuthStatus } from './AuthStatus';

export function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Top row: market overview full width */}
      <div className="lg:col-span-3">
        <MarketOverview />
      </div>

      {/* Bottom row */}
      <div className="lg:col-span-2">
        <OpenTrades />
      </div>
      <div>
        <AuthStatus />
      </div>
    </div>
  );
}
