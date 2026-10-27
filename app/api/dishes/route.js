import { getDishes, searchDishes } from "@/app/menu/dishes";
import { CATEGORIES } from "@/app/menu/categories";
import { jsonError } from "@/lib/http";

const MAX_QUERY = 50;

// GET /api/dishes            -> 200, the whole menu
// GET /api/dishes?category=X -> 200, one category; 400 if X is not a real category
// GET /api/dishes?q=kitfo    -> 200, dishes whose name, category or description contains "kitfo"
//                               (Day 45: this is what the debounced search box calls); 400 if q is over 50 characters
// q and category may be combined. Reading request.url makes this handler dynamic (Day 37).
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const q = params.get("q");

  // The query string is user input like any other: check it before use.
  if (category !== null && category !== "All" && !CATEGORIES.includes(category)) {
    return jsonError("Unknown category", 400);
  }
  if (q !== null && q.length > MAX_QUERY) return jsonError(`Search must be ${MAX_QUERY} characters or fewer`, 400);

  if (q !== null && q.trim() !== "") return Response.json(await searchDishes(q, category));

  const dishes = await getDishes();
  if (category === null || category === "All") return Response.json(dishes);
  return Response.json(dishes.filter((d) => d.category === category));
}
