"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`content-card relative flex flex-col items-center justify-center border-2 border-dashed px-8 py-14 transition-all ${
        dragging
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-secondary)]"
      } ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={disabled}
      />

      <div className="mb-4 rounded-full bg-[var(--accent-soft)] p-4">
        <svg
          className="h-8 w-8 text-[var(--accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      <p className="text-lg font-semibold text-[var(--text-primary)]">
        Drop your CSV here
      </p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        or click to browse — Facebook, Google Ads, Excel, any format
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {["Facebook Leads", "Google Ads", "Excel", "CRM Export"].map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}