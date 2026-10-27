import { verifyPassword } from "./password";

// SERVER ONLY: this file holds password HASHES, so no client component may import it.
// Demo accounts (passwords are in README.md). Module 4 replaces this array with a database table;
// everything that calls these functions stays the same.
const USERS = [
  { id: "abebe", name: "Abebe", phone: "0911000001", role: "customer",
    passwordHash: "scrypt$8bd1b932015c8514f2bd115fb66328b0$5c17631185e14770deb9372e44242d643b043e5a12cefff0b378e11d5f6421ad7193ced6a26c8703235e40eb80766f3d558881f9e862e7678775146633a0b6d5" },
  { id: "selam", name: "Selam", phone: "0911000002", role: "customer",
    passwordHash: "scrypt$95d93780e767ee197160aec7bbd9ce4d$a2804b6981d37a87af73ed7a2f706ba85f9abe945d28c7aa4e75a661ac3820346eab3c9891af80709f161e9b00c36a7021dc793734b7fc6c6e06cdc08d35dfa2" },
  { id: "kidist", name: "Kidist", phone: "0911000003", role: "staff",
    passwordHash: "scrypt$819d21bf295193e37cbc5ba0652bbb9f$0d28355dfabfe3ca02b6ca8560140a1a17fc82211d26e72b57d3a0cf7ef8ccf851fe0486d3af1db3db676858c8489f2deee4d54b9d406d663512133cee256fd5" },
];

// Hash of a password nobody knows. Used when the phone number does not exist, so the
// "unknown phone" case takes as long as the "wrong password" case and the response time
// does not reveal which phone numbers have accounts.
const DUMMY_HASH =
  "scrypt$ac6c850fb70f85b1150fc228f5279ae4$1dc513b4c8089fc6e0d6564147ae359da980691841fc28d0a06a4e97e8eebb89a7411704f20a9a5ec7449b751883582b057c54bee92c441c39ac5c8aa05d31f9";

// 09... and +2519... are the same number: store and compare one form.
export function normalizePhone(input) {
  const s = String(input ?? "").trim().replace(/[\s-]/g, "");
  return s.startsWith("+251") ? "0" + s.slice(4) : s;
}

const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role });

export function findUserById(id) {
  const user = USERS.find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

export function userName(id) {
  return USERS.find((u) => u.id === id)?.name ?? "Guest";
}

// Steps 1 and 2 of signing in: take the phone and password, check them against the stored hash.
// Returns { id, name, role } or null. The caller cannot tell WHICH half was wrong, on purpose.
export async function authenticate(phone, password) {
  const user = USERS.find((u) => u.phone === normalizePhone(phone));
  const ok = await verifyPassword(String(password ?? ""), user ? user.passwordHash : DUMMY_HASH);
  return user && ok ? publicUser(user) : null;
}
