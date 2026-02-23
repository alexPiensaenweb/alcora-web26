import type { APIRoute } from "astro";
import { directusAdmin } from "../../lib/directus";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { verifyTurnstile } from "../../lib/turnstile";
import { sendMail, buildRegistroHtml, getCompanyEmail } from "../../lib/email";
import { validateSchema, registerSchema } from "../../lib/schemas";

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`register:${clientIp}`, 3, 300_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    const body = await request.json();

    const validation = validateSchema(registerSchema, body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      turnstileToken,
      email,
      password,
      first_name,
      last_name,
      razon_social,
      cif_nif,
      telefono,
      cargo,
      tipo_negocio,
      numero_roesb,
      direccion_facturacion,
      ciudad,
      provincia,
      codigo_postal,
      acepta_proteccion_datos,
      acepta_comunicaciones,
    } = validation.data;

    const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || import.meta.env.TURNSTILE_SECRET_KEY || "";
    const isDevKey = TURNSTILE_SECRET.startsWith("1x00000");
    const turnstileRequired = !!TURNSTILE_SECRET && !isDevKey;

    if (turnstileRequired && !turnstileToken) {
      return new Response(
        JSON.stringify({ error: "Verificacion de seguridad requerida. Recargue la pagina." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (turnstileToken) {
      const turnstileOk = await verifyTurnstile(turnstileToken);
      if (!turnstileOk) {
        return new Response(
          JSON.stringify({ error: "Verificacion de seguridad fallida. Recargue la pagina." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const stripHtml = (s: string | undefined) => (s || "").replace(/<[^>]*>/g, "").trim();

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

    // Sanitize text inputs
    const cleanFirstName = stripHtml(first_name);
    const cleanLastName = stripHtml(last_name);
    const cleanRazonSocial = stripHtml(razon_social);
    const cleanCifNif = stripHtml(cif_nif);
    const cleanTelefono = stripHtml(telefono);
    const cleanCargo = stripHtml(cargo);
    const cleanDireccion = stripHtml(direccion_facturacion);
    const cleanCiudad = stripHtml(ciudad);
    const cleanProvincia = stripHtml(provincia);
    const cleanCodigoPostal = stripHtml(codigo_postal);

    // Build full address string from components
    const fullAddress = [
      cleanDireccion,
      [cleanCodigoPostal, cleanCiudad].filter(Boolean).join(" "),
      cleanProvincia,
    ]
      .filter(Boolean)
      .join(", ");

    // Create user with status: suspended (pending admin approval)
    await directusAdmin("/users", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        status: "suspended",
        role: clienteRoleId,
        razon_social: cleanRazonSocial,
        cif_nif: cleanCifNif.toUpperCase(),
        telefono: cleanTelefono,
        cargo: cleanCargo,
        tipo_negocio: tipo_negocio || "",
        numero_roesb: stripHtml(numero_roesb),
        direccion_facturacion: fullAddress,
        direccion_envio: fullAddress, // Same address by default
        ciudad: cleanCiudad,
        provincia: cleanProvincia,
        codigo_postal: cleanCodigoPostal,
        acepta_proteccion_datos: !!acepta_proteccion_datos,
        acepta_comunicaciones: !!acepta_comunicaciones,
      }),
    });

    // Send registration notification to company
    try {
      const registroHtml = buildRegistroHtml({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: email.trim().toLowerCase(),
        razonSocial: cleanRazonSocial,
        cifNif: cleanCifNif.toUpperCase(),
        telefono: cleanTelefono,
        tipoNegocio: tipo_negocio || "",
        direccion: cleanDireccion,
        ciudad: cleanCiudad,
        provincia: cleanProvincia,
        codigoPostal: cleanCodigoPostal,
      });

      const companyEmail = await getCompanyEmail();
      await sendMail({
        to: companyEmail,
        subject: `Nueva solicitud de registro - ${cleanRazonSocial || cleanFirstName + " " + cleanLastName}`,
        html: registroHtml,
        replyTo: email.trim().toLowerCase(),
      });
    } catch (emailErr) {
      console.error("Error sending registration notification:", emailErr);
    }

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
