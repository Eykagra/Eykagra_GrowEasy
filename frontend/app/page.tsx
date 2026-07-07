"use client";

import { useCallback, useRef, useState } from "react";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import PipelineStepper from "@/components/PipelineStepper";
import ProgressBar from "@/components/ProgressBar";
import ImportResults from "@/components/ImportResults";
import ThemeToggle from "@/components/ThemeToggle";
import { parseCsvFile } from "@/lib/csvParser";
import { importCsvWithProgress } from "@/lib/api";
import {
  BATCH_SIZE,
  MAX_BATCHES,
  MAX_ROWS,
  PARALLEL_BATCHES,
  batchCount,
  isTruncatedImport,
  rowsToProcess,
} from "@/lib/importLimits";
import type {
  AppStep,
  ImportResult,
  ParsedCsv,
  ProgressState,
} from "@/types/crm";

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFileSelect = useCallback(async (selected: File) => {
    setError(null);
    setLoading(true);

    try {
      const data = await parseCsvFile(selected);
      setParsed(data);
      setFile(selected);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file || !parsed) return;

    const processedRows = rowsToProcess(parsed.records.length);

    if (isTruncatedImport(parsed.records.length)) {
      const ok = window.confirm(
        `This file has ${parsed.records.length} rows. Only up to ${MAX_BATCHES} batches (${processedRows} rows max) will be processed. ${parsed.records.length - processedRows} rows will be skipped. Continue?`
      );
      if (!ok) return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setStep("processing");
    const totalBatches = batchCount(parsed.records.length);
    setProgress({
      batch: 0,
      totalBatches,
      message: `Starting import (${totalBatches} batch${totalBatches !== 1 ? "es" : ""}, up to ${PARALLEL_BATCHES} in parallel)...`,
    });

    try {
      await importCsvWithProgress(
        file,
        {
          onProgress: setProgress,
          onComplete: (data) => {
            setResult(data);
            setStep("results");
          },
          onError: (msg) => setError(msg),
        },
        controller.signal
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Import cancelled.");
        setStep("preview");
        return;
      }
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    } finally {
      abortRef.current = null;
    }
  }, [file, parsed]);

  const handleCancelImport = useCallback(() => {
    abortRef.current?.abort();
    setStep("preview");
    setProgress(null);
  }, []);

  const handleReset = useCallback(() => {
    setStep("upload");
    setParsed(null);
    setFile(null);
    setError(null);
    setProgress(null);
    setResult(null);
  }, []);

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
              G
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">GrowEasy</h1>
              <p className="text-xs text-[var(--text-muted)]">CSV Importer</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-10">
          <PipelineStepper currentStep={step} />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="animate-fade-up">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Import any CSV into CRM format
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-[var(--text-muted)]">
                Upload leads from Facebook, Google Ads, Excel, or any source.
                AI maps your columns automatically.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
            {loading && (
              <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
                Parsing CSV...
              </p>
            )}
          </div>
        )}

        {step === "preview" && parsed && (
          <div className="animate-fade-up space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Preview</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {parsed.fileName} — {parsed.records.length} rows,{" "}
                  {parsed.headers.length} columns
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Will process up to {batchCount(parsed.records.length)} batch
                  {batchCount(parsed.records.length) !== 1 ? "es" : ""} (
                  {rowsToProcess(parsed.records.length)} of {parsed.records.length}{" "}
                  rows, {PARALLEL_BATCHES} in parallel)
                </p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary" onClick={handleReset}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleConfirm}>
                  Confirm import
                </button>
              </div>
            </div>

            {isTruncatedImport(parsed.records.length) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Large file: only {MAX_BATCHES} batches ({MAX_ROWS} rows max) will be
                processed. Remaining {parsed.records.length - MAX_ROWS} rows will not
                be imported.
              </div>
            )}

            <DataTable
              headers={parsed.headers}
              rows={parsed.records}
              maxRows={100}
            />

            {parsed.records.length > 100 && (
              <p className="text-center text-xs text-[var(--text-muted)]">
                Showing first 100 of {parsed.records.length} rows
              </p>
            )}
          </div>
        )}

        {step === "processing" && progress && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-8 h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
            <ProgressBar progress={progress} />
            <button className="btn-secondary mt-8" onClick={handleCancelImport}>
              Cancel import
            </button>
          </div>
        )}

        {step === "results" && result && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold">Import complete</h2>
              <button className="btn-secondary" onClick={handleReset}>
                Import another file
              </button>
            </div>
            <ImportResults result={result} />
          </div>
        )}
      </div>
    </main>
  );
}