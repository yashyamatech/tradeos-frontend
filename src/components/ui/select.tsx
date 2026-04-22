'use client';
import {
  useState, useRef, useEffect, useCallback,
  createContext, useContext, type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectCtx {
  value:         string;
  labels:        Record<string, string>;
  registerLabel: (v: string, label: string) => void;
  onChange:      (v: string) => void;
  open:          boolean;
  setOpen:       (o: boolean) => void;
}

const Ctx = createContext<SelectCtx | null>(null);
const useCtx = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('Select context missing');
  return c;
};

export function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen]     = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  const registerLabel = useCallback((v: string, label: string) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Ctx.Provider value={{ value, labels, registerLabel, onChange: onValueChange, open, setOpen }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function SelectTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useCtx();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        'flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 text-muted-foreground ml-2 shrink-0 transition-transform',
          open && 'rotate-180'
        )}
      />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, labels } = useCtx();
  const display = labels[value] ?? value;
  return (
    <span className={cn(!display && 'text-muted-foreground')}>
      {display || placeholder || ''}
    </span>
  );
}

export function SelectContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open } = useCtx();
  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute top-full mt-1 left-0 right-0 z-50 rounded-md border border-border bg-card shadow-lg max-h-60 overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: selected, onChange, setOpen, registerLabel } = useCtx();

  useEffect(() => {
    if (typeof children === 'string') registerLabel(value, children);
  }, [value, children, registerLabel]);

  return (
    <div
      className={cn(
        'px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors',
        selected === value && 'bg-primary/10 text-primary font-medium',
        className
      )}
      onClick={() => { onChange(value); setOpen(false); }}
    >
      {children}
    </div>
  );
}
