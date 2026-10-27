// DAY 45 — shared by every client query (SWR). No imports, no secrets: safe in the browser bundle.
//
// fetch() only rejects on a network failure; a 401 or a 500 still "succeeds". SWR needs a thrown
// error to know the request failed, so this turns every non-2xx answer into one, with the status
// attached so the screen can say something useful ("sign in again") instead of "failed".
export async function fetcher(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      message = (await res.json()).error ?? message;
    } catch {}
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Retrying a 401, 403 or 404 never changes the answer, and a polled query would hammer the server
// doing it. Only retry what might heal itself (a 5xx or a dropped connection), a few times, slowly.
export function retryOnlyServerErrors(error, _key, _config, revalidate, { retryCount }) {
  if (error?.status && error.status < 500) return;
  if (retryCount >= 3) return;
  setTimeout(() => revalidate({ retryCount }), 5000 * 2 ** retryCount);
}
