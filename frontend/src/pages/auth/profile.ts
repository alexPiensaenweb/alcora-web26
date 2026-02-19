import type { APIRoute } from "astro";
import { directusAuth } from "../../lib/directus";

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "first_name",
      "last_name",
      "telefono",
      "direccion_facturacion",
      "direccion_envio",
    ];

    // Only allow whitelisted fields
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    await directusAuth(`/users/me`, locals.token, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Profile update error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error al actualizar perfil" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
