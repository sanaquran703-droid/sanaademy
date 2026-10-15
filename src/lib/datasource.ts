// Pure, testable runtime datasource selection.
//
// Supabase exposes the direct host `db.<ref>.supabase.co` on IPv6-only /
// non-serverless endpoints, which is frequently unreachable from serverless
// runtimes and some networks (Prisma error P1001). The pooler host
// `*.pooler.supabase.com` is reachable. This module chooses a safe runtime URL
// without ever logging connection strings and without silently switching
// migrations to a session/direct URL.

function parseHost(url: string): string | null {
  // Manual parse: never throws on malformed input (unlike `new URL()`).
  const schemeIdx = url.indexOf("://");
  const rest = schemeIdx >= 0 ? url.slice(schemeIdx + 3) : url;
  const at = rest.lastIndexOf("@");
  const afterCreds = at >= 0 ? rest.slice(at + 1) : rest;
  const slash = afterCreds.indexOf("/");
  const authority = slash >= 0 ? afterCreds.slice(0, slash) : afterCreds;
  const q = authority.indexOf("?");
  const hostPort = q >= 0 ? authority.slice(0, q) : authority;
  const host = hostPort.split(":")[0];
  return host || null;
}

// True for the direct Supabase Postgres host (e.g. db.<ref>.supabase.co).
export function isDirectSupabaseHost(url: string): boolean {
  const host = parseHost(url);
  return !!host && /^db\.[a-z0-9]+\.supabase\.co$/i.test(host);
}

// True for a Supabase pooler host (e.g. aws-0-<region>.pooler.supabase.com).
export function isPoolerSupabaseHost(url: string): boolean {
  const host = parseHost(url);
  return !!host && /\.pooler\.supabase\.com$/i.test(host);
}

export type DatasourceEnv = {
  DATABASE_URL?: string;
  DIRECT_URL?: string;
};

// Resolution rules:
//   1. An explicit, non-direct DATABASE_URL always wins (including any pooler,
//      localhost, or other provider URL) — we never override a good value.
//   2. If DATABASE_URL targets the unreachable direct Supabase host, fall back
//      to DIRECT_URL ONLY when it is a pooler host (runtime-capable).
//   3. Otherwise keep DATABASE_URL. We deliberately never substitute a
//      direct/migration-only URL as the runtime datasource.
export function selectDatasourceUrl(env: DatasourceEnv): string | undefined {
  const runtime = env.DATABASE_URL?.trim() || undefined;
  const fallback = env.DIRECT_URL?.trim() || undefined;

  if (runtime && !isDirectSupabaseHost(runtime)) return runtime;
  if (fallback && isPoolerSupabaseHost(fallback)) return fallback;
  return runtime;
}
