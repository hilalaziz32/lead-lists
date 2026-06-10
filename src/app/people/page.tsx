import Link from "next/link";
import { Shell } from "@/components/Shell";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { fetchPeople, fetchFacets, parsePersonQuery } from "@/lib/queries";
import { splitSource, EMPLOYEE_BUCKETS } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parsePersonQuery(sp);
  const pageSize = 50;
  filters.pageSize = pageSize;

  const [{ rows, count, error }, facets] = await Promise.all([
    fetchPeople(filters),
    fetchFacets(),
  ]);

  return (
    <Shell active="people">
      <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>INVENTORY</div>
      <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>People</h1>
      <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
        <span className="tabular">{count.toLocaleString()}</span> people matching current filters.
      </p>

      <FilterBar
        exportPath="/api/export/people"
        fields={[
          { kind: "text", key: "q", label: "Search", placeholder: "Name or email…" },
          {
            kind: "multi", key: "niche", label: "Niche",
            options: facets.niches.map((n) => ({ value: n.value, label: n.value, count: n.count })),
          },
          {
            kind: "multi", key: "source", label: "Source",
            options: facets.sources.map((s) => ({ value: s.value, label: s.value, count: s.count })),
          },
          {
            kind: "multi", key: "country", label: "Country (company)",
            options: facets.countries.map((s) => ({ value: s, label: s })),
          },
          {
            kind: "multi", key: "employee", label: "Employee size (company)",
            options: EMPLOYEE_BUCKETS.map((b) => ({ value: b.value, label: b.label })),
          },
          { kind: "range", minKey: "emp_min", maxKey: "emp_max", label: "Custom employee range" },
          {
            kind: "multi", key: "industry", label: "Industry (company)",
            options: facets.industries.map((s) => ({ value: s, label: s })),
          },
          {
            kind: "select", key: "email_presence", label: "Email",
            options: [
              { value: "yes", label: "Not empty" },
              { value: "no", label: "Empty" },
            ],
          },
          {
            kind: "select", key: "phone_presence", label: "Phone",
            options: [
              { value: "yes", label: "Not empty" },
              { value: "no", label: "Empty" },
            ],
          },
          {
            kind: "multi", key: "email_status", label: "Email status",
            options: ["ok", "catch_all", "invalid", "unknown"].map((s) => ({ value: s, label: s })),
          },
          {
            kind: "multi", key: "phone_type", label: "Phone type",
            options: ["mobile", "toll_free", "landline"].map((s) => ({ value: s, label: s })),
          },
          { kind: "text", key: "job_title", label: "Job title (comma-separated)", placeholder: "founder, CEO, owner" },
        ]}
      />

      {error && (
        <div className="card" style={{ marginTop: 16, padding: 16, color: "#BE123C" }}>{error}</div>
      )}

      <div className="card rise mt-4" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th><th>Title</th><th>Email</th><th>Phone</th><th>Company</th>
                <th>Source</th><th>Email status</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 500 }}>
                    <Link href={`/people/${p.id}`} style={{ color: "var(--violet-700)" }}>
                      {p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}
                    </Link>
                  </td>
                  <td style={{ color: "var(--muted)" }}><Link href={`/people/${p.id}`}>{p.job_title || "—"}</Link></td>
                  <td className="tabular" style={{ fontSize: 12 }}><Link href={`/people/${p.id}`}>{p.email || "—"}</Link></td>
                  <td className="tabular" style={{ fontSize: 12 }}><Link href={`/people/${p.id}`}>{p.phone || "—"}</Link></td>
                  <td>
                    {p.companies ? (
                      <Link href={`/companies/${p.companies.id}`} style={{ color: "var(--violet-700)" }}>
                        {p.companies.company_name || p.companies.domain || "—"}
                      </Link>
                    ) : p.company_name || "—"}
                  </td>
                  <td>
                    <Link href={`/people/${p.id}`} className="flex flex-wrap gap-1">
                      {splitSource(p.source).length
                        ? splitSource(p.source).map((t) => <span key={t} className="chip chip-muted">{t}</span>)
                        : "—"}
                    </Link>
                  </td>
                  <td><Link href={`/people/${p.id}`}>{p.email && p.email_status ? <StatusChip s={p.email_status} /> : "—"}</Link></td>
                  <td className="tabular" style={{ color: "var(--muted)" }}>
                    <Link href={`/people/${p.id}`}>{p.last_updated ? new Date(p.last_updated).toLocaleDateString() : "—"}</Link>
                  </td>
                </tr>
              ))}
              {!rows.length && !error && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No people match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={filters.page || 1} pageSize={pageSize} total={count} />
    </Shell>
  );
}

function StatusChip({ s }: { s: string }) {
  const v = s.toLowerCase();
  const cls =
    v === "ok" || v === "valid" ? "chip chip-emerald" :
    v === "invalid" ? "chip chip-rose" :
    v === "catch_all" || v === "risky" ? "chip chip-amber" : "chip chip-muted";
  return <span className={cls}>{s}</span>;
}
