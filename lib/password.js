import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// SERVER ONLY. Passwords are never stored: only a salted, deliberately slow hash.
// scrypt ships with Node (no native build step) and is a memory-hard function that OWASP
// recommends alongside argon2 and bcrypt. Stored format: scrypt$<salt hex>$<hash hex>
const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(plain) {
  const salt = randomBytes(16); // a fresh salt per password: equal passwords get different hashes
  const hash = await scryptAsync(plain, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(plain, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  // A damaged or truncated record must fail closed. (An empty "hash" would otherwise match anything.)
  if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(plain, salt, KEY_LENGTH);
  return timingSafeEqual(actual, expected); // constant-time comparison
}
