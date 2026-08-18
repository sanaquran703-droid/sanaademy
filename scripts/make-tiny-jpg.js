// Generate a tiny valid 1x1 JPEG to scripts/tiny.jpg (safe for the test upload).
const fs = require("fs");
const path = require("path");

// Minimal valid JPEG: SOI + APP0 + DQT + SOF0 + DHT + SOS + EOI (1x1 grayscale)
const hex = [
  "FFD8FFE0", "00104A46", "49460001", "01000001", "00010000",
  "FFDB0043", "00080606", "07060508", "07070709", "09080A0C",
  "140D0C0B", "0B0C1912", "130F141D", "1A1F1E1D", "1A1C1C20",
  "242E2720", "222C231C", "1C283729", "2C303134", "34341F27",
  "393D3832", "3C2E3334", "32FFC000", "0B080001", "00010101",
  "1100FFC4", "001F0000", "01050101", "01010101", "00000000",
  "00000000", "01020304", "05060708", "090A0BFF", "C400B510",
  "00020103", "03020403", "05050404", "0000017D", "01020300",
  "04110512", "21314106", "13516107", "22711432", "8191A108",
  "2342B1C1", "1552D1F0", "24336272", "82090A16", "1718191A",
  "25262728", "292A3435", "36373839", "3A434445", "46474849",
  "4A535455", "56575859", "5A636465", "66676869", "6A737475",
  "76777879", "7A838485", "86878889", "8A929394", "95969798",
  "999AA2A3", "A4A5A6A7", "A8A9AAB2", "B3B4B5B6", "B7B8B9BA",
  "C2C3C4C5", "C6C7C8C9", "CAD2D3D4", "D5D6D7D8", "D9DAE1E2",
  "E3E4E5E6", "E7E8E9EA", "F1F2F3F4", "F5F6F7F8", "F9FAFFDA",
  "00080101", "00003F00", "FBF283F8", "62800FFD", "D9",
];
const buf = Buffer.from(hex.join(""), "hex");
fs.writeFileSync(path.join(__dirname, "tiny.jpg"), buf);
console.log("tiny.jpg written:", buf.length, "bytes");
