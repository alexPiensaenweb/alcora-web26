import { c as clearAuthCookies } from '../../chunks/auth_DzgKDLyR.mjs';
export { renderers } from '../../renderers.mjs';

const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
const cookieHeaders = [
  `alcora_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
  `alcora_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`
];
function isFormRequest(request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  if (accept.startsWith("text/html")) return true;
  if (contentType.includes("form-data") || contentType.includes("urlencoded")) return true;
  return false;
}
const POST = async ({ cookies, request, redirect }) => {
  clearAuthCookies(cookies);
  if (isFormRequest(request)) {
    const res = redirect("/login", 302);
    cookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  }
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
  cookieHeaders.forEach((c) => response.headers.append("Set-Cookie", c));
  return response;
};
const GET = async ({ cookies, redirect }) => {
  clearAuthCookies(cookies);
  const res = redirect("/login", 302);
  cookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
  return res;
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
