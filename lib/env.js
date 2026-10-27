import { z } from "zod";

// SERVER ONLY. Validates the environment ONCE, when the server boots (see instrumentation.js).
// A clear error on the first line beats a mysterious `undefined` three screens later.
//
// Every variable is named explicitly, so scripts/check-env.mjs can prove .env.example lists it.
const schema = z.object({
  COOKIE_SECURE: z.enum(["true", "false"]).default("true"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  // may be empty (no script) or a full https URL
  NEXT_PUBLIC_ANALYTICS_SRC: z.union([z.literal(""), z.string().url()]).default(""),
});

const parsed = schema.safeParse({
  COOKIE_SECURE: process.env.COOKIE_SECURE || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_ANALYTICS_SRC: process.env.NEXT_PUBLIC_ANALYTICS_SRC ?? "",
});

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment. Compare with .env.example:\n${problems}`);
}

export const env = parsed.data;
