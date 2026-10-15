import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { describeServerError } from "../src/lib/server-log";

test("classifies a Prisma initialization error with its code", () => {
  const err = new Prisma.PrismaClientInitializationError(
    "Can't reach database server at db.example.supabase.co:5432",
    "5.20.0",
    "P1001",
  );
  assert.equal(
    describeServerError(err),
    "type=PrismaClientInitializationError prismaCode=P1001",
  );
});

test("classifies a Prisma known request error with its code", () => {
  const err = new Prisma.PrismaClientKnownRequestError("relation does not exist", {
    code: "P2021",
    clientVersion: "5.20.0",
  });
  assert.equal(describeServerError(err), "type=PrismaClientKnownRequestError prismaCode=P2021");
});

test("flags a missing AUTH_SECRET without exposing any value", () => {
  const err = new Error("AUTH_SECRET missing or too short");
  assert.equal(describeServerError(err), "type=ConfigError config=AUTH_SECRET");
});

test("never includes the message text of a generic error", () => {
  const err = new Error("super-secret-token-12345");
  const described = describeServerError(err);
  assert.equal(described, "type=Error");
  assert.ok(!described.includes("super-secret-token-12345"));
});

test("handles non-Error throwables", () => {
  assert.equal(describeServerError("boom"), "type=Unknown");
  assert.equal(describeServerError(undefined), "type=Unknown");
});
