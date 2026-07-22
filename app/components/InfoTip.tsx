"use client";

import { useState } from "react";

/**
 * A small "i" button that reveals a plain-English explanation on hover/tap.
 * Used to demystify every term and control; no technical guide needed.
 */
export function InfoTip({ label, children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label ?? "More information"}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-400 text-[9px] font-bold leading-none text-neutral-400 transition-colors hover:border-blue-500 hover:text-blue-500"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-6 left-1/2 z-50 w-60 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-xl dark:bg-neutral-700"
        >
          {label && <span className="mb-0.5 block font-semibold">{label}</span>}
          {children}
        </span>
      )}
    </span>
  );
}
