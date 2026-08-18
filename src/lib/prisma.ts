import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// If DATABASE_URL is directly unreachable (e.g. network blocks the direct
// Supabase host but the pooler works), fall back to DIRECT_URL so the app stays
// functional. In normal deployments DATABASE_URL is preferred.
function resolveDatasourceUrl(): string | undefined {
  const direct = process.env.DATABASE_URL;
  const pooler = process.env.DIRECT_URL;
  if (direct && !process.env.DATABASE_URL_USE_POOLER) return direct;
  return pooler ?? direct;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
