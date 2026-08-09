/**
 * Shared logic for the sign-in / forgot-password / password-reset screens:
 * given a free-text identifier field, decide whether the user typed an
 * email or a Ghanaian phone number, and normalise the phone into E.164
 * before shipping to the backend.
 *
 * Mirrors `mobile/lib/auth-input.ts` so both clients treat the same input
 * the same way.
 */

export type AuthMode = "email" | "phone" | "unknown";

/**
 * Cheap live detection — powers the input's `keyboardType` and label copy.
 * Not a validator; the actual normalisation happens in `normalizeGhanaPhone`.
 */
export function detectAuthMode(input: string): AuthMode {
  const trimmed = input.trim();
  if (trimmed.length === 0) return "unknown";
  if (trimmed.includes("@")) return "email";
  // A single leading digit or "+" is enough to tip into phone territory.
  if (/^[+0-9]/.test(trimmed)) return "phone";
  return "unknown";
}

/**
 * Convert Ghanaian phone number forms to E.164:
 *   0205778299     → +233205778299
 *   205778299      → +233205778299
 *   +233205778299  → +233205778299
 *   233205778299   → +233205778299
 *
 * Returns null on obviously-invalid input so the caller can surface
 * "Use a Ghana number, e.g. 0205778299."
 */
export function normalizeGhanaPhone(input: string): string | null {
  const stripped = input.replace(/[\s\-()]/g, "");
  if (stripped.length === 0) return null;

  // Already E.164.
  if (/^\+233\d{9}$/.test(stripped)) return stripped;

  // Local mobile prefix (0 + 9 digits).
  if (/^0\d{9}$/.test(stripped)) return `+233${stripped.slice(1)}`;

  // Country code without plus.
  if (/^233\d{9}$/.test(stripped)) return `+${stripped}`;

  // Mobile digits without leading 0 or country code.
  if (/^\d{9}$/.test(stripped)) return `+233${stripped}`;

  return null;
}
