import Link from "next/link";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabase";
import { fetchFacets } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function getTotals() {
  const [c, p] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("people").select("id", { count: "exact", head: true }),
  ]);
  return {
    totalCompanies: c.count || 0,
    totalPeople: p.count || 0,
    error: c.error?.message || p.error?.message || null,
  };
}

export default async function Page() {
  const [totals, facets] = await Promise.all([getTotals(), fetchFacets()]);
  const niches = facets.niches.slice(0, 30);
  const sources = facets.sources;
  const maxNiche = niches[0]?.count || 1;
  const maxSource = sources[0]?.count || 1;

  return (
    <Shell active="overview">
      <div className="rise" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>OVERVIEW</div>
      <h1 className="rise" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
        Data Inventory
      </h1>
      <p className="rise" style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
        Live snapshot of all companies and people in the Supabase database.
      </p>

      {totals.error && (
        <div className="card rise" style={{ marginTop: 24, padding: 16, borderColor: "#FECDD3", background: "#FFF1F2", color: "#BE123C" }}>
          {totals.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Stat label="Total companies" value={totals.totalCompanies.toLocaleString()} accent />
        <Stat label="Total people" value={totals.totalPeople.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="card rise" style={{ padding: 20 }}>
          <div className="flex items-center justify-between">
            <div className="label">Niches</div>
            <div className="tabular" style={{ fontSize: 11, color: "var(--muted)" }}>
              {facets.niches.length.toLocaleString()} total
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {niches.map((n) => (
              <Link key={n.value} href={`/companies?niche=${encodeURIComponent(n.value)}`}>
                <Bar label={n.value} value={n.count} max={maxNiche} />
              </Link>
            ))}
            {!niches.length && <Empty />}
          </div>
        </div>

        <div className="card rise" style={{ padding: 20 }}>
          <div className="flex items-center justify-between">
            <div className="label">Sources</div>
            <div className="tabular" style={{ fontSize: 11, color: "var(--muted)" }}>
              {sources.length.toLocaleString()} total
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {sources.map((s) => (
              <Link key={s.value} href={`/companies?source=${encodeURIComponent(s.value)}`}>
                <Bar label={s.value} value={s.count} max={maxSource} />
              </Link>
            ))}
            {!sources.length && <Empty />}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="card rise"
      style={{
        padding: 28,
        background: accent ? "linear-gradient(135deg, #6938EF 0%, #4A22BD 100%)" : undefined,
        color: accent ? "white" : undefined,
        border: accent ? "none" : undefined,
      }}
    >
      <div className="label" style={{ color: accent ? "rgba(255,255,255,0.7)" : undefined }}>{label}</div>
      <div className="tabular" style={{ fontSize: 44, fontWeight: 600, marginTop: 8, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between" style={{ fontSize: 12 }}>
        <span style={{ color: "var(--text)" }}>{label}</span>
        <span className="tabular" style={{ color: "var(--muted)" }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, background: "var(--paper)", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--violet)", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function Empty() {
  return <div style={{ fontSize: 12, color: "var(--muted)" }}>No data yet.</div>;
}
