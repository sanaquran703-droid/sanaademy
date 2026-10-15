import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMonthlyFee, DEFAULT_MONTHLY_FEE_EGP } from "../src/lib/pricing";

test("falls back to the built-in fee for missing or invalid values", () => {
  assert.equal(resolveMonthlyFee(undefined), DEFAULT_MONTHLY_FEE_EGP);
  assert.equal(resolveMonthlyFee(null), DEFAULT_MONTHLY_FEE_EGP);
  assert.equal(resolveMonthlyFee(""), DEFAULT_MONTHLY_FEE_EGP);
  assert.equal(resolveMonthlyFee("abc"), DEFAULT_MONTHLY_FEE_EGP);
  assert.equal(resolveMonthlyFee("0"), DEFAULT_MONTHLY_FEE_EGP);
  assert.equal(resolveMonthlyFee("-10"), DEFAULT_MONTHLY_FEE_EGP);
  assert.equal(resolveMonthlyFee("999999999"), DEFAULT_MONTHLY_FEE_EGP);
});

test("accepts and rounds a valid configured fee", () => {
  assert.equal(resolveMonthlyFee("750"), 750);
  assert.equal(resolveMonthlyFee("123.456"), 123.46);
});
