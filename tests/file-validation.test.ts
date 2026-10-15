import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectMimeFromBytes,
  validateUpload,
  MAX_FILE_SIZE,
} from "../src/lib/file-validation";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]);

test("detects known file signatures", () => {
  assert.equal(detectMimeFromBytes(jpeg), "image/jpeg");
  assert.equal(detectMimeFromBytes(png), "image/png");
  assert.equal(detectMimeFromBytes(webp), "image/webp");
  assert.equal(detectMimeFromBytes(pdf), "application/pdf");
});

test("returns null for unknown signatures", () => {
  assert.equal(detectMimeFromBytes(exe), null);
  assert.equal(detectMimeFromBytes(new Uint8Array([])), null);
});

test("accepts content that matches the declared type", () => {
  assert.deepEqual(validateUpload("proof", "image/jpeg", jpeg.byteLength, jpeg), {
    ok: true,
    mime: "image/jpeg",
  });
  assert.deepEqual(validateUpload("proof", "application/pdf", pdf.byteLength, pdf), {
    ok: true,
    mime: "application/pdf",
  });
});

test("rejects a declared type that does not match the content", () => {
  const result = validateUpload("proof", "image/png", jpeg.byteLength, jpeg);
  assert.equal(result.ok, false);
});

test("rejects executable content even with an image type claimed", () => {
  const result = validateUpload("proof", "image/jpeg", exe.byteLength, exe);
  assert.equal(result.ok, false);
});

test("rejects PDFs for avatar uploads", () => {
  const result = validateUpload("avatar", "application/pdf", pdf.byteLength, pdf);
  assert.equal(result.ok, false);
});

test("rejects files larger than the limit", () => {
  const result = validateUpload("proof", "image/jpeg", MAX_FILE_SIZE + 1, jpeg);
  assert.equal(result.ok, false);
});
