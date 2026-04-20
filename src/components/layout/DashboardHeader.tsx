'use client';
import { useRouter } from 'next/navigation';
import { TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg">TradeOS</span>
        <span className="text-xs text-muted-foreground hidden sm:block">F&amp;O Dashboard</span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-1" />
        Logout
      </Button>
    </header>
  );
}
