'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

export function NoteCell({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  const LIMIT = 28;

  return (
    <>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{note}</span>
        {note.length > LIMIT && (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="shrink-0 text-[9px] text-primary/60 hover:text-primary font-medium leading-none"
          >
            •••
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-card border border-border rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Trade Note</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note}</p>
          </div>
        </div>
      )}
    </>
  );
}
