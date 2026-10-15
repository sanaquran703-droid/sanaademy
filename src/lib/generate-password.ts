// Generates a temporary password locally (browser or server) so the plaintext
// value never has to be produced or returned by the reset API.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTempPassword(length = 12): string {
  const size = Math.max(8, Math.floor(length));
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < size; i++) {
    out += CHARSET[bytes[i] % CHARSET.length];
  }
  return out;
}
