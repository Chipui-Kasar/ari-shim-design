'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { MaterialId } from '@/types/pharmacy';
import { SURFACES } from '@/lib/materials';
import { formatFeetInches } from '@/lib/units';
import { IconChevron, IconLock } from '@/components/editor/icons';

export function Section({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[#e3e8e5]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold text-[#24332f] hover:bg-[#f3f6f4]"
        aria-expanded={open}
      >
        {icon && <span className="text-[#6f8f6a]">{icon}</span>}
        <span className="flex-1">{title}</span>
        {badge}
        <IconChevron className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-3.5 px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  readOnly,
  note,
  unit = 'in',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  note?: string;
  unit?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Math.round(value * 10) / 10)), [value]);

  const commit = () => {
    const n = parseFloat(draft);
    if (Number.isFinite(n)) onChange?.(Math.min(max, Math.max(min, n)));
    else setDraft(String(value));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1 text-[12px] font-medium text-[#51615c]">
          {label}
          {readOnly && <IconLock width={12} height={12} className="text-[#9aa8a3]" />}
        </label>
        <div className="flex items-center gap-1.5">
          {unit === 'in' && <span className="text-[11px] tabular-nums text-[#7d8d88]">{formatFeetInches(value)}</span>}
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            min={min}
            max={max}
            step={step}
            disabled={readOnly}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), undefined)}
            className="w-[62px] rounded-md border border-[#d5ddd9] bg-white px-1.5 py-1 text-right text-[12px] tabular-nums text-[#1d2b27] outline-none focus:border-[#7fa27a] focus:ring-2 focus:ring-[#7fa27a]/25 disabled:bg-[#f1f4f2] disabled:text-[#8a9893]"
            aria-label={`${label} (${unit})`}
          />
          <span className="w-3 text-[11px] text-[#8a9893]">{unit}</span>
        </div>
      </div>
      {!readOnly && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          onChange={(e) => onChange?.(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-[#6f9a6a]"
          aria-label={label}
        />
      )}
      {note && <p className="mt-1 text-[11px] leading-snug text-[#8a9893]">{note}</p>}
    </div>
  );
}

export function SwatchRow({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: MaterialId;
  options: MaterialId[];
  onChange: (v: MaterialId) => void;
}) {
  return (
    <div>
      {label && <div className="mb-1.5 text-[12px] font-medium text-[#51615c]">{label}</div>}
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((id) => {
          const s = SURFACES[id];
          const active = id === value;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              title={s.label}
              className={`group flex flex-col items-center gap-1 rounded-lg border p-1.5 text-[10.5px] leading-tight transition ${
                active ? 'border-[#6f9a6a] bg-[#eef5ec] text-[#2a4a2c]' : 'border-[#e1e7e3] bg-white text-[#5b6a65] hover:border-[#b9c8bb]'
              }`}
              aria-pressed={active}
            >
              <span
                className="h-6 w-full rounded-md border border-black/10"
                style={{
                  background:
                    s.kind === 'wood'
                      ? `repeating-linear-gradient(90deg, ${s.color}, ${s.color} 5px, color-mix(in srgb, ${s.color} 88%, #000) 5px, color-mix(in srgb, ${s.color} 88%, #000) 6px)`
                      : s.kind === 'metal'
                        ? `linear-gradient(135deg, #e9ecee, ${s.color} 50%, #aeb3b8)`
                        : s.color,
                }}
              />
              <span className="text-center">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ColorRow({
  label,
  value,
  swatches,
  onChange,
  allowClear,
}: {
  label: string;
  value: string | null;
  swatches: string[];
  onChange: (v: string | null) => void;
  allowClear?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#51615c]">{label}</span>
        {allowClear && value && (
          <button type="button" onClick={() => onChange(null)} className="text-[11px] font-medium text-[#6f9a6a] hover:underline">
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Colour ${c}`}
            className={`h-7 w-7 rounded-full border transition ${
              value?.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#6f9a6a] ring-offset-2' : 'border-black/15 hover:scale-105'
            }`}
            style={{ background: c }}
          />
        ))}
        <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-dashed border-[#9aa8a3]" title="Custom colour">
          <input
            type="color"
            value={value ?? '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 h-12 w-12 cursor-pointer opacity-0"
            aria-label="Custom colour"
          />
          <span className="absolute inset-0 flex items-center justify-center text-[14px] text-[#7d8d88]">+</span>
        </label>
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[12.5px] text-[#35443f]">
      <span>
        {label}
        {hint && <span className="block text-[11px] text-[#8a9893]">{hint}</span>}
      </span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-[#cdd6d2] transition peer-checked:bg-[#6f9a6a] peer-focus-visible:ring-2 peer-focus-visible:ring-[#7fa27a]/50" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {label && <span className="text-[12.5px] text-[#35443f]">{label}</span>}
      <div className="inline-flex rounded-lg bg-[#e8eeea] p-0.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-md px-2.5 py-1 text-[11.5px] font-medium transition ${
              o.id === value ? 'bg-white text-[#2a4a2c] shadow-sm' : 'text-[#5b6a65] hover:text-[#2a4a2c]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
