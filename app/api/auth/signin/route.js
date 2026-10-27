import { jsonError } from "@/lib/http";
import { startSession } from "@/lib/session";
import { authenticate } from "@/lib/users";

// POST /api/auth/signin  { phone, password }
//   200 { id, name, role } + a Set-Cookie header with the session (httpOnly, secure, sameSite)
//   400 body is not JSON · 422 phone or password missing · 401 wrong phone or password
// For clients that are not the sign-in form (scripts, a future mobile app). Same checks as the form.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON", 400);
  }
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!phone || !password || password.length > 200) {
    return jsonError("Validation failed", 422, {
      fieldErrors: { ...(!phone && { phone: ["Required"] }), ...(!password && { password: ["Required"] }) },
    });
  }

  const user = await authenticate(phone, password);
  if (!user) return jsonError("Wrong phone or password", 401);

  await startSession(user.id);
  return Response.json(user);
}
