import { jsonError } from "@/lib/http";
import { cancelOrderFor, orderForUser, toPublicOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

// Day 45: this answer is polled and belongs to ONE person. Never let a browser or a shared cache keep it.
const NO_STORE = { headers: { "Cache-Control": "no-store" } };

// GET    /api/orders/ord_1001   200 the order | 401 not signed in | 404 no such order | 403 not yours
// DELETE /api/orders/ord_1001   200 { ok: true } | the same 401/404/403 | 409 already cancelled or ready
// The same rules as the cancelOrder server action, because both call lib/orders.js.
export async function GET(_request, { params }) {
  const { id } = await params;
  const found = orderForUser(await getSession(), id);
  if (!found.order) return jsonError(found.error, found.status);
  return Response.json(toPublicOrder(found.order), NO_STORE);
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const result = cancelOrderFor(await getSession(), id);
  if (!result.ok) return jsonError(result.error, result.status);
  return Response.json({ ok: true });
}
