import { z } from "zod";
import { DELIVERY_AREAS, PHONE_PATTERN, PHONE_HINT } from "./constants";

// THE one schema. The route handler (POST /api/orders) and the server action
// (placeOrder) both validate with it, through submitOrder() in lib/orders.js.
//
// Note what is NOT here: a price. The client only says WHICH dishes and HOW MANY;
// the server looks the prices up itself. A price sent from the browser is ignored.
//
// (If your Day 33 pattern for TeleBirr numbers differs, change PHONE_PATTERN in
// lib/constants.js: it is the only place the rule lives.)
const text = (message) => z.string({ required_error: message, invalid_type_error: message });

export const orderSchema = z.object({
  name: text("Enter your full name").trim().min(2, "Enter your full name"),
  phone: text(PHONE_HINT).trim().regex(PHONE_PATTERN, PHONE_HINT),
  area: z.enum(DELIVERY_AREAS, {
    errorMap: () => ({ message: "Choose a delivery area" }),
  }),
  items: z
    .array(
      z.object({
        id: z
          .number({ required_error: "Unknown dish", invalid_type_error: "Unknown dish" })
          .int("Unknown dish")
          .positive("Unknown dish"),
        qty: z
          .number({ required_error: "Quantity must be 1 to 20", invalid_type_error: "Quantity must be 1 to 20" })
          .int("Quantity must be 1 to 20")
          .min(1, "Quantity must be 1 to 20")
          .max(20, "Quantity must be 1 to 20"),
      }),
      { required_error: "Your cart is empty", invalid_type_error: "Items must be a list" },
    )
    .min(1, "Your cart is empty"),
});
