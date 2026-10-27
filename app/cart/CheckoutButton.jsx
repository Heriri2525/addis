import { useRouter } from "next/navigation";

// Uses useRouter, so it can only run in the browser. It has no directive of its own:
// its only importer is CartPanel (a client component), which already pulled it across.
export default function CheckoutButton() {
  const router = useRouter();
  return (
    <button className="btn" onClick={() => router.push("/checkout")}>
      Proceed to checkout
    </button>
  );
}
