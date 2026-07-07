export const BATCH_SIZE = parseInt(
  process.env.NEXT_PUBLIC_BATCH_SIZE ?? "25",
  10
);

export const MAX_BATCHES = parseInt(
  process.env.NEXT_PUBLIC_MAX_BATCHES ?? "4",
  10
);

export const PARALLEL_BATCHES = parseInt(
  process.env.NEXT_PUBLIC_PARALLEL_BATCHES ?? "3",
  10
);

export const MAX_ROWS = BATCH_SIZE * MAX_BATCHES;

export function rowsToProcess(rowCount: number): number {
  return Math.min(rowCount, MAX_ROWS);
}

export function batchCount(rowCount: number): number {
  const rows = rowsToProcess(rowCount);
  if (rows === 0) return 0;
  return Math.ceil(rows / BATCH_SIZE);
}

export function isTruncatedImport(rowCount: number): boolean {
  return rowCount > rowsToProcess(rowCount);
}