import { test } from "node:test";
import assert from "node:assert/strict";
import { idListSchema, MAX_BULK_DELETE } from "../src/lib/api-validation";

const uuid = "6f1b0b8a-2b1c-4e0d-9f3a-1c2d3e4f5a6b";
const uuid2 = "123e4567-e89b-42d3-a456-426614174000";

test("accepts a valid list of ids", () => {
  const parsed = idListSchema.safeParse([uuid, uuid2]);
  assert.equal(parsed.success, true);
});

test("rejects empty lists and non-array input", () => {
  assert.equal(idListSchema.safeParse([]).success, false);
  assert.equal(idListSchema.safeParse("not-an-array").success, false);
});

test("rejects malformed ids", () => {
  assert.equal(idListSchema.safeParse(["1"]).success, false);
  assert.equal(idListSchema.safeParse([uuid, "drop table"]).success, false);
});

test("rejects more than the batch limit", () => {
  const tooMany = Array.from({ length: MAX_BULK_DELETE + 1 }, () => uuid);
  assert.equal(idListSchema.safeParse(tooMany).success, false);
});
