export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function splitSource(src: string | null | undefined): string[] {
  if (!src) return [];
  return src.split(",").map((s) => s.trim()).filter(Boolean);
}

export function extractClient(tags: string[] | null | undefined): string | null {
  if (!tags || !tags.length) return null;
  return tags[0] || null;
}

export function extractNiches(
  tags: string[] | null | undefined,
  clients: Set<string>
): string[] {
  if (!tags) return [];
  return tags.filter((t) => !!t && !DATE_RE.test(t) && !clients.has(t));
}

export function parseList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

export const EMPLOYEE_BUCKETS: { label: string; value: string; min: number | null; max: number | null }[] = [
  { label: "1–10", value: "1-10", min: 1, max: 10 },
  { label: "11–50", value: "11-50", min: 11, max: 50 },
  { label: "51–200", value: "51-200", min: 51, max: 200 },
  { label: "201–500", value: "201-500", min: 201, max: 500 },
  { label: "500+", value: "500+", min: 501, max: null },
];

export function bucketsToRanges(values: string[]) {
  return values
    .map((v) => EMPLOYEE_BUCKETS.find((b) => b.value === v))
    .filter((b): b is (typeof EMPLOYEE_BUCKETS)[number] => !!b);
}
