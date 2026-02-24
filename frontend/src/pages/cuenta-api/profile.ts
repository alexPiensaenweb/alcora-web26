import type { APIRoute } from "astro";
import { directusAuth } from "../../lib/directus";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { validateSchema, profileUpdateSchema } from "../../lib/schemas";

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`profile:${clientIp}`, 10, 300_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
    }

    const validation = validateSchema(profileUpdateSchema, body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const updates: Record<string, any> = {};
    const allowedFields = [
      "first_name",
      "last_name",
      "telefono",
      "direccion_facturacion",
      "direccion_envio",
    ];

    for (const field of allowedFields) {
      if (field in validation.data && validation.data[field as keyof typeof validation.data] !== undefined) {
        updates[field] = validation.data[field as keyof typeof validation.data];
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
