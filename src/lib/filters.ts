export type CompanyFilters = {
  q?: string;
  client?: string;
  niche?: string;
  source?: string;
  quality_tier?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PeopleFilters = {
  q?: string;
  company_id?: string;
  client?: string;
  email_status?: string;
  phone_status?: string;
  source?: string;
  page?: number;
  pageSize?: number;
};

export function parseSearchParams(sp: Record<string, string | string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v) out[k] = v;
    else if (Array.isArray(v) && v[0]) out[k] = v[0]!;
  }
  return out;
}
