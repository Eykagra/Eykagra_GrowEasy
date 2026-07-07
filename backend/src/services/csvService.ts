import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  records: Record<string, string>[];
}

export function parseCsv(buffer: Buffer): ParsedCsv {
  const text = buffer.toString("utf-8");

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    const critical = result.errors.filter((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    if (critical.length > 0) {
      throw new Error(`CSV parse error: ${critical[0].message}`);
    }
  }

  const headers = result.meta.fields ?? [];
  const records = result.data.map((row) => {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      cleaned[key] = String(value ?? "").trim();
    }
    return cleaned;
  });

  if (headers.length === 0 || records.length === 0) {
    throw new Error("CSV file is empty or has no valid headers");
  }

  return { headers, records };
}