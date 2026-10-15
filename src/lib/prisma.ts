import { PrismaClient } from "@prisma/client";
import { selectDatasourceUrl } from "./datasource";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Runtime-safe datasource: uses DATABASE_URL, but falls back to a pooler
    // URL when DATABASE_URL points at the unreachable direct Supabase host.
    // Migrations still use schema.prisma's `directUrl` (DIRECT_URL) via the
    // Prisma CLI and are unaffected by this runtime override.
    datasourceUrl: selectDatasourceUrl({
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
    }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
