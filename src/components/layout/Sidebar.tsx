'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3x3,
  Bookmark,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Power,
  PowerOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useMarketStore } from '@/store/marketStore';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard',           label: 'Portfolio',     icon: LayoutDashboard },
  { href: '/dashboard/heatmap',   label: 'NSE Heatmap',  icon: Grid3x3 },
  { href: '/dashboard/watchlist', label: 'Watchlist',    icon: Bookmark },
  { href: '/dashboard/trades',    label: 'Paper Trades', icon: FileText },
  { href: '/dashboard/journal',   label: 'Journal',      icon: BookOpen, soon: true },
];

export function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const authenticated = useMarketStore((s) => s.authenticated);
  const disconnecting = useMarketStore((s) => s.disconnecting);
  const disconnect    = useMarketStore((s) => s.disconnect);
  const fetchStatus   = useMarketStore((s) => s.fetchStatus);

  // Fetch auth state on first render so buttons are visible immediately
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleLogout() {
    await window.fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  async function handleDisconnectAndLogout() {
    if (authenticated) await disconnect();
    await window.fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-4 border-b border-border',
        sidebarCollapsed && 'justify-center'
      )}>
        <LayoutDashboard className="h-5 w-5 text-primary shrink-0" />
        {!sidebarCollapsed && <span className="font-bold text-base">TradeOS</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.soon ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                item.soon && 'opacity-40 cursor-not-allowed pointer-events-none'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">
                  {item.label}
                  {item.soon && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wide opacity-60">soon</span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions — always visible in both collapsed and expanded */}
      <div className="p-2 border-t border-border space-y-1">
        {authenticated && (
          <button
            onClick={disconnect}
            disabled={disconnecting}
            title="Disconnect Kotak Neo"
            className={cn(
              'flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm transition-colors',
              'text-loss hover:bg-loss/10',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <Power className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && (
              <span>{disconnecting ? 'Disconnecting...' : 'Disconnect Kotak'}</span>
            )}
          </button>
        )}

        <button
          onClick={handleLogout}
          title="Logout dashboard"
          className={cn(
            'flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>

        {/* Shown whenever authenticated — both collapsed (icon only) and expanded */}
        {authenticated && (
          <button
            onClick={handleDisconnectAndLogout}
            title="Disconnect + Logout"
            className={cn(
              'flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm transition-colors',
              'text-loss/70 hover:bg-loss/10 hover:text-loss',
              sidebarCollapsed && 'justify-center'
            )}
          >
            <PowerOff className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Disconnect + Logout</span>}
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
