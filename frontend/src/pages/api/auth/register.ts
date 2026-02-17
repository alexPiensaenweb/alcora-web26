import type { APIRoute } from "astro";
import { directusAdmin } from "../../../lib/directus";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      razon_social,
      cif_nif,
      telefono,
      cargo,
      tipo_negocio,
      direccion_facturacion,
      ciudad,
      provincia,
      codigo_postal,
      acepta_proteccion_datos,
      acepta_comunicaciones,
    } = body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return new Response(
        JSON.stringify({ error: "Nombre, apellidos, email y contrasena son obligatorios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!razon_social || !cif_nif) {
      return new Response(
        JSON.stringify({ error: "La razon social y CIF/NIF son obligatorios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!tipo_negocio) {
      return new Response(
        JSON.stringify({ error: "Seleccione el tipo de negocio" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "La contrasena debe tener al menos 8 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!acepta_proteccion_datos) {
      return new Response(
        JSON.stringify({ error: "Debe aceptar la politica de proteccion de datos" }),
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

    // Build full address string from components
    const fullAddress = [
      direccion_facturacion,
      [codigo_postal, ciudad].filter(Boolean).join(" "),
      provincia,
    ]
      .filter(Boolean)
      .join(", ");

    // Create user with status: suspended (pending admin approval)
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
        cargo: cargo || "",
        tipo_negocio: tipo_negocio || "",
        direccion_facturacion: fullAddress,
        direccion_envio: fullAddress, // Same address by default
        ciudad: ciudad || "",
        provincia: provincia || "",
        codigo_postal: codigo_postal || "",
        acepta_proteccion_datos: !!acepta_proteccion_datos,
        acepta_comunicaciones: !!acepta_comunicaciones,
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

    console.error("Registration error:", message);
    return new Response(
      JSON.stringify({ error: "Error al procesar el registro. Intentelo de nuevo." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
