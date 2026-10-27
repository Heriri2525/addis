import { endSession } from "@/lib/session";

// POST /api/auth/signout -> 200 { ok: true }. Deletes the server-side session, so a copied
// cookie stops working immediately. Signing out twice is harmless.
export async function POST() {
  await endSession();
  return Response.json({ ok: true });
}
