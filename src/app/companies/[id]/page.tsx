import Link from "next/link";
import { Shell } from "@/components/Shell";
import { fetchCompany } from "@/lib/queries";
import { filterCustomData } from "@/lib/customData";
import { splitSource } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company, peopleCount, people, error } = await fetchCompany(id);
  const customEntries = filterCustomData(company?.custom_data, "company");

  return (
    <Shell active="companies">
      <Link href="/companies" style={{ fontSize: 12, color: "var(--violet-700)" }}>← Companies</Link>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>
        {company?.company_name || "Unknown company"}
      </h1>
      <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        {company?.domain || "—"} {company?.industry ? `· ${company.industry}` : ""}
      </div>

      {error && <div className="card" style={{ marginTop: 16, padding: 16, color: "#BE123C" }}>{error}</div>}
      {!company && !error && <div className="card mt-4" style={{ padding: 16 }}>Not found.</div>}

      {company && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Field label="Employees" value={company.employee_count?.toLocaleString()} />
            <Field label="Founded" value={company.founded_year?.toString()} />
            <Field label="Revenue" value={company.revenue} />
            <Field label="Phone" value={company.phone} />
            <Field label="Location" value={[company.city, company.state, company.country].filter(Boolean).join(", ")} />
            <Field label="Quality tier" value={company.quality_tier} />
            <Field label="MX provider" value={company.mx_provider} />
            <Field label="Security gateway" value={company.security_gateway} />
            <Field label="Domain status" value={company.domain_status} />
            <Field label="Updated" value={company.last_updated ? new Date(company.last_updated).toLocaleDateString() : null} />
            <Field label="Created" value={company.created_at ? new Date(company.created_at).toLocaleDateString() : null} />
            <Field
              label="Source"
              value={null}
              custom={
                <div className="flex flex-wrap gap-1 mt-1">
                  {splitSource(company.source).map((t) => <span key={t} className="chip chip-muted">{t}</span>)}
                  {!splitSource(company.source).length && "—"}
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="card" style={{ padding: 20 }}>
              <div className="label">Tags</div>
              <div className="flex flex-wrap gap-1 mt-3">
                {company.tags?.length
                  ? company.tags.map((t, i) => <span key={i} className="chip">{t}</span>)
                  : <span style={{ fontSize: 12, color: "var(--muted)" }}>No tags.</span>}
              </div>

              {company.technologies?.length ? (
                <div className="mt-4">
                  <div className="label">Technologies</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {company.technologies.map((t, i) => <span key={i} className="chip chip-muted">{t}</span>)}
                  </div>
                </div>
              ) : null}

              {company.keywords?.length ? (
                <div className="mt-4">
                  <div className="label">Keywords</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {company.keywords.map((t, i) => <span key={i} className="chip chip-muted">{t}</span>)}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-1">
                {company.website_url && (
                  <a href={company.website_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--violet-700)" }}>
                    {company.website_url}
                  </a>
                )}
                {company.linkedin_url && (
                  <a href={company.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--violet-700)" }}>
                    {company.linkedin_url}
                  </a>
                )}
              </div>

              {company.description && (
                <div className="mt-4">
                  <div className="label">Description</div>
                  <p style={{ fontSize: 13, marginTop: 6, color: "var(--text)" }}>{company.description}</p>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="label">Enrichment data</div>
              {customEntries.length ? (
                <dl className="mt-3" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: 13 }}>
                  {customEntries.map(([k, v]) => (
                    <>
                      <dt key={k + "k"} style={{ color: "var(--muted)" }}>{k}</dt>
                      <dd key={k + "v"} style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, wordBreak: "break-word" }}>
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </dd>
                    </>
                  ))}
                </dl>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>No enrichment data.</div>
              )}
            </div>
          </div>

          <div className="card mt-4" style={{ padding: 0, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div className="label">Linked people</div>
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }} className="tabular">
                  {peopleCount.toLocaleString()}
                </div>
              </div>
              <Link href={`/people?company_id=${company.id}`} className="btn">View all →</Link>
            </div>
            <table className="data">
              <thead>
                <tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th><th>Status</th></tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/people/${p.id}`} style={{ color: "var(--violet-700)" }}>
                        {p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}
                      </Link>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{p.job_title || "—"}</td>
                    <td className="tabular" style={{ fontSize: 12 }}>{p.email || "—"}</td>
                    <td className="tabular" style={{ fontSize: 12 }}>{p.phone || "—"}</td>
                    <td>{p.email && p.email_status ? <span className="chip chip-muted">{p.email_status}</span> : "—"}</td>
                  </tr>
                ))}
                {!people.length && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No linked people.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Shell>
  );
}

function Field({ label, value, custom }: { label: string; value?: string | number | null; custom?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label">{label}</div>
      {custom ? custom : <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{value || "—"}</div>}
    </div>
  );
}
