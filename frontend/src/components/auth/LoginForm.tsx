import { useState, useEffect, lazy, Suspense } from "react";
import { setUser } from "../../stores/auth";

// Lazy-load Turnstile only on client to avoid SSR "window is not defined" issues
const Turnstile = lazy(() => import("react-turnstile"));

function getTurnstileSiteKey(): string {
  if (typeof window !== "undefined" && (window as any).__TURNSTILE_SITE_KEY) {
    return (window as any).__TURNSTILE_SITE_KEY;
  }
  return "1x00000000000000000000AA";
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/cuenta-api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      setUser(data.user);

      // Admin users go to /gestion, others to intended page or catalog
      if (data.user.isAdmin) {
        window.location.href = "/gestion";
        return;
      }

      // Redirect to intended page or catalog (prevent open redirect)
      const params = new URLSearchParams(window.location.search);
      const rawRedirect = params.get("redirect") || "/catalogo";
      const safeRedirect =
        rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
          ? rawRedirect
          : "/catalogo";
      window.location.href = safeRedirect;
    } catch {
      setError("Error de conexión. Inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--color-navy)] mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
          placeholder="su@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--color-navy)] mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
          placeholder="••••••••"
        />
      </div>

      {isClient && (
        <Suspense fallback={<div className="h-[65px]" />}>
          <Turnstile
            sitekey={getTurnstileSiteKey()}
            onVerify={(token: string) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
          />
        </Suspense>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-action)] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Accediendo..." : "Acceder"}
      </button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        ¿No tiene cuenta?{" "}
        <a href="/registro" className="text-[var(--color-action)] hover:underline font-medium">
          Solicitar acceso
        </a>
      </p>
    </form>
  );
}
