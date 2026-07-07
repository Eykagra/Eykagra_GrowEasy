import Papa from "papaparse";
import type { ParsedCsv } from "@/types/crm";

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? [];

        if (headers.length === 0) {
          reject(new Error("CSV has no headers"));
          return;
        }

        const records = results.data.map((row) => {
          const cleaned: Record<string, string> = {};
          for (const [key, value] of Object.entries(row)) {
            cleaned[key] = String(value ?? "").trim();
          }
          return cleaned;
        });

        if (records.length === 0) {
          reject(new Error("CSV file is empty"));
          return;
        }

        resolve({ headers, records, fileName: file.name });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}