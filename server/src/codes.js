import { randomInt } from "node:crypto";
import { roomExists } from "./db.js";

/**
 * Join-code generation (design D6). Six characters from an unambiguous alphabet
 * (no 0/O/1/I/L), server-minted and collision-checked against the rooms table.
 * ~31^6 ≈ 8.9e8 combinations — not realistically scannable at hobby scale,
 * which is how we buy privacy without accounts (D4).
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars: no 0 O 1 I L
const CODE_LENGTH = 6;

function randomCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** Mint a code not already present in the rooms table. */
export function generateUniqueCode(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = randomCode();
    if (!roomExists(code)) return code;
  }
  throw new Error("Could not generate a unique room code");
}
