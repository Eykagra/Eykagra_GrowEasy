"use client";

import type { ProgressState } from "@/types/crm";

interface Props {
  progress: ProgressState;
}

export default function ProgressBar({ progress }: Props) {
  const percent =
    progress.totalBatches > 0
      ? Math.round((progress.batch / progress.totalBatches) * 100)
      : 0;

  return (
    <div className="animate-fade-up mx-auto w-full max-w-lg">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-primary)]">
          {progress.message}
        </span>
        <span className="font-semibold text-[var(--accent)]">{percent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        AI is mapping your columns to GrowEasy CRM fields
      </p>
    </div>
  );
}