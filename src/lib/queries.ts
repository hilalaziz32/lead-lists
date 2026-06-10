import { supabase, type Company, type Person } from "./supabase";
import { splitSource, DATE_RE, bucketsToRanges, parseList, isNicheTag } from "./tags";

export type CompanyQuery = {
  q?: string;
  niches?: string[];
  sources?: string[];
  industries?: string[];
  countries?: string[];
  employeeBuckets?: string[];
  employeeMin?: number;
  employeeMax?: number;
  page?: number;
  pageSize?: number;
};

export type PersonQuery = {
  q?: string;
  niches?: string[];
  sources?: string[];
  industries?: string[];
  countries?: string[];
  employeeBuckets?: string[];
  employeeMin?: number;
  employeeMax?: number;
  emailPresence?: "any" | "yes" | "no";
  phonePresence?: "any" | "yes" | "no";
  emailStatuses?: string[];
  phoneTypes?: string[];
  jobTitleKeywords?: string[];
  company_id?: string;
  page?: number;
  pageSize?: number;
};

const COMPANY_COLS =
  "id,company_name,domain,website_url,linkedin_url,industry,city,state,country,employee_count,phone,description,founded_year,revenue,source,client,niche,tags,last_updated,created_at,domain_status,mx_provider,security_gateway,quality_tier,keywords,technologies,custom_data,pushed_to_clay,pushed_to_clay_at";
const PERSON_COLS =
  "id,company_id,first_name,last_name,full_name,email,phone,job_title,linkedin_url,linkedin_username,city,state,country,company_name,domain,source,source_id,tags,pushed_to_emailbison,pushed_to_emailbison_at,pushed_to_ghl,pushed_to_ghl_at,email_status,phone_type,custom_data,last_updated,created_at";

