export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  rowIndex: number;
  originalData: Record<string, string>;
  reason: string;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalRowsInFile: number;
  rowsProcessed: number;
  rowsNotProcessed: number;
  truncated: boolean;
}

export interface ParsedCsv {
  headers: string[];
  records: Record<string, string>[];
  fileName: string;
}

export type AppStep = "upload" | "preview" | "processing" | "results";

export interface ProgressState {
  batch: number;
  totalBatches: number;
  message: string;
}