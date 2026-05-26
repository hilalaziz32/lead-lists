import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getStats() {
  const [companies, people, tierAgg, sourceAgg, clientAgg, nicheAgg] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("people").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("quality_tier"),
    supabase.from("companies").select("source"),
    supabase.from("companies").select("client"),
    supabase.from("companies").select("niche"),
  ]);
  const bucket = (rows: { [k: string]: string | null }[] | null, k: string) => {
    const m: Record<string, number> = {};
    (rows || []).forEach((r) => {
      const v = r[k] || "unknown";
      m[v] = (m[v] || 0) + 1;
    });
    return m;
  };
  return {
    totalCompanies: companies.count || 0,
    totalPeople: people.count || 0,
    tiers: bucket(tierAgg.data, "quality_tier"),
    sources: bucket(sourceAgg.data, "source"),
    clients: bucket(clientAgg.data, "client"),
    niches: bucket(nicheAgg.data, "niche"),
    error: companies.error?.message || people.error?.message || null,
  };
}

export default async function Page() {
  const stats = await getStats();
  const topClients = Object.entries(stats.clients).sort((a, b) => b[1] - a[1]).slice(0, 16);
  const topNiches = Object.entries(stats.niches).sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <Shell active="overview">
      <div className="rise" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>OVERVIEW</div>
      <h1 className="rise" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
        Data Inventory
      </h1>
      <p className="rise" style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
        Live snapshot of all companies and people across every client and campaign.
      </p>

      {stats.error && (
        <div className="card rise" style={{ marginTop: 24, padding: 16, borderColor: "#FECDD3", background: "#FFF1F2", color: "#BE123C" }}>
          {stats.error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Stat label="Total companies" value={stats.totalCompanies.toLocaleString()} accent />
        <Stat label="Total people" value={stats.totalPeople.toLocaleString()} />
        <Stat label="Active clients" value={Object.keys(stats.clients).filter((c) => c !== "unknown").length.toLocaleString()} />
        <Stat label="Niches" value={Object.keys(stats.niches).filter((c) => c !== "unknown").length.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="card rise" style={{ padding: 20 }}>
          <div className="label">By quality tier</div>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(stats.tiers).sort().map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={stats.totalCompanies} />
            ))}
            {!Object.keys(stats.tiers).length && <Empty />}
          </div>
        </div>
        <div className="card rise" style={{ padding: 20 }}>
          <div className="label">By source</div>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={stats.totalCompanies} />
            ))}
            {!Object.keys(stats.sources).length && <Empty />}
          </div>
        </div>
      </div>

      <div className="card rise mt-4" style={{ padding: 20 }}>
        <div className="label">Top clients (by company count)</div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {topClients.map(([name, n]) => (
            <a key={name} href={`/companies?client=${encodeURIComponent(name)}`}
              className="px-3 py-2 rounded-lg flex items-center justify-between"
              style={{ border: "1px solid var(--border)", background: "var(--paper)" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
              <span className="tabular" style={{ fontSize: 12, color: "var(--muted)" }}>{n}</span>
            </a>
          ))}
          {!topClients.length && <Empty />}
        </div>
      </div>

      <div className="card rise mt-4" style={{ padding: 20 }}>
        <div className="label">Top niches</div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {topNiches.map(([name, n]) => (
            <a key={name} href={`/companies?niche=${encodeURIComponent(name)}`}
              className="px-3 py-2 rounded-lg flex items-center justify-between"
              style={{ border: "1px solid var(--border)", background: "var(--paper)" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
              <span className="tabular" style={{ fontSize: 12, color: "var(--muted)" }}>{n}</span>
            </a>
          ))}
          {!topNiches.length && <Empty />}
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
        padding: 22,
        background: accent ? "linear-gradient(135deg, #6938EF 0%, #4A22BD 100%)" : undefined,
        color: accent ? "white" : undefined,
        border: accent ? "none" : undefined,
      }}
    >
      <div className="label" style={{ color: accent ? "rgba(255,255,255,0.7)" : undefined }}>{label}</div>
      <div className="tabular" style={{ fontSize: 32, fontWeight: 600, marginTop: 6, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between" style={{ fontSize: 12 }}>
        <span>{label}</span>
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
