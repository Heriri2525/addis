// Runs once when the Next.js server starts. Importing lib/env.js here makes a bad or missing
// variable fail at BOOT with a readable message, instead of on the first request that uses it.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
