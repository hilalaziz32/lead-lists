import { NextRequest } from "next/server";
import { fetchPeople, toCsv } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const get = (k: string) => sp.get(k) || undefined;
  const { rows } = await fetchPeople(
    {
      q: get("q"),
      company_id: get("company_id"),
      client: get("client"),
      email_status: get("email_status"),
      phone_type: get("phone_type"),
      source: get("source"),
    },
    { all: true }
  );
  const flat = rows.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    job_title: p.job_title,
    linkedin_url: p.linkedin_url,
    linkedin_username: p.linkedin_username,
    city: p.city,
    state: p.state,
    country: p.country,
    email_status: p.email_status,
    phone_type: p.phone_type,
    source: p.source,
    source_id: p.source_id,
    tags: (p.tags || []).join("|"),
    company_id: p.company_id,
    company_name: p.companies?.company_name || p.company_name,
    company_domain: p.companies?.domain || p.domain,
    pushed_to_emailbison: p.pushed_to_emailbison,
    pushed_to_ghl: p.pushed_to_ghl,
    last_updated: p.last_updated,
    created_at: p.created_at,
    custom_data: p.custom_data ? JSON.stringify(p.custom_data) : "",
  }));
  const csv = toCsv(flat as unknown as Record<string, unknown>[]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="people-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
