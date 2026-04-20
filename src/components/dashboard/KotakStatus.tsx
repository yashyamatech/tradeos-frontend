'use client';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';

export function KotakStatus() {
  const { authenticated, authDate, connecting, error, fetchStatus, connect } = useMarketStore();

  useEffect(() => { fetchStatus(); }, []);

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-destructive">{error}</span>}
      {authenticated ? (
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-profit" />
          <Badge variant="profit">Kotak Live</Badge>
          {authDate && <span className="text-xs text-muted-foreground hidden sm:block">{authDate}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-loss" />
          <Badge variant="destructive">Disconnected</Badge>
          <Button size="sm" onClick={connect} disabled={connecting}>
            {connecting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Connect
          </Button>
        </div>
      )}
    </div>
  );
}
