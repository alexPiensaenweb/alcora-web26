/**
 * Cloudflare Turnstile server-side verification
 */

const TURNSTILE_SECRET =
  process.env.TURNSTILE_SECRET_KEY ||
  import.meta.env.TURNSTILE_SECRET_KEY ||
  "";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET || TURNSTILE_SECRET.startsWith("1x00000")) {
    // Test/dev keys - skip verification
    return true;
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
      }),
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:", err instanceof Error ? err.message : "Unknown");
    return false;
  }
}