function sourceOr(tokens: string[]): string {
  // Match each token against the comma-separated source column.
  // Token "blitz-api" inside "aiark,blitz-api" → use 4 patterns per token.
  const parts: string[] = [];
  for (const raw of tokens) {
    const t = raw.replace(/"/g, "");
    parts.push(`source.eq."${t}"`);
    parts.push(`source.ilike."${t},*"`);
    parts.push(`source.ilike."*,${t}"`);
    parts.push(`source.ilike."*,${t},*"`);
  }
  return parts.join(",");
}

function tagsOr(values: string[]): string {
  return values.map((v) => `tags.cs.{"${v.replace(/"/g, "")}"}`).join(",");
}

function employeeOr(buckets: string[]): string {
  const ranges = bucketsToRanges(buckets);
  return ranges
    .map((r) => {
      if (r.max === null) return `employee_count.gte.${r.min}`;
      return `and(employee_count.gte.${r.min},employee_count.lte.${r.max})`;
    })
    .join(",");
}

function jobTitleOr(keywords: string[]): string {
  return keywords.map((k) => `job_title.ilike."*${k.replace(/"/g, "")}*"`).join(",");
}

export async function fetchCompanies(f: CompanyQuery, opts: { all?: boolean } = {}) {
  const page = f.page || 1;
  const pageSize = f.pageSize || 50;
  let q = supabase.from("companies").select(COMPANY_COLS, { count: "exact" });

  if (f.q) q = q.or(`company_name.ilike.%${f.q}%,domain.ilike.%${f.q}%`);
  if (f.niches?.length) q = q.or(tagsOr(f.niches));
  if (f.sources?.length) q = q.or(sourceOr(f.sources));
  if (f.industries?.length) q = q.in("industry", f.industries);
  if (f.countries?.length) q = q.in("country", f.countries);
  const hasCustomEmp = f.employeeMin !== undefined || f.employeeMax !== undefined;
  if (hasCustomEmp) {
    if (f.employeeMin !== undefined) q = q.gte("employee_count", f.employeeMin);
    if (f.employeeMax !== undefined) q = q.lte("employee_count", f.employeeMax);
  } else if (f.employeeBuckets?.length) {
    q = q.or(employeeOr(f.employeeBuckets));
  }

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
    .select(
      `${PERSON_COLS}, companies:company_id!inner ( id, company_name, domain, industry, country, employee_count, quality_tier )`,
      { count: "exact" }
    );

  if (f.q) q = q.or(`first_name.ilike.%${f.q}%,last_name.ilike.%${f.q}%,full_name.ilike.%${f.q}%,email.ilike.%${f.q}%`);
  if (f.company_id) q = q.eq("company_id", f.company_id);
  if (f.niches?.length) q = q.or(tagsOr(f.niches));
  if (f.sources?.length) q = q.or(sourceOr(f.sources));
  if (f.emailStatuses?.length) q = q.in("email_status", f.emailStatuses);
  if (f.phoneTypes?.length) q = q.in("phone_type", f.phoneTypes);
  if (f.jobTitleKeywords?.length) q = q.or(jobTitleOr(f.jobTitleKeywords));

  if (f.emailPresence === "yes") q = q.not("email", "is", null).not("email", "eq", "");
  if (f.emailPresence === "no") q = q.or("email.is.null,email.eq.");
  if (f.phonePresence === "yes") q = q.not("phone", "is", null).not("phone", "eq", "");
  if (f.phonePresence === "no") q = q.or("phone.is.null,phone.eq.");

  // company-linked filters
  if (f.industries?.length) q = q.in("companies.industry", f.industries);
  if (f.countries?.length) q = q.in("companies.country", f.countries);
  const hasCustomEmpP = f.employeeMin !== undefined || f.employeeMax !== undefined;
  if (hasCustomEmpP) {
    if (f.employeeMin !== undefined) q = q.gte("companies.employee_count", f.employeeMin);
    if (f.employeeMax !== undefined) q = q.lte("companies.employee_count", f.employeeMax);
  } else if (f.employeeBuckets?.length) {
    const ranges = bucketsToRanges(f.employeeBuckets);
    const or = ranges
      .map((r) => r.max === null ? `employee_count.gte.${r.min}` : `and(employee_count.gte.${r.min},employee_count.lte.${r.max})`)
      .join(",");
    q = q.or(or, { referencedTable: "companies" });
  }

  q = q.order("last_updated", { ascending: false, nullsFirst: false });
  if (!opts.all) q = q.range((page - 1) * pageSize, page * pageSize - 1);
  else q = q.limit(50000);

  const { data, count, error } = await q;
  const normalized = (data || []).map((r: Record<string, unknown>) => {
    const companies = r.companies as
      | { id: string; company_name: string | null; domain: string | null; industry: string | null; country: string | null; employee_count: number | null; quality_tier: string | null }
      | { id: string; company_name: string | null; domain: string | null; industry: string | null; country: string | null; employee_count: number | null; quality_tier: string | null }[]
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

export async function fetchPerson(id: string) {
  const { data, error } = await supabase
    .from("people")
    .select(`${PERSON_COLS}, companies:company_id ( id, company_name, domain, industry, country, employee_count, quality_tier )`)
    .eq("id", id)
    .maybeSingle();
  let person: Person | null = null;
  if (data) {
    const r = data as Record<string, unknown>;
    const companies = r.companies as Person["companies"];
    person = { ...r, companies: Array.isArray(companies) ? companies[0] || null : companies } as unknown as Person;
  }
  return { person, error: error?.message || null };
}

export type Facets = {
  niches: { value: string; count: number }[];
  sources: { value: string; count: number }[];
  industries: string[];
  countries: string[];
  emailStatuses: string[];
  phoneTypes: string[];
  clientSet: Set<string>;
};

export async function fetchFacets(): Promise<Facets> {
  const [tagsR, sourceR, industryR, countryR, eStatR, pTypeR] = await Promise.all([
    supabase.from("companies").select("tags").limit(50000),
    supabase.from("companies").select("source").limit(50000),
    supabase.from("companies").select("industry").limit(50000),
    supabase.from("companies").select("country").limit(50000),
    supabase.from("people").select("email_status").limit(50000),
    supabase.from("people").select("phone_type").limit(50000),
  ]);

  const clientSet = new Set<string>();
  (tagsR.data || []).forEach((r: { tags: string[] | null }) => {
    const c = r.tags?.[0];
    if (c && !DATE_RE.test(c)) clientSet.add(c);
  });

  const nicheCounts = new Map<string, number>();
  (tagsR.data || []).forEach((r: { tags: string[] | null }) => {
    const seen = new Set<string>();
    (r.tags || []).forEach((t) => {
      if (!isNicheTag(t, clientSet) || seen.has(t)) return;
      seen.add(t);
      nicheCounts.set(t, (nicheCounts.get(t) || 0) + 1);
    });
  });

  const sourceCounts = new Map<string, number>();
  (sourceR.data || []).forEach((r: { source: string | null }) => {
    splitSource(r.source).forEach((tok) => {
      sourceCounts.set(tok, (sourceCounts.get(tok) || 0) + 1);
    });
  });

  const dedupe = (rows: { [k: string]: string | null }[] | null, k: string) => {
    const s = new Set<string>();
    (rows || []).forEach((r) => { const v = r[k]; if (v) s.add(v); });
    return Array.from(s).sort();
  };

  return {
    niches: Array.from(nicheCounts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
    sources: Array.from(sourceCounts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
    industries: dedupe(industryR.data, "industry"),
    countries: dedupe(countryR.data, "country"),
    emailStatuses: dedupe(eStatR.data, "email_status"),
    phoneTypes: dedupe(pTypeR.data, "phone_type"),
    clientSet,
  };
}

function parseInt0(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = parseInt(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseCompanyQuery(sp: Record<string, string | string[] | undefined>): CompanyQuery {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return {
    q: get("q"),
    niches: parseList(get("niche")),
    sources: parseList(get("source")),
    industries: parseList(get("industry")),
    countries: parseList(get("country")),
    employeeBuckets: parseList(get("employee")),
    employeeMin: parseInt0(get("emp_min")),
    employeeMax: parseInt0(get("emp_max")),
    page: parseInt(get("page") || "1"),
  };
}

export function parsePersonQuery(sp: Record<string, string | string[] | undefined>): PersonQuery {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const ep = get("email_presence");
  const pp = get("phone_presence");
  return {
    q: get("q"),
    niches: parseList(get("niche")),
    sources: parseList(get("source")),
    industries: parseList(get("industry")),
    countries: parseList(get("country")),
    employeeBuckets: parseList(get("employee")),
    employeeMin: parseInt0(get("emp_min")),
    employeeMax: parseInt0(get("emp_max")),
    emailPresence: ep === "yes" || ep === "no" ? ep : "any",
    phonePresence: pp === "yes" || pp === "no" ? pp : "any",
    emailStatuses: parseList(get("email_status")),
    phoneTypes: parseList(get("phone_type")),
    jobTitleKeywords: parseList(get("job_title")),
    company_id: get("company_id"),
    page: parseInt(get("page") || "1"),
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
