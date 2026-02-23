/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { s as setUser, $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { lazy, useState, useEffect, Suspense } from 'react';
export { renderers } from '../renderers.mjs';

const Turnstile = lazy(() => import('react-turnstile'));
function getTurnstileSiteKey() {
  if (typeof window !== "undefined" && window.__TURNSTILE_SITE_KEY) {
    return window.__TURNSTILE_SITE_KEY;
  }
  return "1x00000000000000000000AA";
}
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/cuenta-api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }
      setUser(data.user);
      if (data.user.isAdmin) {
        window.location.href = "/gestion";
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const rawRedirect = params.get("redirect") || "/catalogo";
      const safeRedirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/catalogo";
      window.location.href = safeRedirect;
    } catch {
      setError("Error de conexión. Inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    error && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700", children: error }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Email" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "email",
          type: "email",
          required: true,
          value: email,
          onChange: (e) => setEmail(e.target.value),
          className: "w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]",
          placeholder: "su@email.com"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Contraseña" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "password",
          type: "password",
          required: true,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: "w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]",
          placeholder: "••••••••"
        }
      )
    ] }),
    isClient && /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "h-[65px]" }), children: /* @__PURE__ */ jsx(
      Turnstile,
      {
        sitekey: getTurnstileSiteKey(),
        onVerify: (token) => setTurnstileToken(token),
        onExpire: () => setTurnstileToken("")
      }
    ) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full bg-[var(--color-action)] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        children: loading ? "Accediendo..." : "Acceder"
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-[var(--color-text-muted)]", children: [
      "¿No tiene cuenta?",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/registro", className: "text-[var(--color-action)] hover:underline font-medium", children: "Solicitar acceso" })
    ] })
  ] });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Acceder - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-[60vh] flex items-center justify-center py-12 px-4"> <div class="w-full max-w-md"> <div class="text-center mb-8"> <img src="/logo-alcora.svg" alt="Alcora" class="h-12 mx-auto mb-4"> <h1 class="text-2xl font-bold text-navy">Acceder a su cuenta</h1> <p class="text-sm text-text-muted mt-1">
Introduzca sus credenciales para ver precios y realizar pedidos.
</p> </div> <div class="bg-white border border-border rounded-lg p-6 shadow-card"> ${renderComponent($$result2, "LoginForm", LoginForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/auth/LoginForm", "client:component-export": "default" })} </div> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/login.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
