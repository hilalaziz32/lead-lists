"use client";
import { useEffect, useRef, useState } from "react";

export function MultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder = "Any",
}: {
  label: string;
  options: { value: string; label: string; count?: number }[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };

  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  const summary = values.length === 0 ? placeholder
    : values.length === 1 ? values[0]
    : `${values.length} selected`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <button
        type="button"
        className="input"
        style={{ textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: values.length ? "var(--text)" : "var(--muted)" }}>
          {summary}
        </span>
        <span style={{ color: "var(--muted)", fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "var(--card)", border: "1px solid var(--border-strong)",
            borderRadius: 10, padding: 8, zIndex: 50,
            maxHeight: 280, overflow: "auto",
            boxShadow: "0 8px 24px rgba(14,11,26,0.08)",
            minWidth: 220,
          }}
        >
          {options.length > 8 && (
            <input
              className="input"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ marginBottom: 6 }}
              autoFocus
            />
          )}
          {values.length > 0 && (
            <button type="button" className="btn" style={{ width: "100%", marginBottom: 6, justifyContent: "center" }} onClick={() => onChange([])}>
              Clear ({values.length})
            </button>
          )}
          {filtered.map((o) => {
            const sel = values.includes(o.value);
            return (
              <label
                key={o.value}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 6, cursor: "pointer",
                  background: sel ? "var(--violet-50)" : "transparent",
                  fontSize: 13,
                }}
              >
                <input type="checkbox" checked={sel} onChange={() => toggle(o.value)} style={{ accentColor: "var(--violet)" }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                {o.count !== undefined && (
                  <span className="tabular" style={{ fontSize: 11, color: "var(--muted)" }}>{o.count}</span>
                )}
              </label>
            );
          })}
          {!filtered.length && <div style={{ fontSize: 12, color: "var(--muted)", padding: 8 }}>No options.</div>}
        </div>
      )}
    </div>
  );
}
