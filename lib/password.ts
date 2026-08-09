/**
 * Password policy shared by every screen that takes a password
 * (register, reset-password, future settings change-password). Same
 * rules the mobile app enforces in `mobile/lib/password.ts` — the
 * server is the authoritative gate, this is UX polish.
 */

export const MIN_PASSWORD_LENGTH = 8;

/**
 * 0 (weak) → 3 (strong). Purely visual — does not gate submission.
 *   +1 if length ≥ MIN_PASSWORD_LENGTH
 *   +1 if mixed upper + lower case
 *   +1 if has a digit AND a symbol
 */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (pw.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}

/**
 * Return a rejection reason, or null when the password meets the
 * minimum bar. `.trim().length` catches whitespace-only passwords which
 * look filled but are worthless.
 */
export function validatePasswordMin(pw: string): string | null {
  if (!pw || pw.trim().length === 0) return "Enter a password.";
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
