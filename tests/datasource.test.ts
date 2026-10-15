import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectDatasourceUrl,
  isDirectSupabaseHost,
  isPoolerSupabaseHost,
} from "../src/lib/datasource";

const DIRECT = "postgresql://postgres:pw@db.abcdefghijklmnop.supabase.co:5432/postgres";
const POOLER_SESSION =
  "postgresql://postgres.abcdefghijklmnop:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";
const POOLER_TXN =
  "postgresql://postgres.abcdefghijklmnop:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
const LOCAL = "postgresql://postgres:pw@localhost:5432/sana";

test("host classification is correct", () => {
  assert.equal(isDirectSupabaseHost(DIRECT), true);
  assert.equal(isDirectSupabaseHost(POOLER_SESSION), false);
  assert.equal(isPoolerSupabaseHost(POOLER_SESSION), true);
  assert.equal(isPoolerSupabaseHost(POOLER_TXN), true);
  assert.equal(isPoolerSupabaseHost(DIRECT), false);
  assert.equal(isDirectSupabaseHost(LOCAL), false);
});

test("keeps an explicit non-direct DATABASE_URL (pooler) as-is", () => {
  assert.equal(
    selectDatasourceUrl({ DATABASE_URL: POOLER_TXN, DIRECT_URL: POOLER_SESSION }),
    POOLER_TXN,
  );
});

test("keeps a non-Supabase DATABASE_URL (e.g. localhost) as-is", () => {
  assert.equal(
    selectDatasourceUrl({ DATABASE_URL: LOCAL, DIRECT_URL: POOLER_SESSION }),
    LOCAL,
  );
});

test("falls back to a pooler DIRECT_URL when DATABASE_URL is the direct host", () => {
  assert.equal(
    selectDatasourceUrl({ DATABASE_URL: DIRECT, DIRECT_URL: POOLER_SESSION }),
    POOLER_SESSION,
  );
  assert.equal(
    selectDatasourceUrl({ DATABASE_URL: DIRECT, DIRECT_URL: POOLER_TXN }),
    POOLER_TXN,
  );
});

test("never selects a migration-only/direct fallback at runtime", () => {
  // Direct runtime + direct fallback => keep runtime (do not switch to fallback).
  assert.equal(
    selectDatasourceUrl({ DATABASE_URL: DIRECT, DIRECT_URL: DIRECT }),
    DIRECT,
  );
  // Direct runtime + missing fallback => keep runtime.
  assert.equal(selectDatasourceUrl({ DATABASE_URL: DIRECT }), DIRECT);
});

test("does not select a direct fallback when runtime is missing", () => {
  assert.equal(selectDatasourceUrl({ DIRECT_URL: DIRECT }), undefined);
});

test("uses a pooler fallback when runtime is missing", () => {
  assert.equal(selectDatasourceUrl({ DIRECT_URL: POOLER_SESSION }), POOLER_SESSION);
});

test("handles missing / empty configuration", () => {
  assert.equal(selectDatasourceUrl({}), undefined);
  assert.equal(
    selectDatasourceUrl({ DATABASE_URL: "", DIRECT_URL: "   " }),
    undefined,
  );
});
