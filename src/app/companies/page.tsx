import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Filters } from "@/components/Filters";
import { Pagination } from "@/components/Pagination";
import { fetchCompanies, fetchFacets } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const page = parseInt(get("page") || "1");
  const pageSize = 50;
  const filters = {
    q: get("q"),
    client: get("client"),
    niche: get("niche"),
    source: get("source"),
    quality_tier: get("quality_tier"),
    industry: get("industry"),
    from: get("from"),
    to: get("to"),
    page,
    pageSize,
  };

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

      <Filters
        exportPath="/api/export/companies"
        fields={[
          { key: "q", label: "Search", type: "text", placeholder: "Name or domain…" },
          {
            key: "client", label: "Client", type: "select",
            options: facets.clients.map((s) => ({ value: s, label: s })),
          },
          {
            key: "niche", label: "Niche", type: "select",
            options: facets.niches.map((s) => ({ value: s, label: s })),
          },
          {
            key: "source", label: "Source", type: "select",
            options: facets.sources.map((s) => ({ value: s, label: s })),
          },
          {
            key: "quality_tier", label: "Quality tier", type: "select",
            options: facets.tiers.map((s) => ({ value: s, label: s })),
          },
          {
            key: "industry", label: "Industry", type: "select",
            options: facets.industries.slice(0, 200).map((s) => ({ value: s, label: s })),
          },
          { key: "from", label: "Updated from", type: "date" },
          { key: "to", label: "Updated to", type: "date" },
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
                <th>Client</th>
                <th>Source</th>
                <th>Tier</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/companies/${c.id}`} style={{ color: "var(--violet-700)", fontWeight: 500 }}>
                      {c.company_name || "—"}
                    </Link>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{c.domain || "—"}</td>
                  <td>{c.industry || "—"}</td>
                  <td className="tabular">{c.employee_count?.toLocaleString() || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>
                    {[c.city, c.state, c.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td>{c.client ? <span className="chip">{c.client}</span> : "—"}</td>
                  <td>{c.source ? <span className="chip chip-muted">{c.source}</span> : "—"}</td>
                  <td>{c.quality_tier ? <TierChip tier={c.quality_tier} /> : "—"}</td>
                  <td className="tabular" style={{ color: "var(--muted)" }}>
                    {c.last_updated ? new Date(c.last_updated).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {!rows.length && !error && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No companies match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageSize={pageSize} total={count} />
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
