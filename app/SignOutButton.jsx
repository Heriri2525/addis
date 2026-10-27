import { signOut } from "./signin/actions";

// A server component: a plain form whose action is a server action. No client JavaScript.
export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="btn alt" type="submit">Sign out</button>
    </form>
  );
}
