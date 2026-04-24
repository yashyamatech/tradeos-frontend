'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTradeStore, TradeDirection } from '@/store/tradeStore';

function RPreview({ entry, sl, target }: { entry: string; sl: string; target: string }) {
  const e = Number(entry), s = Number(sl), t = Number(target);
  if (!e || !s || !t) return null;
  const risk = Math.abs(e - s);
  if (risk < 0.001) return null;
  const r = parseFloat((Math.abs(t - e) / risk).toFixed(2));
  const color = r >= 2 ? 'text-profit' : r >= 1 ? 'text-yellow-400' : 'text-loss';
  const label = r >= 2 ? 'Good setup' : r >= 1 ? 'Marginal' : 'Poor R';
  return (
    <div className="flex items-center gap-2">
      <span className={cn('font-mono font-bold text-sm', color)}>{r}R</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

interface Props { open: boolean; onClose: () => void; }

export function TradeForm({ open, onClose }: Props) {
  const createTrade = useTradeStore((s) => s.createTrade);

  const [symbol,    setSymbol]    = useState('');
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [qty,       setQty]       = useState('1');
  const [entry,     setEntry]     = useState('');
  const [sl,        setSl]        = useState('');
  const [target,    setTarget]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [submitting, setSub]      = useState(false);
  const [err,        setErr]      = useState('');

  async function handleSubmit() {
    if (!symbol || !entry || !qty) { setErr('Symbol, Quantity and Entry are required'); return; }
    setSub(true); setErr('');
    await createTrade({
      symbol: symbol.toUpperCase(),
      direction,
      quantity:   Number(qty),
      entryPrice: Number(entry),
      stopLoss:   Number(sl)     || 0,
      target:     Number(target) || 0,
      notes:      notes || undefined,
    });
    setSub(false);
    handleClose();
  }

  function handleClose() {
    setSymbol(''); setDirection('BUY'); setQty('1');
    setEntry(''); setSl(''); setTarget(''); setNotes(''); setErr('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Trade Entry</DialogTitle></DialogHeader>
        <div className="space-y-4 p-6 pt-2">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Symbol</Label>
              <Input placeholder="NIFTY, HDFCBANK…" value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL (Short)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity / Lots</Label>
              <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Entry Price</Label>
              <Input type="number" step="0.05" value={entry} onChange={(e) => setEntry(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stop Loss</Label>
              <Input type="number" step="0.05" value={sl} onChange={(e) => setSl(e.target.value)}
                className="border-loss/40" placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Input type="number" step="0.05" value={target} onChange={(e) => setTarget(e.target.value)}
                className="border-profit/40" placeholder="optional" />
            </div>
          </div>

          <RPreview entry={entry} sl={sl} target={target} />

          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Setup rationale…" />
          </div>

          {err && <p className="text-xs text-loss">{err}</p>}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Add Trade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
