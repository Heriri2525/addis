// ONE error shape for every endpoint: { error, ...extra }.
// Validation failures add `fieldErrors`. Never a 200 with the failure buried inside.
export function jsonError(message, status, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}
