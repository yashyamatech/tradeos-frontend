const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';

type TickHandler = (data: unknown) => void;

class FeedClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<TickHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (typeof window === 'undefined') return;
    this.ws = new WebSocket(`${WS_BASE}/api/market/ws/feed`);

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'tick') {
        this.handlers.forEach((h) => h(msg.data));
      }
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3_000);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: TickHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const feedClient = new FeedClient();
