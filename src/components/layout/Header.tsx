'use client';
import Link from 'next/link';
import { useTradeStore } from '@/store/tradeStore';

export function Header() {
  const { dailyPnL, isHalted } = useTradeStore();

  return (
    <header className="border-b border-surface-border bg-surface-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-accent text-lg">TradeOS</span>
        <span className="text-xs text-slate-500">F&amp;O Dashboard</span>
      </div>

      <nav className="flex items-center gap-6 text-sm">
        <Link href="/" className="text-slate-300 hover:text-white">Dashboard</Link>
        <Link href="/journal" className="text-slate-300 hover:text-white">Journal</Link>
        <Link href="/signals" className="text-slate-300 hover:text-white">Signals</Link>
      </nav>

      <div className="flex items-center gap-4 font-mono text-sm">
        {isHalted && (
          <span className="bg-loss/20 text-loss border border-loss/40 px-2 py-0.5 rounded text-xs">
            HALTED
          </span>
        )}
        <span className={dailyPnL >= 0 ? 'text-profit' : 'text-loss'}>
          {dailyPnL >= 0 ? '+' : ''}₹{dailyPnL.toFixed(0)}
        </span>
      </div>
    </header>
  );
}
