"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

// Client leaf: useActionState gives the result and the pending flag.
// `next` arrives already sanitised from the page, and the action sanitises it AGAIN:
// a hidden field can be edited in DevTools like any other input.
export default function SignInForm({ next }) {
  const [state, formAction, pending] = useActionState(signIn, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="form" noValidate>
      <input type="hidden" name="next" value={next} />

      <div className="field">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone" name="phone" inputMode="tel" autoComplete="username" placeholder="0911000001"
          defaultValue={state?.values?.phone ?? ""} aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <p className="error" role="alert">{errors.phone[0]}</p>}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password" name="password" type="password" autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <p className="error" role="alert">{errors.password[0]}</p>}
      </div>

      {state?.error && !state.fieldErrors && <p className="error" role="alert">{state.error}</p>}

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
