export interface BatchConfig {
  batchSize: number;
  maxBatches: number;
  parallelBatches: number;
  maxRows: number;
}

export function getBatchConfig(): BatchConfig {
  const batchSize = parseInt(process.env.BATCH_SIZE ?? "25", 10);
  const maxBatches = parseInt(process.env.MAX_BATCHES ?? "4", 10);
  const parallelBatches = Math.min(
    parseInt(process.env.PARALLEL_BATCHES ?? "3", 10),
    maxBatches
  );

  return {
    batchSize,
    maxBatches,
    parallelBatches: Math.max(1, parallelBatches),
    maxRows: batchSize * maxBatches,
  };
}

export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}