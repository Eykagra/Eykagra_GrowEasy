import { CRM_STATUSES, DATA_SOURCES } from "../types/crm.js";

export const SYSTEM_PROMPT = `You are a CRM data extraction specialist for GrowEasy CRM.
Your job is to map arbitrary CSV row data into a standardized CRM format.

RULES:
1. crm_status must be exactly one of: ${CRM_STATUSES.join(", ")} — or empty string if unknown.
2. data_source must be exactly one of: ${DATA_SOURCES.join(", ")} — or empty string if none match confidently.
3. created_at must be a date string parseable by JavaScript new Date() — e.g. "2026-05-13 14:20:48" or ISO format. Use current date if no date found.
4. Use crm_note for: remarks, follow-up notes, extra emails, extra phone numbers, and any info that doesn't fit other fields.
5. If multiple emails exist: use the first as email, append others to crm_note.
6. If multiple mobile numbers exist: use the first as mobile_without_country_code, append others to crm_note.
7. SKIP a record (set "skip": true) if it has NEITHER a valid email NOR a valid mobile number.
8. Extract country_code separately (e.g. "+91") from mobile if present.
9. mobile_without_country_code should contain only digits, no country code or spaces.
10. Map intelligently — column names vary wildly (Facebook leads, Google Ads, Excel exports, etc.).
11. Do not invent data. Leave fields as empty string "" if not found.
12. Avoid line breaks in field values; use \\n if needed.
13. Return strict JSON only — no markdown, no comments, no trailing commas, escape quotes inside strings.

Return ONLY a single valid JSON object matching the schema. No text before or after the JSON.`;

export function buildUserPrompt(
  records: { rowIndex: number; data: Record<string, string> }[]
): string {
  return `Extract CRM records from these CSV rows. Each row has a rowIndex and raw column data.

Input rows:
${JSON.stringify(records, null, 2)}

Return JSON with this exact structure:
{
  "records": [
    {
      "rowIndex": <number>,
      "skip": <boolean>,
      "skipReason": "<string if skip=true, else empty>",
      "created_at": "",
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ]
}`;
}