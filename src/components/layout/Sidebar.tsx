'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Grid3x3,
  Zap,
  BookOpen,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard', label: 'Portfolio', icon: LayoutDashboard },
  { href: '/dashboard/heatmap', label: 'NSE Heatmap', icon: Grid3x3 },
  { href: '/dashboard/signals', label: 'Signals', icon: Zap, soon: true },
  { href: '/dashboard/journal', label: 'Journal', icon: BookOpen, soon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2 px-3 py-4 border-b border-border', sidebarCollapsed && 'justify-center')}>
        <TrendingUp className="h-5 w-5 text-primary shrink-0" />
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
                item.soon && 'opacity-40 cursor-not-allowed'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">
                  {item.label}
                  {item.soon && <span className="ml-1 text-[10px] uppercase tracking-wide">soon</span>}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
