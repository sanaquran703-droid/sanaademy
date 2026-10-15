import { Prisma } from "@prisma/client";

// Diagnostics that are safe for production logs: only an error *class* and, for
// Prisma, a stable error *code*. We deliberately never include error messages,
// request bodies, usernames, passwords, cookies, tokens, or environment values.
export function describeServerError(err: unknown): string {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return `type=PrismaClientInitializationError prismaCode=${err.errorCode ?? "unknown"}`;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return `type=PrismaClientKnownRequestError prismaCode=${err.code}`;
  }
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return "type=PrismaClientRustPanicError";
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return "type=PrismaClientUnknownRequestError";
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return "type=PrismaClientValidationError";
  }
  if (err instanceof Error) {
    // Surface only our own static configuration errors (never their values).
    if (err.message.includes("AUTH_SECRET")) {
      return "type=ConfigError config=AUTH_SECRET";
    }
    if (err.message.includes("SUPABASE_URL") || err.message.includes("SERVICE_ROLE_KEY")) {
      return "type=ConfigError config=SUPABASE";
    }
    return `type=${err.name}`;
  }
  return "type=Unknown";
}

export function logServerError(scope: string, stage: string, err: unknown): void {
  console.error(`[${scope}] stage=${stage} ${describeServerError(err)}`);
}
