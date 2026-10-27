import Link from "next/link";
import SignOutButton from "@/app/SignOutButton";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";
import SignInForm from "./SignInForm";
import { NO_INDEX } from "@/lib/site";

export const metadata = {
  title: "Sign in",
  description: "Sign in to Addis Eats with your phone number to place and track orders.",
  robots: NO_INDEX,
};

// Dynamic: it reads the session cookie and the query string.
export default async function SignInPage({ searchParams }) {
  const { next } = await searchParams; // Next 15/16: searchParams is a Promise
  const destination = safeNext(typeof next === "string" ? next : ""); // a crafted ?next= is neutralised here
  const user = await getSession();

  return (
    <section>
      <h1>Sign in</h1>
      {user ? (
        <>
          <p className="notice" style={{ marginBottom: "1rem" }}>
            Signed in as <strong>{user.name}</strong> ({user.role}).
          </p>
          <p style={{ marginBottom: "1rem" }}>
            <Link href={destination}>Continue to {destination}</Link>
          </p>
          <SignOutButton />
        </>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Demo accounts and their passwords are listed in README.md.
          </p>
          <SignInForm next={destination} />
        </>
      )}
    </section>
  );
}
