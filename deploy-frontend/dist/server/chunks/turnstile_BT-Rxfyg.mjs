const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "0x4AAAAAACgxQ-QYdbpKLZo342j04KTlSDA";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
async function verifyTurnstile(token) {
  if (TURNSTILE_SECRET.startsWith("1x00000")) {
    return true;
  }
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token
      })
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:", err instanceof Error ? err.message : "Unknown");
    return false;
  }
}

export { verifyTurnstile as v };
