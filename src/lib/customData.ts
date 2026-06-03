const COMMON_BLOCK = new Set([
  "pushed_to_clay", "created_at", "updated_at",
]);
const COMPANY_BLOCK = new Set([
  "naics", "aiark_id", "industries", "legal_name",
  "ai_ark_approaches", "company_type",
  ...COMMON_BLOCK,
]);
const PERSON_BLOCK = new Set([
  "company_linkedin_id", "connections_count", "apollo_id", "aiark_id",
  ...COMMON_BLOCK,
]);

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "object" && Object.keys(v as object).length === 0) return true;
  return false;
}

export function filterCustomData(
  data: Record<string, unknown> | null | undefined,
  kind: "company" | "person",
): [string, unknown][] {
  if (!data) return [];
  const block = kind === "company" ? COMPANY_BLOCK : PERSON_BLOCK;
  return Object.entries(data)
    .filter(([k, v]) => !block.has(k) && !isEmpty(v));
}
