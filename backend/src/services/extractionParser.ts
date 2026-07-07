import { z } from "zod";
import { parseAiJson } from "../utils/jsonParse.js";
import { CRM_STATUSES, DATA_SOURCES, type CrmRecord } from "../types/crm.js";

const ExtractedRecordSchema = z.object({
  rowIndex: z.number(),
  skip: z.boolean(),
  skipReason: z.string().optional().default(""),
  created_at: z.string().default(""),
  name: z.string().default(""),
  email: z.string().default(""),
  country_code: z.string().default(""),
  mobile_without_country_code: z.string().default(""),
  company: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  country: z.string().default(""),
  lead_owner: z.string().default(""),
  crm_status: z.string().default(""),
  crm_note: z.string().default(""),
  data_source: z.string().default(""),
  possession_time: z.string().default(""),
  description: z.string().default(""),
});

const ResponseSchema = z.object({
  records: z.array(ExtractedRecordSchema),
});

export interface BatchExtractionResult {
  imported: CrmRecord[];
  skipped: { rowIndex: number; originalData: Record<string, string>; reason: string }[];
}

function normalizeCrmRecord(raw: z.infer<typeof ExtractedRecordSchema>): CrmRecord {
  const status = CRM_STATUSES.includes(raw.crm_status as (typeof CRM_STATUSES)[number])
    ? (raw.crm_status as CrmRecord["crm_status"])
    : "";

  const source = DATA_SOURCES.includes(raw.data_source as (typeof DATA_SOURCES)[number])
    ? (raw.data_source as CrmRecord["data_source"])
    : "";

  return {
    created_at: raw.created_at,
    name: raw.name,
    email: raw.email,
    country_code: raw.country_code,
    mobile_without_country_code: raw.mobile_without_country_code.replace(/\D/g, ""),
    company: raw.company,
    city: raw.city,
    state: raw.state,
    country: raw.country,
    lead_owner: raw.lead_owner,
    crm_status: status,
    crm_note: raw.crm_note,
    data_source: source,
    possession_time: raw.possession_time,
    description: raw.description,
  };
}

function hasContactInfo(record: CrmRecord): boolean {
  const hasEmail = record.email.trim().length > 0 && record.email.includes("@");
  const hasMobile = record.mobile_without_country_code.trim().length >= 6;
  return hasEmail || hasMobile;
}

export function parseExtractionResponse(
  content: string,
  batch: { rowIndex: number; data: Record<string, string> }[]
): BatchExtractionResult {
  const parsed = ResponseSchema.parse(parseAiJson(content));
  const imported: CrmRecord[] = [];
  const skipped: BatchExtractionResult["skipped"] = [];
  const dataMap = new Map(batch.map((b) => [b.rowIndex, b.data]));

  for (const record of parsed.records) {
    const originalData = dataMap.get(record.rowIndex) ?? {};

    if (record.skip) {
      skipped.push({
        rowIndex: record.rowIndex,
        originalData,
        reason: record.skipReason || "Missing email and mobile number",
      });
      continue;
    }

    const crmRecord = normalizeCrmRecord(record);

    if (!hasContactInfo(crmRecord)) {
      skipped.push({
        rowIndex: record.rowIndex,
        originalData,
        reason: "Missing email and mobile number",
      });
      continue;
    }

    imported.push(crmRecord);
  }

  return { imported, skipped };
}