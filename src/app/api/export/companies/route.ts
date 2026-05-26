import { NextRequest } from "next/server";
import { fetchCompanies, toCsv } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const get = (k: string) => sp.get(k) || undefined;
  const { rows } = await fetchCompanies(
    {
      q: get("q"),
      client: get("client"),
      niche: get("niche"),
      source: get("source"),
      quality_tier: get("quality_tier"),
      industry: get("industry"),
      from: get("from"),
      to: get("to"),
    },
    { all: true }
  );
  const csv = toCsv(rows as unknown as Record<string, unknown>[]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="companies-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
