import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTempPassword } from "../src/lib/generate-password";

test("generates a password of the requested length and safe charset", () => {
  const password = generateTempPassword(14);
  assert.equal(password.length, 14);
  assert.match(password, /^[A-Za-z0-9]+$/);
});

test("enforces a minimum length of 8", () => {
  assert.equal(generateTempPassword(2).length, 8);
});

test("produces distinct values", () => {
  const values = new Set(Array.from({ length: 50 }, () => generateTempPassword()));
  assert.ok(values.size >= 48);
});
