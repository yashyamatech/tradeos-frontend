'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function AuthStatus() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth-status'],
    queryFn: () => api.get('/api/auth/status'),
    refetchInterval: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: () => api.post('/api/auth/login', {}),
    onSuccess: () => refetch(),
  });

  const isAuthenticated = data?.authenticated ?? false;

  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-4">
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Kotak Neo</h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isAuthenticated ? 'bg-profit' : 'bg-loss'
            }`}
          />
          <span className="text-sm">
            {isLoading ? 'Checking...' : isAuthenticated ? 'Authenticated' : 'Not connected'}
          </span>
        </div>
        {data?.auth_date && (
          <p className="text-xs text-slate-500 font-mono">Session: {data.auth_date}</p>
        )}
        <button
          onClick={() => loginMutation.mutate()}
          disabled={loginMutation.isPending || isAuthenticated}
          className="mt-1 text-xs bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 px-3 py-1.5 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loginMutation.isPending ? 'Connecting...' : 'Connect Kotak Neo'}
        </button>
        {loginMutation.isError && (
          <p className="text-xs text-loss">{(loginMutation.error as any)?.message}</p>
        )}
      </div>
    </div>
  );
}
