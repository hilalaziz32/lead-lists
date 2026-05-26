import Link from "next/link";

export function Shell({
  active,
  children,
}: {
  active: "overview" | "companies" | "people";
  children: React.ReactNode;
}) {
  const items: { key: typeof active; label: string; href: string; icon: string }[] = [
    { key: "overview", label: "Overview", href: "/", icon: "▦" },
    { key: "companies", label: "Companies", href: "/companies", icon: "▢" },
    { key: "people", label: "People", href: "/people", icon: "◉" },
  ];
  return (
    <div className="flex min-h-screen relative z-10">
      <aside className="w-64 shrink-0 p-5 flex flex-col gap-6"
        style={{ background: "#0E0B1A", color: "white" }}>
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: "var(--violet)" }}>
            <span style={{ color: "white", fontWeight: 700 }}>↗</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
              SCALE<span style={{ color: "var(--violet-200)" }}>TOPIA</span>
            </div>
            <div style={{ fontSize: 10, color: "#9892B5", letterSpacing: "0.1em" }}>LEADS</div>
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "#9892B5", letterSpacing: "0.1em" }}>DATABASE</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Supabase Inventory</div>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <Link
                key={it.key}
                href={it.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: isActive ? "rgba(105,56,239,0.18)" : "transparent",
                  color: isActive ? "white" : "#C7C2DE",
                  border: isActive ? "1px solid rgba(105,56,239,0.3)" : "1px solid transparent",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span style={{ width: 16, opacity: 0.7, fontSize: 12 }}>{it.icon}</span>
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto text-xs" style={{ color: "#6E6A82" }}>
          Internal tool · v1
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
