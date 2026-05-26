"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const go = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    router.push(`${pathname}?${next.toString()}`);
  };
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between mt-4">
      <div style={{ fontSize: 12, color: "var(--muted)" }} className="tabular">
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={page <= 1} onClick={() => go(page - 1)}>Prev</button>
        <div className="btn" style={{ cursor: "default" }}>
          <span className="tabular">{page}</span>
          <span style={{ color: "var(--muted)" }}>/ {totalPages}</span>
        </div>
        <button className="btn" disabled={page >= totalPages} onClick={() => go(page + 1)}>Next</button>
      </div>
    </div>
  );
}
