import { getBatchConfig, splitIntoBatches } from "../config/batchConfig.js";
import { AiService } from "./aiService.js";
import type { BatchExtractionResult } from "./extractionParser.js";
import type { ImportResult, ProgressEvent } from "../types/crm.js";

export type ProgressCallback = (event: ProgressEvent) => void;

type BatchRecord = { rowIndex: number; data: Record<string, string> };

export class BatchProcessor {
  private aiService: AiService;
  private config: ReturnType<typeof getBatchConfig>;

  constructor(aiService: AiService) {
    this.aiService = aiService;
    this.config = getBatchConfig();
  }

  async process(
    records: Record<string, string>[],
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const totalRowsInFile = records.length;
    const rowsToProcess = Math.min(totalRowsInFile, this.config.maxRows);
    const truncated = totalRowsInFile > rowsToProcess;

    const batchRecords: BatchRecord[] = records
      .slice(0, rowsToProcess)
      .map((data, idx) => ({ rowIndex: idx, data }));

    const batches = splitIntoBatches(batchRecords, this.config.batchSize);
    const totalBatches = batches.length;

    if (truncated) {
      console.warn(
        `CSV has ${totalRowsInFile} rows. Processing ${totalBatches} batch(es) (${rowsToProcess} rows max).`
      );
    }

    const merged = await this.processBatchesInParallel(
      batches,
      totalBatches,
      onProgress
    );

    return buildImportResult(merged, totalRowsInFile, rowsToProcess, truncated);
  }

  private async processBatchesInParallel(
    batches: BatchRecord[][],
    totalBatches: number,
    onProgress?: ProgressCallback
  ): Promise<BatchExtractionResult> {
    const imported: BatchExtractionResult["imported"] = [];
    const skipped: BatchExtractionResult["skipped"] = [];
    let completedBatches = 0;

    for (let i = 0; i < batches.length; i += this.config.parallelBatches) {
      const wave = batches.slice(i, i + this.config.parallelBatches);
      const waveNumbers = wave.map((_, idx) => i + idx + 1);
      const rowCount = wave.reduce((sum, batch) => sum + batch.length, 0);

      const waveProviders = waveNumbers
        .map((n) => `${n}:${this.aiService.getProviderForBatch(n)}`)
        .join(", ");

      onProgress?.({
        type: "progress",
        batch: completedBatches,
        totalBatches,
        message: `Processing batch${wave.length > 1 ? "es" : ""} ${waveNumbers.join(", ")} of ${totalBatches} in parallel (${rowCount} rows) — ${waveProviders}`,
      });

      const waveStartedAt = Date.now();
      console.log(
        `[parallel] Wave started: batches ${waveNumbers.join(", ")} (${wave.length} concurrent API calls)`
      );

      const results = await Promise.all(
        wave.map(async (batch, idx) => {
          const batchNumber = i + idx + 1;
          const provider = this.aiService.getProviderForBatch(batchNumber);
          const startedAt = Date.now();
          console.log(
            `[batch ${batchNumber}] ${provider} API call started (${batch.length} rows) +${startedAt - waveStartedAt}ms from wave start`
          );

          const result = await this.aiService.extractBatch(batch, { batchNumber });

          console.log(
            `[batch ${batchNumber}] ${provider} finished in ${Date.now() - startedAt}ms`
          );
          completedBatches++;

          onProgress?.({
            type: "progress",
            batch: completedBatches,
            totalBatches,
            message: `Completed batch ${batchNumber} of ${totalBatches} (${provider})`,
          });

          return result;
        })
      );

      console.log(
        `[parallel] Wave finished in ${Date.now() - waveStartedAt}ms (batches ${waveNumbers.join(", ")})`
      );

      for (const result of results) {
        imported.push(...result.imported);
        skipped.push(...result.skipped);
      }
    }

    return { imported, skipped };
  }
}

function buildImportResult(
  result: BatchExtractionResult,
  totalRowsInFile: number,
  rowsProcessed: number,
  truncated: boolean
): ImportResult {
  return {
    imported: result.imported,
    skipped: result.skipped,
    totalImported: result.imported.length,
    totalSkipped: result.skipped.length,
    totalRowsInFile,
    rowsProcessed,
    rowsNotProcessed: totalRowsInFile - rowsProcessed,
    truncated,
  };
}