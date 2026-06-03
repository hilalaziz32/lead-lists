import Link from "next/link";
import { Shell } from "@/components/Shell";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { fetchCompanies, fetchFacets, parseCompanyQuery } from "@/lib/queries";
import { splitSource, EMPLOYEE_BUCKETS } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseCompanyQuery(sp);
  const pageSize = 50;
  filters.pageSize = pageSize;

  const [{ rows, count, error }, facets] = await Promise.all([
    fetchCompanies(filters),
    fetchFacets(),
  ]);

  return (
    <Shell active="companies">
      <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>INVENTORY</div>
      <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>Companies</h1>
      <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
        <span className="tabular">{count.toLocaleString()}</span> companies matching current filters.
      </p>

      <FilterBar
        exportPath="/api/export/companies"
        fields={[
          { kind: "text", key: "q", label: "Search", placeholder: "Name or domain…" },
          {
            kind: "multi", key: "niche", label: "Niche",
            options: facets.niches.map((n) => ({ value: n.value, label: n.value, count: n.count })),
          },
          {
            kind: "multi", key: "source", label: "Source",
            options: facets.sources.map((s) => ({ value: s.value, label: s.value, count: s.count })),
          },
          {
            kind: "multi", key: "industry", label: "Industry",
            options: facets.industries.map((s) => ({ value: s, label: s })),
          },
          {
            kind: "multi", key: "employee", label: "Employee size",
            options: EMPLOYEE_BUCKETS.map((b) => ({ value: b.value, label: b.label })),
          },
          {
            kind: "multi", key: "country", label: "Country",
            options: facets.countries.map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      {error && (
        <div className="card" style={{ marginTop: 16, padding: 16, borderColor: "#FECDD3", background: "#FFF1F2", color: "#BE123C" }}>
          {error}
        </div>
      )}

      <div className="card rise mt-4" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Industry</th>
                <th>Employees</th>
                <th>Location</th>
                <th>Source</th>
                <th>Quality tier</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }}>
                  <td>
                    <Link href={`/companies/${c.id}`} style={{ color: "var(--violet-700)", fontWeight: 500 }}>
                      {c.company_name || "—"}
                    </Link>
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    <Link href={`/companies/${c.id}`}>{c.domain || "—"}</Link>
                  </td>
                  <td><Link href={`/companies/${c.id}`}>{c.industry || "—"}</Link></td>
                  <td className="tabular"><Link href={`/companies/${c.id}`}>{c.employee_count?.toLocaleString() || "—"}</Link></td>
                  <td style={{ color: "var(--muted)" }}>
                    <Link href={`/companies/${c.id}`}>{[c.city, c.country].filter(Boolean).join(", ") || "—"}</Link>
                  </td>
                  <td>
                    <Link href={`/companies/${c.id}`} className="flex flex-wrap gap-1">
                      {splitSource(c.source).length
                        ? splitSource(c.source).map((t) => <span key={t} className="chip chip-muted">{t}</span>)
                        : "—"}
                    </Link>
                  </td>
                  <td><Link href={`/companies/${c.id}`}>{c.quality_tier ? <TierChip tier={c.quality_tier} /> : "—"}</Link></td>
                  <td className="tabular" style={{ color: "var(--muted)" }}>
                    <Link href={`/companies/${c.id}`}>{c.last_updated ? new Date(c.last_updated).toLocaleDateString() : "—"}</Link>
                  </td>
                </tr>
              ))}
              {!rows.length && !error && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No companies match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={filters.page || 1} pageSize={pageSize} total={count} />
    </Shell>
  );
}

function TierChip({ tier }: { tier: string }) {
  const cls =
    tier === "tier_1" ? "chip chip-emerald" :
    tier === "tier_2" ? "chip chip-amber" :
    tier === "tier_3" ? "chip chip-rose" : "chip chip-muted";
  return <span className={cls}>{tier}</span>;
}
