import { NextRequest } from "next/server";
import { fetchCompanies, parseCompanyQuery, toCsv } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => { sp[k] = v; });
  const { rows } = await fetchCompanies(parseCompanyQuery(sp), { all: true });
  const csv = toCsv(rows as unknown as Record<string, unknown>[]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="companies-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
