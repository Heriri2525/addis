// Open-redirect guard for the ?next= parameter. Returns a same-site path, or the fallback.
//
// The one-line check from the lecture, next.startsWith("/"), is not enough on its own:
//   //evil.com    starts with "/", yet a browser reads it as "another host, same scheme"
//   /\evil.com    browsers treat "\" like "/", so this is the same trick
//   /\t/evil.com  browsers delete tabs and newlines inside URLs, which turns it into //evil.com
// So we also reject those, and then check the NORMALISED result once more, because
// "/..//evil.com" normalises to "//evil.com".
export function safeNext(value, fallback = "/") {
  if (typeof value !== "string" || value.length === 0 || value.length > 500) return fallback;
  if (!value.startsWith("/")) return fallback; // https://evil.com, javascript:..., evil.com
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  let parsed;
  try {
    parsed = new URL(value, "http://internal.invalid");
  } catch {
    return fallback;
  }
  if (parsed.origin !== "http://internal.invalid") return fallback;

  const out = parsed.pathname + parsed.search;
  if (out.startsWith("//")) return fallback;
  return out;
}
