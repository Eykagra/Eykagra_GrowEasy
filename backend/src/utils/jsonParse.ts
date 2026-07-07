export function parseAiJson<T>(content: string): T {
  const candidates = buildJsonCandidates(content);

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new Error(
    `AI returned invalid JSON: ${lastError?.message ?? "parse failed"}`
  );
}

function buildJsonCandidates(content: string): string[] {
  const trimmed = content.trim();
  const candidates = new Set<string>();

  candidates.add(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    candidates.add(fenced[1].trim());
  }

  const extracted = extractObject(trimmed);
  if (extracted) {
    candidates.add(extracted);
    candidates.add(repairJson(extracted));
  }

  return [...candidates];
}

function extractObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function repairJson(text: string): string {
  return text
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ");
}