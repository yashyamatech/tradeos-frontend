'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function KotakStatus() {
  const [status, setStatus] = useState<{ authenticated: boolean; auth_date?: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL;

  async function fetchStatus() {
    try {
      const res = await fetch(`${api}/api/auth/status`);
      setStatus(await res.json());
    } catch { setStatus(null); }
  }

  async function connect() {
    setConnecting(true);
    await fetch(`${api}/api/auth/login`, { method: 'POST' });
    await fetchStatus();
    setConnecting(false);
  }

  useEffect(() => { fetchStatus(); }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-3">
      {status.authenticated ? (
        <Badge variant="profit">Kotak Connected</Badge>
      ) : (
        <>
          <Badge variant="destructive">Kotak Disconnected</Badge>
          <Button size="sm" onClick={connect} disabled={connecting}>
            {connecting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Connect
          </Button>
        </>
      )}
    </div>
  );
}
