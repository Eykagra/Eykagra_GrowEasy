"use client";

import type { AppStep } from "@/types/crm";

const STEPS: { key: AppStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "Import" },
  { key: "results", label: "Results" },
];

const STEP_ORDER: AppStep[] = ["upload", "preview", "processing", "results"];

function stepIndex(step: AppStep): number {
  return STEP_ORDER.indexOf(step);
}

interface Props {
  currentStep: AppStep;
}

export default function PipelineStepper({ currentStep }: Props) {
  const currentIdx = stepIndex(currentStep);

  return (
    <div className="content-card !py-4">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const isActive = i === currentIdx;
          const isComplete = i < currentIdx;

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : isComplete
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)]"
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-[11px] font-medium ${
                    isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div className="mx-2 mb-4 h-0.5 w-10 sm:w-16">
                  <div
                    className={`h-full rounded-full ${
                      i < currentIdx ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}