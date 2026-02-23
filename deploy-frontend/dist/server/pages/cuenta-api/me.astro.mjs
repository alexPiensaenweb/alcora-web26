export { renderers } from '../../renderers.mjs';

const GET = async ({ locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({ user: null }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(
    JSON.stringify({
      user: {
        id: locals.user.id,
        email: locals.user.email,
        first_name: locals.user.first_name,
        last_name: locals.user.last_name,
        grupo_cliente: locals.user.grupo_cliente,
        razon_social: locals.user.razon_social,
        status: locals.user.status
      }
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
