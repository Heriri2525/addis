"use server";

import { redirect } from "next/navigation";
import { PHONE_HINT, PHONE_PATTERN } from "@/lib/constants";
import { safeNext } from "@/lib/safe-next";
import { endSession, startSession } from "@/lib/session";
import { authenticate, normalizePhone } from "@/lib/users";

// Steps 1 to 3 of signing in. Used with useActionState, so the first argument is the previous state.
export async function signIn(prevState, formData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "")); // never trust the hidden field either
  const values = { phone, next };

  const fieldErrors = {};
  if (!PHONE_PATTERN.test(normalizePhone(phone))) fieldErrors.phone = [PHONE_HINT];
  if (password.length === 0 || password.length > 200) fieldErrors.password = ["Enter your password"];
  if (Object.keys(fieldErrors).length > 0) return { error: "Validation failed", fieldErrors, values };

  const user = await authenticate(phone, password);
  if (!user) return { error: "Wrong phone or password", values }; // same message for both halves

  await startSession(user.id);
  redirect(next); // a validated, same-site path. redirect() throws, so it stays outside try/catch
}

// Step 6: clear the cookie and invalidate the session on the server.
export async function signOut() {
  await endSession();
  redirect("/signin");
}
