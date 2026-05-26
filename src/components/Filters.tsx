"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export type FilterField =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "date" };

export function Filters({ fields, exportPath }: { fields: FilterField[]; exportPath: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const clear = () => startTransition(() => router.push(pathname));

  const exportUrl = `${exportPath}?${sp.toString()}`;

  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}>
        {fields.map((f) => (
          <div key={f.key}>
            <div className="label" style={{ marginBottom: 6 }}>{f.label}</div>
            {f.type === "text" && (
              <input
                className="input"
                placeholder={f.placeholder}
                defaultValue={sp.get(f.key) || ""}
                onChange={(e) => update(f.key, e.target.value)}
              />
            )}
            {f.type === "select" && (
              <select
                className="select"
                value={sp.get(f.key) || ""}
                onChange={(e) => update(f.key, e.target.value)}
              >
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
            {f.type === "date" && (
              <input
                type="date"
                className="input"
                defaultValue={sp.get(f.key) || ""}
                onChange={(e) => update(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4">
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {isPending ? "Updating…" : "Filters apply live"}
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={clear}>Clear</button>
          <a className="btn btn-primary" href={exportUrl}>Export CSV</a>
        </div>
      </div>
    </div>
  );
}
