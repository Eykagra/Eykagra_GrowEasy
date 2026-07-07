import type { ImportResult, ProgressState } from "@/types/crm";

// Empty = same-origin (Vercel Services). Local dev uses http://localhost:4000
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface StreamHandlers {
  onProgress: (progress: ProgressState) => void;
  onComplete: (result: ImportResult) => void;
  onError: (message: string) => void;
}

export async function importCsvWithProgress(
  file: File,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  try {
    await importCsvStream(file, handlers, signal);
  } catch (err) {
    if (signal?.aborted) throw err;

    // Vercel serverless may not support NDJSON streaming — fall back to JSON API
    console.warn("Stream import failed, falling back to standard import:", err);
    await importCsvJson(file, handlers, signal);
  }
}

async function importCsvStream(
  file: File,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/import/stream`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Import failed" }));
    throw new Error(err.error ?? `Server error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      throw new DOMException("Import cancelled", "AbortError");
    }

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);

      if (event.type === "progress") {
        handlers.onProgress({
          batch: event.batch,
          totalBatches: event.totalBatches,
          message: event.message,
        });
      } else if (event.type === "complete") {
        handlers.onComplete(event.data);
      } else if (event.type === "error") {
        handlers.onError(event.message);
      }
    }
  }
}

async function importCsvJson(
  file: File,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  handlers.onProgress({
    batch: 0,
    totalBatches: 1,
    message: "Processing import (this may take a minute on serverless)...",
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/import`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Import failed" }));
    throw new Error(err.error ?? `Server error: ${response.status}`);
  }

  const body = await response.json();
  if (!body.success || !body.data) {
    throw new Error(body.error ?? "Import failed");
  }

  handlers.onProgress({
    batch: 1,
    totalBatches: 1,
    message: "Import complete",
  });
  handlers.onComplete(body.data);
}