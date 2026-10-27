import { jsonError } from "@/lib/http";
import { listOrdersFor, submitOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

// Day 45: this answer is polled and belongs to ONE person. Never let a browser or a shared cache keep it.
const NO_STORE = { headers: { "Cache-Control": "no-store" } };

// GET /api/orders   200 [the signed-in user's orders]    401 not signed in
// POST /api/orders  201 { id, total, currency, status }  401 not signed in
//                   400 body is not a JSON object · 422 { error, fieldErrors } · 500 { error }
//
// Authentication comes FIRST (before the body is even looked at), and the owner of a new order
// is always the session's user: nothing in the request body can name a different one.
export async function GET() {
  const user = await getSession();
  if (!user) return jsonError("Not signed in", 401);
  return Response.json(listOrdersFor(user.id), NO_STORE); // scoped to the session, not to a query parameter
}

export async function POST(request) {
  const user = await getSession();
  if (!user) return jsonError("Not signed in", 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON", 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Request body must be a JSON object", 400);
  }

  try {
    const result = await submitOrder(body, user.id);
    if (!result.ok) {
      return jsonError("Validation failed", 422, { fieldErrors: result.fieldErrors });
    }
    return Response.json(result.order, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders failed:", err); // the stack trace stays on the server
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
