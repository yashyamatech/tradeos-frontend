'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Search, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLotStore, StockLot } from '@/store/lotStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FormState { symbol: string; lotSize: string; notes: string; }
const EMPTY: FormState = { symbol: '', lotSize: '', notes: '' };

function LotDialog({
  open, onClose, initial, onSave, saving, error,
}: {
  open: boolean;
  onClose: () => void;
  initial: FormState;
  onSave: (f: FormState) => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial);
  useEffect(() => { setForm(initial); }, [initial, open]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    if (!form.symbol.trim() || !form.lotSize) return;
    onSave({ ...form, symbol: form.symbol.trim().toUpperCase() });
  }

  const isEdit = !!initial.symbol;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Lot Size' : 'Add F&O Lot Size'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Symbol</Label>
            <Input
              placeholder="e.g. NIFTY, BANKNIFTY, RELIANCE"
              value={form.symbol}
              onChange={set('symbol')}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="uppercase"
              disabled={isEdit}
            />
            {isEdit && <p className="text-[11px] text-muted-foreground">Symbol cannot be changed — delete and re-add instead.</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Lot Size</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={form.lotSize}
              onChange={set('lotSize')}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              placeholder="e.g. Index, expires last Thu"
              value={form.notes}
              onChange={set('notes')}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-loss">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
            </div>
          )}
          <Button
            onClick={submit}
            disabled={saving || !form.symbol.trim() || !form.lotSize}
            className="w-full"
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : isEdit ? 'Save Changes' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LotManager() {
  const { lots, loading, error, fetchLots, createLot, updateLot, deleteLot } = useLotStore();
  const [query,       setQuery]       = useState('');
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<StockLot | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);

  useEffect(() => { fetchLots(); }, [fetchLots]);

  const filtered = lots.filter((l) =>
    l.symbol.includes(query.trim().toUpperCase()) ||
    (l.notes ?? '').toLowerCase().includes(query.toLowerCase())
  );

  function openAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }
  function openEdit(lot: StockLot) {
    setEditTarget(lot);
    setDialogOpen(true);
  }
  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
  }

  async function handleSave(form: FormState) {
    setSaving(true);
    let ok: boolean;
    if (editTarget) {
      ok = await updateLot(editTarget.id, form.symbol, Number(form.lotSize), form.notes || undefined);
    } else {
      ok = await createLot(form.symbol, Number(form.lotSize), form.notes || undefined);
    }
    setSaving(false);
    if (ok) closeDialog();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteLot(id);
    setDeleting(null);
    setConfirmId(null);
  }

  const dialogInitial: FormState = editTarget
    ? { symbol: editTarget.symbol, lotSize: String(editTarget.lotSize), notes: editTarget.notes ?? '' }
    : EMPTY;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">F&amp;O Lot Sizes</h1>
          <p className="text-sm text-muted-foreground">
            {lots.length} symbol{lots.length !== 1 ? 's' : ''} saved &bull; reference while ordering
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLots} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />Refresh
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add New
          </Button>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search symbol or notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading && lots.length === 0 ? (
        <div className="flex items-center gap-2 justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border py-20 text-center text-sm text-muted-foreground">
          {query ? 'No symbols match your search.' : 'No lot sizes saved yet. Click “Add New” to get started.'}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 w-40">Symbol</TableHead>
                <TableHead className="text-right w-32">Lot Size</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right pr-4 w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="pl-5">
                    <span className="font-mono font-bold text-sm">{lot.symbol}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-semibold text-primary text-base">{lot.lotSize.toLocaleString('en-IN')}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lot.notes || <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    {confirmId === lot.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-loss mr-1">Delete?</span>
                        <button
                          onClick={() => handleDelete(lot.id)}
                          disabled={deleting === lot.id}
                          className="p-1 rounded text-loss hover:bg-loss/10 transition-colors"
                          title="Confirm delete"
                        >
                          {deleting === lot.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="p-1 rounded text-muted-foreground hover:bg-accent transition-colors"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(lot)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmId(lot.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LotDialog
        open={dialogOpen}
        onClose={closeDialog}
        initial={dialogInitial}
        onSave={handleSave}
        saving={saving}
        error={dialogOpen ? (useLotStore.getState().error) : null}
      />
    </div>
  );
}
