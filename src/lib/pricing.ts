// Server-side trusted pricing. Client-submitted amounts are never trusted.
const DEFAULT_MONTHLY_FEE_EGP = 500;
const MAX_FEE_EGP = 100_000;

// Pure resolver so it can be unit-tested without touching process.env.
export function resolveMonthlyFee(raw?: string | null): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_FEE_EGP) {
    return DEFAULT_MONTHLY_FEE_EGP;
  }
  return Math.round(value * 100) / 100;
}

// The single trusted fee used when recording a payment. Configurable via the
// server-only MONTHLY_FEE_EGP environment variable.
export function getMonthlyFee(): number {
  return resolveMonthlyFee(process.env.MONTHLY_FEE_EGP);
}

export { DEFAULT_MONTHLY_FEE_EGP };
