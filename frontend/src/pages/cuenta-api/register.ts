import type { APIRoute } from "astro";
import { directusAdmin } from "../../lib/directus";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { verifyTurnstile } from "../../lib/turnstile";
import { sendMail, buildRegistroHtml, buildBienvenidaHtml, getCompanyEmail } from "../../lib/email";
import { validateSchema, registerSchema } from "../../lib/schemas";

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`register:${clientIp}`, 3, 900_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
    }

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
      tipo_usuario,
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

    const isB2C = tipo_usuario === "particular";

    // Additional B2B-only validation (conditional, not in Zod schema)
    if (!isB2C) {
      if (!razon_social || razon_social.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "La razon social es obligatoria" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!cif_nif) {
        return new Response(
          JSON.stringify({ error: "El CIF/NIF es obligatorio" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!tipo_negocio || tipo_negocio.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Seleccione el tipo de negocio" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Verify Turnstile CAPTCHA
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

    // Determine status and grupo based on user type
    // B2C (particular): auto-activated, can shop immediately
    // B2B (empresa): suspended, pending admin approval
    const userStatus = isB2C ? "active" : "suspended";
    const grupoCliente = isB2C ? "particular" : null;

    // Create user in Directus
    const userData: Record<string, unknown> = {
      email: email.trim().toLowerCase(),
      password,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      status: userStatus,
      role: clienteRoleId,
      telefono: cleanTelefono,
      direccion_facturacion: fullAddress,
      direccion_envio: fullAddress,
      ciudad: cleanCiudad,
      provincia: cleanProvincia,
      codigo_postal: cleanCodigoPostal,
      acepta_proteccion_datos: !!acepta_proteccion_datos,
      acepta_comunicaciones: !!acepta_comunicaciones,
    };

    // B2B-specific fields
    if (!isB2C) {
      userData.razon_social = cleanRazonSocial;
      userData.cif_nif = cleanCifNif.toUpperCase();
      userData.cargo = cleanCargo;
      userData.tipo_negocio = tipo_negocio || "";
      userData.numero_roesb = stripHtml(numero_roesb);
    }

    // Set grupo_cliente if applicable
    if (grupoCliente) {
      userData.grupo_cliente = grupoCliente;
    }

    const createRes = await directusAdmin("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    const newUserId = createRes.data?.id;

    // For B2C: ensure the user is active (Directus may override status on creation)
    if (isB2C && newUserId) {
      try {
        await directusAdmin(`/users/${newUserId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "active", grupo_cliente: "particular" }),
        });
      } catch (patchErr) {
        console.error("Error activating B2C user:", patchErr);
      }
    }

    // Send emails
    try {
      if (isB2C) {
        // B2C: Send welcome email to the user (account is already active)
        const bienvenidaHtml = buildBienvenidaHtml({
          userName: cleanFirstName,
          userEmail: email.trim().toLowerCase(),
        });

        await sendMail({
          to: email.trim().toLowerCase(),
          subject: "Bienvenido/a a Alcora Salud Ambiental",
          html: bienvenidaHtml,
        });
      } else {
        // B2B: Send registration notification to company (pending approval)
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
      }
    } catch (emailErr) {
      console.error("Error sending registration email:", emailErr);
    }

    // Different response based on user type
    if (isB2C) {
      return new Response(
        JSON.stringify({
          success: true,
          autoActivated: true,
          message: "Cuenta creada correctamente. Ya puede acceder a la tienda.",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        autoActivated: false,
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
