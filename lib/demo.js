// DAY 46 — make each state appear on demand, so it can be demonstrated and tested:
//   /orders?demo=slow    -> loading.js shows for two seconds
//   /orders?demo=empty   -> the empty state
//   /orders?demo=error   -> error.js shows, with a working "Try again"
// (the same three work on /dashboard). Only outside production: in a production build this
// returns null, so nobody can break your live page by typing a URL.
export function demoMode(params) {
  if (process.env.NODE_ENV === "production") return null;
  const v = Array.isArray(params?.demo) ? params.demo[0] : params?.demo;
  return ["slow", "empty", "error"].includes(v) ? v : null;
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs the slow and error demos. Returns true when the caller should render the empty state.
export async function applyDemo(mode) {
  if (mode === "slow") await wait(2000);
  if (mode === "error") throw new Error("Demo: the data service did not answer.");
  return mode === "empty";
}
