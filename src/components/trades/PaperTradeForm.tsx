'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { usePaperTradeStore, OptionType, UnderlyingType } from '@/store/paperTradeStore';
import { calcRFactor } from '@/store/wishlistStore';

interface OptionRow {
  strikePrice: number;
  expiryDate:  string;
  CE?: { lastPrice: number; oi: number; volume: number };
  PE?: { lastPrice: number; oi: number; volume: number };
}

interface ChainData {
  symbol:          string;
  underlyingValue: number;
  expiryDates:     string[];
  data:            OptionRow[];
}

interface Props {
  open:     boolean;
  onClose:  () => void;
  prefill?: { symbol: string; underlyingType?: UnderlyingType };
}

const LOT_SIZES: Record<string, number> = {
  NIFTY: 25, BANKNIFTY: 15, FINNIFTY: 40, MIDCPNIFTY: 75, SENSEX: 10,
};

function RPreview({ entry, sl, target }: { entry: string; sl: string; target: string }) {
  const r = calcRFactor(entry, sl, target);
  if (r === null) return null;
  const color = r >= 2 ? 'text-profit' : r >= 1 ? 'text-yellow-400' : 'text-loss';
  const label = r >= 2 ? 'Good setup' : r >= 1 ? 'Marginal' : 'Poor R';
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={cn('font-mono font-bold text-sm', color)}>{r}R</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function PaperTradeForm({ open, onClose, prefill }: Props) {
  const addTrade = usePaperTradeStore((s) => s.addTrade);

  const [step, setStep]                   = useState<1 | 2>(1);
  const [symbol, setSymbol]               = useState('');
  const [underlyingType, setUnderlyingType] = useState<UnderlyingType>('index');
  const [chain, setChain]                 = useState<ChainData | null>(null);
  const [loading, setLoading]             = useState(false);
  const [chainError, setChainError]       = useState('');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [optionType, setOptionType]       = useState<OptionType>('CE');
  const [entry, setEntry]                 = useState('');
  const [sl, setSl]                       = useState('');
  const [target, setTarget]               = useState('');
  const [lots, setLots]                   = useState('1');
  const [lotSize, setLotSize]             = useState('');

  useEffect(() => {
    if (prefill?.symbol) {
      setSymbol(prefill.symbol.toUpperCase());
      setUnderlyingType(prefill.underlyingType ?? 'index');
      setLotSize(String(LOT_SIZES[prefill.symbol.toUpperCase()] ?? ''));
    }
  }, [prefill]);

  async function fetchChain() {
    if (!symbol) return;
    setLoading(true);
    setChainError('');
    try {
      const res = await apiFetch(`/api/nse/option-chain?symbol=${symbol}&type=${underlyingType}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChainData = await res.json();
      setChain(data);
      setSelectedExpiry(data.expiryDates[0] ?? '');
      setLotSize((s) => s || String(LOT_SIZES[symbol] ?? ''));
      setStep(2);
    } catch (e) {
      setChainError(e instanceof Error ? e.message : 'Failed to fetch chain');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(strike: number, ot: OptionType, ltp: number) {
    setSelectedStrike(strike);
    setOptionType(ot);
    if (ltp > 0) setEntry(String(ltp));
  }

  function handleSubmit() {
    if (!chain || selectedStrike === null || !entry) return;
    addTrade({
      symbol,
      underlyingType,
      optionType,
      strike:     selectedStrike,
      expiry:     selectedExpiry,
      lotSize:    Number(lotSize) || 1,
      lots:       Number(lots) || 1,
      entryPrice: Number(entry),
      stopLoss:   Number(sl) || 0,
      target:     Number(target) || 0,
    });
    handleClose();
  }

  function handleClose() {
    setStep(1);
    setSymbol(prefill?.symbol ?? '');
    setChain(null);
    setChainError('');
    setSelectedStrike(null);
    setEntry(''); setSl(''); setTarget('');
    setLots('1');
    onClose();
  }

  const filteredRows = chain
    ? chain.data.filter((r) => !selectedExpiry || r.expiryDate === selectedExpiry)
    : [];

  const atm = chain?.underlyingValue ?? 0;
  const atmStrike = filteredRows.reduce(
    (closest, row) =>
      Math.abs(row.strikePrice - atm) < Math.abs(closest - atm) ? row.strikePrice : closest,
    filteredRows[0]?.strikePrice ?? atm
  );
  const atmIdx = filteredRows.findIndex((r) => r.strikePrice === atmStrike);
  const visibleRows = atmIdx >= 0
    ? filteredRows.slice(Math.max(0, atmIdx - 8), atmIdx + 9)
    : filteredRows.slice(0, 17);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Paper Trade — F&amp;O</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Symbol</Label>
                <Input
                  placeholder="NIFTY, BANKNIFTY, HDFCBANK…"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && fetchChain()}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Underlying type</Label>
                <Select value={underlyingType} onValueChange={(v) => setUnderlyingType(v as UnderlyingType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index">Index (NIFTY, BANKNIFTY…)</SelectItem>
                    <SelectItem value="equity">Equity (HDFCBANK, RELIANCE…)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {chainError && <p className="text-xs text-loss">{chainError}</p>}
            <Button onClick={fetchChain} disabled={loading || !symbol} className="w-full">
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading chain…</>
                : 'Load Option Chain'}
            </Button>
          </div>
        )}

        {step === 2 && chain && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold">{chain.symbol}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  Spot: ₹{chain.underlyingValue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Expiry</Label>
                <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {chain.expiryDates.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>← Back</Button>
              </div>
            </div>

            <div className="rounded-md border border-border overflow-x-auto text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-right px-3 py-1.5 text-profit w-24">CE LTP</th>
                    <th className="text-right px-3 py-1.5 text-muted-foreground w-20">OI</th>
                    <th className="text-center px-3 py-1.5 font-bold w-24">Strike</th>
                    <th className="text-left px-3 py-1.5 text-muted-foreground w-20">OI</th>
                    <th className="text-left px-3 py-1.5 text-loss w-24">PE LTP</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const isATM        = row.strikePrice === atmStrike;
                    const isSelCE      = selectedStrike === row.strikePrice && optionType === 'CE';
                    const isSelPE      = selectedStrike === row.strikePrice && optionType === 'PE';
                    return (
                      <tr
                        key={`${row.strikePrice}-${row.expiryDate}`}
                        className={cn(
                          'border-b border-border/50 hover:bg-accent/30 transition-colors',
                          isATM && 'bg-primary/5 font-semibold'
                        )}
                      >
                        <td
                          className={cn('text-right px-3 py-1.5 cursor-pointer text-profit font-mono', isSelCE && 'bg-profit/20')}
                          onClick={() => row.CE && handleSelectOption(row.strikePrice, 'CE', row.CE.lastPrice)}
                        >
                          {row.CE ? row.CE.lastPrice.toFixed(2) : '—'}
                        </td>
                        <td className="text-right px-3 py-1.5 text-muted-foreground font-mono">
                          {row.CE ? (row.CE.oi / 1000).toFixed(0) + 'K' : '—'}
                        </td>
                        <td className={cn('text-center px-3 py-1.5 font-mono', isATM && 'text-primary')}>
                          {row.strikePrice}
                          {isATM && <span className="ml-1 text-[9px] text-primary">ATM</span>}
                        </td>
                        <td className="text-left px-3 py-1.5 text-muted-foreground font-mono">
                          {row.PE ? (row.PE.oi / 1000).toFixed(0) + 'K' : '—'}
                        </td>
                        <td
                          className={cn('text-left px-3 py-1.5 cursor-pointer text-loss font-mono', isSelPE && 'bg-loss/20')}
                          onClick={() => row.PE && handleSelectOption(row.strikePrice, 'PE', row.PE.lastPrice)}
                        >
                          {row.PE ? row.PE.lastPrice.toFixed(2) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedStrike !== null && (
              <div className="rounded-md border border-border p-3 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  Selected:
                  <Badge variant={optionType === 'CE' ? 'default' : 'destructive'} className="font-mono">
                    {chain.symbol} {selectedStrike} {optionType}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{selectedExpiry}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Entry</Label>
                    <Input type="number" step="0.05" value={entry} onChange={(e) => setEntry(e.target.value)} className="h-8 text-xs font-mono" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stop Loss</Label>
                    <Input type="number" step="0.05" value={sl} onChange={(e) => setSl(e.target.value)} className="h-8 text-xs font-mono border-loss/40" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target</Label>
                    <Input type="number" step="0.05" value={target} onChange={(e) => setTarget(e.target.value)} className="h-8 text-xs font-mono border-profit/40" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lots × Lot size</Label>
                    <div className="flex gap-1 items-center">
                      <Input type="number" min="1" value={lots} onChange={(e) => setLots(e.target.value)} className="h-8 w-14 text-xs font-mono" />
                      <span className="text-muted-foreground text-xs">×</span>
                      <Input type="number" min="1" value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="h-8 w-14 text-xs font-mono" placeholder="25" />
                    </div>
                  </div>
                </div>

                <RPreview entry={entry} sl={sl} target={target} />

                {entry && lots && lotSize && (
                  <p className="text-xs text-muted-foreground">
                    Contracts: {Number(lots) * Number(lotSize)}&nbsp;&nbsp;|
                    &nbsp;Capital at risk: ₹{(Number(entry) * Number(lots) * Number(lotSize)).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={selectedStrike === null || !entry || Number(entry) <= 0}
              className="w-full"
            >
              Add Paper Trade
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
