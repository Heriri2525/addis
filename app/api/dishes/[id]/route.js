import { getDish } from "@/app/menu/dishes";
import { jsonError } from "@/lib/http";

// GET /api/dishes/1    -> 200, the dish
// GET /api/dishes/999  -> 404, { error: "No such dish" }
// GET /api/dishes/abc  -> 400, the request itself is malformed
export async function GET(_request, { params }) {
  const { id } = await params; // Next 15/16: params is a Promise

  if (!/^\d+$/.test(id)) return jsonError("Dish id must be a number", 400);

  const dish = await getDish(id);
  if (!dish) return jsonError("No such dish", 404);
  return Response.json(dish);
}
