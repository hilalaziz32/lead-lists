import Link from "next/link";
import { Shell } from "@/components/Shell";
import { fetchPerson } from "@/lib/queries";
import { filterCustomData } from "@/lib/customData";
import { splitSource } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { person, error } = await fetchPerson(id);
  const customEntries = filterCustomData(person?.custom_data, "person");
  const fullName = person?.full_name || [person?.first_name, person?.last_name].filter(Boolean).join(" ");

  return (
    <Shell active="people">
      <Link href="/people" style={{ fontSize: 12, color: "var(--violet-700)" }}>← People</Link>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>
        {fullName || "Unknown person"}
      </h1>
      <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        {person?.job_title || "—"}{person?.companies?.company_name ? ` · ${person.companies.company_name}` : ""}
      </div>

      {error && <div className="card" style={{ marginTop: 16, padding: 16, color: "#BE123C" }}>{error}</div>}
      {!person && !error && <div className="card mt-4" style={{ padding: 16 }}>Not found.</div>}

      {person && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            <Field label="Email" custom={
              <div className="flex items-center gap-2 mt-1">
                <span className="tabular" style={{ fontSize: 13, wordBreak: "break-all" }}>{person.email || "—"}</span>
                {person.email && person.email_status && <span className="chip chip-muted">{person.email_status}</span>}
              </div>
            } />
            <Field label="Phone" custom={
              <div className="flex items-center gap-2 mt-1">
                <span className="tabular" style={{ fontSize: 13 }}>{person.phone || "—"}</span>
                {person.phone && person.phone_type && <span className="chip chip-muted">{person.phone_type}</span>}
              </div>
            } />
            <Field label="LinkedIn" custom={
              person.linkedin_url ? (
                <a href={person.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--violet-700)", wordBreak: "break-all" }}>
                  {person.linkedin_username || person.linkedin_url}
                </a>
              ) : <div style={{ fontSize: 13, marginTop: 4 }}>—</div>
            } />
            <Field label="Location" value={[person.city, person.state, person.country].filter(Boolean).join(", ")} />
            <Field label="Updated" value={person.last_updated ? new Date(person.last_updated).toLocaleDateString() : null} />
            <Field label="Created" value={person.created_at ? new Date(person.created_at).toLocaleDateString() : null} />
            <Field label="Source" custom={
              <div className="flex flex-wrap gap-1 mt-1">
                {splitSource(person.source).map((t) => <span key={t} className="chip chip-muted">{t}</span>)}
                {!splitSource(person.source).length && "—"}
              </div>
            } />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="card" style={{ padding: 20 }}>
              <div className="label">Tags</div>
              <div className="flex flex-wrap gap-1 mt-3">
                {person.tags?.length
                  ? person.tags.map((t, i) => <span key={i} className="chip">{t}</span>)
                  : <span style={{ fontSize: 12, color: "var(--muted)" }}>No tags.</span>}
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="label">Linked company</div>
              {person.companies ? (
                <Link href={`/companies/${person.companies.id}`} className="mt-3 block">
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--violet-700)" }}>
                    {person.companies.company_name || person.companies.domain || "—"}
                  </div>
                  <div className="mt-2 flex flex-col gap-1" style={{ fontSize: 13, color: "var(--muted)" }}>
                    {person.companies.domain && <div>{person.companies.domain}</div>}
                    {person.companies.industry && <div>{person.companies.industry}</div>}
                    {person.companies.quality_tier && (
                      <div><span className="chip chip-muted">{person.companies.quality_tier}</span></div>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="mt-3" style={{ fontSize: 13 }}>
                  {person.company_name || "—"}
                  {person.domain ? <div style={{ color: "var(--muted)", fontSize: 12 }}>{person.domain}</div> : null}
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4" style={{ padding: 20 }}>
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
