"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { MultiSelect } from "./MultiSelect";

export type Field =
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "multi"; key: string; label: string; options: { value: string; label: string; count?: number }[]; placeholder?: string }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[] };

export function FilterBar({ fields, exportPath }: { fields: Field[]; exportPath: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const update = (k: string, v: string | string[]) => {
    const next = new URLSearchParams(sp.toString());
    const s = Array.isArray(v) ? v.join(",") : v;
    if (s) next.set(k, s); else next.delete(k);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const clear = () => startTransition(() => router.push(pathname));
  const exportUrl = `${exportPath}?${sp.toString()}`;

  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}>
        {fields.map((f) => {
          if (f.kind === "text") {
            return <TextField key={f.key} field={f} sp={sp} update={update} />;
          }
          if (f.kind === "select") {
            return (
              <div key={f.key}>
                <div className="label" style={{ marginBottom: 6 }}>{f.label}</div>
                <select
                  className="select"
                  value={sp.get(f.key) || ""}
                  onChange={(e) => update(f.key, e.target.value)}
                >
                  <option value="">Any</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            );
          }
          const values = (sp.get(f.key) || "").split(",").filter(Boolean);
          return (
            <MultiSelect
              key={f.key}
              label={f.label}
              options={f.options}
              values={values}
              onChange={(next) => update(f.key, next)}
              placeholder={f.placeholder}
            />
          );
        })}
      </div>
      <div className="flex justify-between items-center mt-4">
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {isPending ? "Updating…" : "Filters apply live"}
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={clear}>Clear all</button>
          <a className="btn btn-primary" href={exportUrl}>Export CSV</a>
        </div>
      </div>
    </div>
  );
}

function TextField({
  field,
  sp,
  update,
}: {
  field: { kind: "text"; key: string; label: string; placeholder?: string };
  sp: URLSearchParams;
  update: (k: string, v: string) => void;
}) {
  const initial = sp.get(field.key) || "";
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [initial]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (val !== initial) update(field.key, val);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val]);
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{field.label}</div>
      <input className="input" placeholder={field.placeholder} value={val} onChange={(e) => setVal(e.target.value)} />
    </div>
  );
}
