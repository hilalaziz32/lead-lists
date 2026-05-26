import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Filters } from "@/components/Filters";
import { Pagination } from "@/components/Pagination";
import { fetchPeople, fetchFacets } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
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
    company_id: get("company_id"),
    client: get("client"),
    email_status: get("email_status"),
    phone_type: get("phone_type"),
    source: get("source"),
    page,
    pageSize,
  };

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

      <Filters
        exportPath="/api/export/people"
        fields={[
          { key: "q", label: "Search", type: "text", placeholder: "Name or email…" },
          {
            key: "client", label: "Client (tag)", type: "select",
            options: facets.clients.map((s) => ({ value: s, label: s })),
          },
          {
            key: "email_status", label: "Email status", type: "select",
            options: facets.emailStatuses.map((s) => ({ value: s, label: s })),
          },
          {
            key: "phone_type", label: "Phone type", type: "select",
            options: facets.phoneTypes.map((s) => ({ value: s, label: s })),
          },
          {
            key: "source", label: "Source", type: "select",
            options: facets.sources.map((s) => ({ value: s, label: s })),
          },
          { key: "company_id", label: "Company ID", type: "text", placeholder: "UUID…" },
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
                <th>Email status</th><th>Phone type</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>
                    {p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.job_title || "—"}</td>
                  <td className="tabular" style={{ fontSize: 12 }}>{p.email || "—"}</td>
                  <td className="tabular" style={{ fontSize: 12 }}>{p.phone || "—"}</td>
                  <td>
                    {p.companies ? (
                      <Link href={`/companies/${p.companies.id}`} style={{ color: "var(--violet-700)" }}>
                        {p.companies.company_name || p.companies.domain || "—"}
                      </Link>
                    ) : p.company_name || "—"}
                  </td>
                  <td>{p.email_status ? <StatusChip s={p.email_status} /> : "—"}</td>
                  <td>{p.phone_type ? <span className="chip chip-muted">{p.phone_type}</span> : "—"}</td>
                  <td className="tabular" style={{ color: "var(--muted)" }}>
                    {p.last_updated ? new Date(p.last_updated).toLocaleDateString() : "—"}
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

      <Pagination page={page} pageSize={pageSize} total={count} />
    </Shell>
  );
}

function StatusChip({ s }: { s: string }) {
  const v = s.toLowerCase();
  const cls =
    v.includes("valid") && !v.includes("in") ? "chip chip-emerald" :
    v.includes("invalid") ? "chip chip-rose" :
    v.includes("risky") || v.includes("catch") ? "chip chip-amber" : "chip chip-muted";
  return <span className={cls}>{s}</span>;
}
