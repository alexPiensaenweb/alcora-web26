import type { APIRoute } from "astro";
import { directusAdmin } from "../../../lib/directus";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, razon_social, cif_nif, telefono, direccion_facturacion } = body;

    // Validate required fields
    if (!email || !password || !first_name || !razon_social || !cif_nif) {
      return new Response(
        JSON.stringify({ error: "Todos los campos obligatorios deben ser completados" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "La contrasena debe tener al menos 8 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the "Cliente" role ID
    const rolesRes = await directusAdmin("/roles?filter[name][_eq]=Cliente&fields=id");
    const clienteRoleId = rolesRes.data?.[0]?.id;

    if (!clienteRoleId) {
      console.error("Role 'Cliente' not found in Directus. Create it first.");
      return new Response(
        JSON.stringify({ error: "Error de configuracion. Contacte con el administrador." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create user with status: suspended
    await directusAdmin("/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        first_name,
        last_name: last_name || "",
        status: "suspended",
        role: clienteRoleId,
        razon_social,
        cif_nif,
        telefono: telefono || "",
        direccion_facturacion: direccion_facturacion || "",
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud de registro recibida. Le notificaremos cuando su cuenta sea activada.",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    const message = err.message || "Error al procesar el registro";

    // Handle duplicate email
    if (message.includes("unique") || message.includes("duplicate")) {
      return new Response(
        JSON.stringify({ error: "Ya existe una cuenta con este email" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
