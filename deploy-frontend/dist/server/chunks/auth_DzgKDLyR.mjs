import { getDirectusUrl } from './directus_tOieuaro.mjs';

const COOKIE_SESSION = "alcora_session";
const COOKIE_REFRESH = "alcora_refresh";
const IS_PRODUCTION = process.env.NODE_ENV === "production" || (process.env.PUBLIC_SITE_URL || "").startsWith("https");
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/"
};
function setAuthCookies(cookies, tokens) {
  cookies.set(COOKIE_SESSION, tokens.access_token, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.expires / 1e3
    // expires is in ms
  });
  cookies.set(COOKIE_REFRESH, tokens.refresh_token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7
    // 7 days
  });
}
function clearAuthCookies(cookies) {
  cookies.set(COOKIE_SESSION, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  cookies.set(COOKIE_REFRESH, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  cookies.delete(COOKIE_SESSION, { path: "/" });
  cookies.delete(COOKIE_REFRESH, { path: "/" });
}
function getSessionToken(cookies) {
  return cookies.get(COOKIE_SESSION)?.value || null;
}
function getRefreshToken(cookies) {
  return cookies.get(COOKIE_REFRESH)?.value || null;
}
async function loginWithCredentials(email, password) {
  const res = await fetch(`${getDirectusUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.errors?.[0]?.message || "Credenciales invalidas"
    );
  }
  const { data } = await res.json();
  return data;
}
async function refreshAccessToken(refreshToken) {
  try {
    const res = await fetch(`${getDirectusUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        mode: "json"
      })
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}
async function getCurrentUser(token) {
  try {
    const res = await fetch(`${getDirectusUrl()}/users/me?fields=id,email,first_name,last_name,status,role.id,role.name,role.policies.policy.admin_access,grupo_cliente,razon_social,cif_nif,telefono,direccion_facturacion,direccion_envio`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    let isAdmin = false;
    if (data?.role) {
      const role = typeof data.role === "object" ? data.role : null;
      if (role) {
        if (role.admin_access === true) {
          isAdmin = true;
        }
        if (!isAdmin && Array.isArray(role.policies)) {
          isAdmin = role.policies.some(
            (rp) => rp?.policy?.admin_access === true
          );
        }
      }
    }
    data.isAdmin = isAdmin;
    return data;
  } catch {
    return null;
  }
}

export { getCurrentUser as a, getRefreshToken as b, clearAuthCookies as c, getSessionToken as g, loginWithCredentials as l, refreshAccessToken as r, setAuthCookies as s };
