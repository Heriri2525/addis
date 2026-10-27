"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { cancelOrderFor, getOrder, setStatus, submitOrder } from "@/lib/orders";

// Every export of a "use server" file is a public HTTP endpoint: anyone can call it with any
// argument, signed in or not, with or without the page. So each action re-establishes WHO is
// asking (getSession) and WHAT they may touch, itself. Middleware and the page checks are
// conveniences; THIS is the layer that cannot be bypassed.

const field = (formData, key) => String(formData.get(key) ?? "");

// Used with useActionState, so the first argument is the PREVIOUS state.
export async function placeOrder(prevState, formData) {
  const values = { name: field(formData, "name"), phone: field(formData, "phone"), area: field(formData, "area") };

  const user = await getSession();
  if (!user) return { error: "Not signed in", values }; // authentication, before anything else

  let items;
  try {
    items = JSON.parse(field(formData, "items") || "[]");
  } catch {
    items = null; // the schema turns this into fieldErrors.items
  }

  try {
    const result = await submitOrder({ ...values, items }, user.id); // the order belongs to the SESSION's user
    if (!result.ok) {
      return { error: "Validation failed", fieldErrors: result.fieldErrors, values };
    }
    revalidatePath("/orders");
    revalidatePath("/kitchen");
    return { id: result.order.id, total: result.order.total, currency: result.order.currency };
  } catch (err) {
    console.error("placeOrder failed:", err);
    return { error: "Something went wrong. Please try again.", values };
  }
}

// Authentication (who are you?), then authorisation (is THIS order yours?). Both live in
// cancelOrderFor, which the DELETE route handler shares, so the two doors cannot drift apart.
// Failures are RETURNED, not thrown: thrown errors are masked in production builds.
export async function cancelOrder(orderId) {
  const user = await getSession();
  const result = cancelOrderFor(user, orderId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return { ok: true };
}

// A ROLE is checked where the effect happens. The Kitchen page also hides its content from
// customers, but that is interface; this check is the protection.
export async function markReady(orderId) {
  const user = await getSession();
  if (!user) return { error: "Not signed in" };
  if (user.role !== "staff") return { error: "Not allowed" };

  const order = getOrder(String(orderId));
  if (!order) return { error: "No such order" };
  if (order.status !== "placed") return { error: `Order is already ${order.status}` };

  setStatus(order.id, "ready");
  revalidatePath("/kitchen");
  revalidatePath("/orders");
  return { ok: true };
}
