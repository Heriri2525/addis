import { NextResponse } from "next/server";

// LAYER 1: runs before anything renders, on the edge runtime (no Node APIs, no database).
// It only checks that a well-formed session cookie EXISTS. That is a cheap redirect, not
// security: anyone can invent a cookie with this shape. Layers 2 and 3 do the real checking.
//
// The name must match lib/session.js (SESSION_COOKIE). It is repeated here on purpose,
// because that file imports Node-only modules the edge runtime cannot load.
const SESSION_COOKIE = "session";
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

// Next.js 16.4 renamed the "middleware" file convention to "proxy" (this file was middleware.js
// until Day 43). A default export works under both names, so only the FILE name changed.
export default function middleware(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && TOKEN_SHAPE.test(token)) return NextResponse.next();

  // Remember where they were going. The sign-in page and action validate this value again.
  const url = new URL("/signin", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(url);
  response.headers.set("x-auth-layer", "middleware"); // lets scripts/test-auth.mjs prove this layer ran
  return response;
}

// Narrow on purpose: nothing else (menu, images, static files, API) pays for this check.
export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/dashboard/:path*"],
};
