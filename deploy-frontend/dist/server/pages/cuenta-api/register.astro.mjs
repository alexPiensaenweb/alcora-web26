import { directusAdmin } from '../../chunks/directus_tOieuaro.mjs';
import { r as rateLimit, a as rateLimitResponse } from '../../chunks/rateLimit_CuWSIAKL.mjs';
import { v as verifyTurnstile } from '../../chunks/turnstile_BT-Rxfyg.mjs';
import { c as buildRegistroHtml, s as sendMail, C as COMPANY_EMAILS } from '../../chunks/email_BwAn03_I.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`register:${clientIp}`, 3, 3e5);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);
    const body = await request.json();
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
      acepta_comunicaciones
    } = body;
    if (turnstileToken) {
      const turnstileOk = await verifyTurnstile(turnstileToken);
      if (!turnstileOk) {
        return new Response(
          JSON.stringify({ error: "Verificacion de seguridad fallida. Recargue la pagina." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
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
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ error: "La contrasena debe incluir al menos una mayuscula, una minuscula y un numero" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email no valido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const cifNifRegex = /^[A-Za-z]\d{7,8}[A-Za-z0-9]?$|^\d{8}[A-Za-z]$/;
    if (!cifNifRegex.test(cif_nif.trim())) {
      return new Response(
        JSON.stringify({ error: "Formato de CIF/NIF no valido (ej: B12345678, 12345678A)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (codigo_postal && !/^\d{5}$/.test(codigo_postal.trim())) {
      return new Response(
        JSON.stringify({ error: "El codigo postal debe tener 5 digitos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").trim();
    if (!acepta_proteccion_datos) {
      return new Response(
        JSON.stringify({ error: "Debe aceptar la politica de proteccion de datos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const rolesRes = await directusAdmin("/roles?filter[name][_eq]=Cliente&fields=id");
    const clienteRoleId = rolesRes.data?.[0]?.id;
    if (!clienteRoleId) {
      console.error("Role 'Cliente' not found in Directus. Create it first.");
      return new Response(
        JSON.stringify({ error: "Error de configuracion. Contacte con el administrador." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
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
    const fullAddress = [
      cleanDireccion,
      [cleanCodigoPostal, cleanCiudad].filter(Boolean).join(" "),
      cleanProvincia
    ].filter(Boolean).join(", ");
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
        direccion_envio: fullAddress,
        // Same address by default
        ciudad: cleanCiudad,
        provincia: cleanProvincia,
        codigo_postal: cleanCodigoPostal,
        acepta_proteccion_datos: !!acepta_proteccion_datos,
        acepta_comunicaciones: !!acepta_comunicaciones
      })
    });
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
        codigoPostal: cleanCodigoPostal
      });
      await sendMail({
        to: COMPANY_EMAILS,
        subject: `Nueva solicitud de registro - ${cleanRazonSocial || cleanFirstName + " " + cleanLastName}`,
        html: registroHtml
      });
    } catch (emailErr) {
      console.error("Error sending registration notification:", emailErr);
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud de registro recibida. Le notificaremos cuando su cuenta sea activada."
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err.message || "Error al procesar el registro";
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
