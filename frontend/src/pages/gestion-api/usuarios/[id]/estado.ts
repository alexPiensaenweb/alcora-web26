import type { APIRoute } from "astro";
import { directusAdmin, purgeDirectusCache } from "../../../../lib/directus";
import { sendMail, buildActivacionHtml, getCompanyEmail } from "../../../../lib/email";

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const VALID_STATUS = ["active", "suspended", "invited", "draft"];
  if (!VALID_STATUS.includes(body.status)) {
    return new Response(JSON.stringify({ error: "Status inválido" }), { status: 400 });
  }

  // No permitir modificar al propio usuario admin
  if (id === locals.user.id) {
    return new Response(JSON.stringify({ error: "No puedes modificar tu propio estado" }), { status: 400 });
  }

  try {
    // Fetch user data before updating (needed for email)
    let userData: any = null;
    if (body.status === "active" && body.sendEmail) {
      const userRes = await directusAdmin(`/users/${id}?fields=id,email,first_name,last_name,razon_social,status`);
      userData = userRes.data;
    }

    // Update status
    await directusAdmin(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: body.status }),
    });

    // Send activation email if activating and requested
    let emailSent = false;
    if (body.status === "active" && body.sendEmail && userData?.email) {
      try {
        const userName = userData.razon_social ||
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          userData.email;

        await sendMail({
          to: userData.email,
          subject: "Su cuenta ha sido activada - Alcora Salud Ambiental",
          html: buildActivacionHtml({
            userName,
            userEmail: userData.email,
          }),
          replyTo: await getCompanyEmail(),
        });
        emailSent = true;
        console.log(`[api/admin/usuarios/estado] Activation email sent to ${userData.email}`);
      } catch (emailErr) {
        console.error("[api/admin/usuarios/estado] Error sending activation email:", emailErr);
        // Don't fail the request if email fails - status was already changed
      }
    }

    await purgeDirectusCache();

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/admin/usuarios/estado]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};
