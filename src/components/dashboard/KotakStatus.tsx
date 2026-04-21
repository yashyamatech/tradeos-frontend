'use client';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, WifiOff, Power } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';

export function KotakStatus() {
  const authenticated  = useMarketStore((s) => s.authenticated);
  const authDate       = useMarketStore((s) => s.authDate);
  const connecting     = useMarketStore((s) => s.connecting);
  const disconnecting  = useMarketStore((s) => s.disconnecting);
  const error          = useMarketStore((s) => s.error);
  const fetchStatus    = useMarketStore((s) => s.fetchStatus);
  const connect        = useMarketStore((s) => s.connect);
  const disconnect     = useMarketStore((s) => s.disconnect);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-destructive">{error}</span>}

      {authenticated ? (
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-profit" />
          <Badge variant="profit">Kotak Live</Badge>
          {authDate && (
            <span className="text-xs text-muted-foreground hidden sm:block">{authDate}</span>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={disconnect}
            disabled={disconnecting}
            title="Disconnect Kotak Neo session"
          >
            {disconnecting
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Power className="h-3 w-3" />
            }
            <span className="ml-1">{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
          </Button>
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
