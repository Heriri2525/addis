import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { findUserById } from "./users";
import { env } from "./env";

// SERVER ONLY. A DATABASE-STYLE session: the cookie holds a random id and nothing else; the
// server holds the truth (who it belongs to, when it expires). Consequence: signing out really
// invalidates it, and a copied cookie is useless afterwards. The store is in memory for now
// (it resets when the server restarts, which signs everyone out); Module 4 moves it to a table.
export const SESSION_COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const sessions = (globalThis.__addisEatsSessions ??= new Map());

// The map is keyed by a hash of the token, so a memory dump of the store contains no usable cookie.
const keyFor = (token) => createHash("sha256").update(token).digest("hex");

export function cookieOptions() {
  return {
    httpOnly: true, // JavaScript on the page cannot read it (stops a script stealing the session)
    // HTTPS only (stops reading it off an open network). Browsers accept Secure cookies on
    // http://localhost. Set COOKIE_SECURE=false in .env.local ONLY if you test over a LAN IP.
    secure: env.COOKIE_SECURE !== "false",
    sameSite: "lax", // not sent on cross-site POSTs (stops another site acting as the user)
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

// Step 3 of signing in: create the session and set the cookie.
export async function startSession(userId) {
  const jar = await cookies();
  const previous = jar.get(SESSION_COOKIE)?.value;
  if (previous) sessions.delete(keyFor(previous)); // never reuse an id across sign-ins (session fixation)

  const token = randomBytes(32).toString("base64url"); // 256 random bits, 43 characters
  sessions.set(keyFor(token), { userId, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 });
  jar.set(SESSION_COOKIE, token, cookieOptions());
}

// Step 6: clear the cookie AND delete the server-side session.
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) sessions.delete(keyFor(token));
  jar.delete(SESSION_COOKIE);
}

// Step 5: THE helper. Pages, actions and route handlers all call this and nothing else.
// Returns { id, name, role } or null. Never throws: anything unverifiable is "not signed in".
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const record = sessions.get(keyFor(token));
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    sessions.delete(keyFor(token));
    return null;
  }
  return findUserById(record.userId); // role comes from the user record, so it is always current
}
