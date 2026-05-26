import { supabase, type Company, type Person } from "./supabase";

export type CompanyQuery = {
  q?: string;
  client?: string;
  niche?: string;
  source?: string;
  quality_tier?: string;
  industry?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PersonQuery = {
  q?: string;
  company_id?: string;
  client?: string;
  email_status?: string;
  phone_type?: string;
  source?: string;
  page?: number;
  pageSize?: number;
};

const COMPANY_COLS =
  "id,company_name,domain,website_url,linkedin_url,industry,city,state,country,employee_count,phone,description,founded_year,revenue,source,client,niche,tags,last_updated,created_at,domain_status,mx_provider,security_gateway,quality_tier,keywords,technologies,custom_data,pushed_to_clay,pushed_to_clay_at";
const PERSON_COLS =
  "id,company_id,first_name,last_name,full_name,email,phone,job_title,linkedin_url,linkedin_username,city,state,country,company_name,domain,source,source_id,tags,pushed_to_emailbison,pushed_to_emailbison_at,pushed_to_ghl,pushed_to_ghl_at,email_status,phone_type,custom_data,last_updated,created_at";

export async function fetchCompanies(f: CompanyQuery, opts: { all?: boolean } = {}) {
  const page = f.page || 1;
  const pageSize = f.pageSize || 50;
  let q = supabase.from("companies").select(COMPANY_COLS, { count: "exact" });

  if (f.q) q = q.or(`company_name.ilike.%${f.q}%,domain.ilike.%${f.q}%`);
  if (f.client) q = q.eq("client", f.client);
  if (f.niche) q = q.eq("niche", f.niche);
  if (f.source) q = q.eq("source", f.source);
  if (f.quality_tier) q = q.eq("quality_tier", f.quality_tier);
  if (f.industry) q = q.eq("industry", f.industry);
  if (f.from) q = q.gte("last_updated", f.from);
  if (f.to) q = q.lte("last_updated", f.to);

  q = q.order("last_updated", { ascending: false, nullsFirst: false });
  if (!opts.all) q = q.range((page - 1) * pageSize, page * pageSize - 1);
  else q = q.limit(50000);

  const { data, count, error } = await q;
  return { rows: (data || []) as Company[], count: count || 0, error: error?.message || null };
}

export async function fetchPeople(f: PersonQuery, opts: { all?: boolean } = {}) {
  const page = f.page || 1;
  const pageSize = f.pageSize || 50;
  let q = supabase
    .from("people")
    .select(`${PERSON_COLS}, companies:company_id ( id, company_name, domain )`, { count: "exact" });

  if (f.q) q = q.or(`first_name.ilike.%${f.q}%,last_name.ilike.%${f.q}%,full_name.ilike.%${f.q}%,email.ilike.%${f.q}%`);
  if (f.company_id) q = q.eq("company_id", f.company_id);
  if (f.client) q = q.contains("tags", [f.client]);
  if (f.email_status) q = q.eq("email_status", f.email_status);
  if (f.phone_type) q = q.eq("phone_type", f.phone_type);
  if (f.source) q = q.eq("source", f.source);

  q = q.order("last_updated", { ascending: false, nullsFirst: false });
  if (!opts.all) q = q.range((page - 1) * pageSize, page * pageSize - 1);
  else q = q.limit(50000);

  const { data, count, error } = await q;
  const normalized = (data || []).map((r: Record<string, unknown>) => {
    const companies = r.companies as
      | { id: string; company_name: string | null; domain: string | null }[]
      | { id: string; company_name: string | null; domain: string | null }
      | null;
    return { ...r, companies: Array.isArray(companies) ? companies[0] || null : companies };
  }) as unknown as Person[];
  return { rows: normalized, count: count || 0, error: error?.message || null };
}

export async function fetchCompany(id: string) {
  const { data: company, error } = await supabase
    .from("companies").select(COMPANY_COLS).eq("id", id).maybeSingle();
  const { count: peopleCount } = await supabase
    .from("people").select("id", { count: "exact", head: true }).eq("company_id", id);
  const { data: people } = await supabase
    .from("people").select(PERSON_COLS).eq("company_id", id).limit(50);
  return {
    company: company as Company | null,
    peopleCount: peopleCount || 0,
    people: (people || []) as Person[],
    error: error?.message || null,
  };
}

export async function fetchFacets() {
  const [src, tier, ind, cli, nic, eml, pht] = await Promise.all([
    supabase.from("companies").select("source").limit(50000),
    supabase.from("companies").select("quality_tier").limit(50000),
    supabase.from("companies").select("industry").limit(50000),
    supabase.from("companies").select("client").limit(50000),
    supabase.from("companies").select("niche").limit(50000),
    supabase.from("people").select("email_status").limit(50000),
    supabase.from("people").select("phone_type").limit(50000),
  ]);
  const dedupe = (arr: { [k: string]: string | null }[] | null, k: string) => {
    const set = new Set<string>();
    (arr || []).forEach((r) => { const v = r[k]; if (v) set.add(v); });
    return Array.from(set).sort();
  };
  return {
    sources: dedupe(src.data, "source"),
    tiers: dedupe(tier.data, "quality_tier"),
    industries: dedupe(ind.data, "industry"),
    clients: dedupe(cli.data, "client"),
    niches: dedupe(nic.data, "niche"),
    emailStatuses: dedupe(eml.data, "email_status"),
    phoneTypes: dedupe(pht.data, "phone_type"),
  };
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
}
