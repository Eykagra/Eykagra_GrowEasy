"use client";

import type { ImportResult } from "@/types/crm";
import DataTable from "./DataTable";
import LeadsTable from "./LeadsTable";

interface Props {
  result: ImportResult;
}

export default function ImportResults({ result }: Props) {
  const skippedRows = result.skipped.map((s) => ({
    "Row #": String(s.rowIndex + 1),
    Reason: s.reason,
    ...s.originalData,
  }));

  const skippedHeaders =
    result.skipped.length > 0
      ? ["Row #", "Reason", ...Object.keys(result.skipped[0].originalData)]
      : [];

  return (
    <div className="space-y-6 animate-fade-up">
      {result.truncated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Processed {result.rowsProcessed} of {result.totalRowsInFile} rows.{" "}
          {result.rowsNotProcessed} rows were not imported.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total imported" value={result.totalImported} accent />
        <StatCard label="Total skipped" value={result.totalSkipped} />
        <StatCard
          label="Success rate"
          value={
            result.totalImported + result.totalSkipped > 0
              ? `${Math.round(
                  (result.totalImported /
                    (result.totalImported + result.totalSkipped)) *
                    100
                )}%`
              : "—"
          }
        />
        <StatCard
          label="Rows in file"
          value={
            result.truncated
              ? `${result.rowsProcessed}/${result.totalRowsInFile}`
              : result.totalRowsInFile
          }
        />
      </div>

      {result.imported.length > 0 ? (
        <LeadsTable records={result.imported} />
      ) : (
        <div className="content-card">
          <p className="text-sm text-[var(--text-muted)]">No records were imported.</p>
        </div>
      )}

      {result.skipped.length > 0 && (
        <section className="content-card">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
            Skipped records ({result.totalSkipped})
          </h3>
          <DataTable headers={skippedHeaders} rows={skippedRows} />
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="content-card !p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}