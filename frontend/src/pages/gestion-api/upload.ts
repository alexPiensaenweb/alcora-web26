import type { APIRoute } from "astro";

// Allowed file extensions and MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
};

const ALLOWED_EXTENSIONS = new Set(
  Object.values(ALLOWED_TYPES).flat()
);

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const DIRECTUS_URL =
    process.env.DIRECTUS_URL || import.meta.env.DIRECTUS_URL || "http://127.0.0.1:8055";
  const ADMIN_TOKEN =
    process.env.DIRECTUS_ADMIN_TOKEN || import.meta.env.DIRECTUS_ADMIN_TOKEN;

  if (!ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Token no configurado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();

    // Validate the uploaded file
    const file = formData.get("file");
    if (file && file instanceof File) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: `El archivo excede el tamano maximo de ${MAX_FILE_SIZE / (1024 * 1024)} MB` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check MIME type
      if (!ALLOWED_TYPES[file.type]) {
        return new Response(
          JSON.stringify({ error: `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: JPG, PNG, WebP, SVG, PDF` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check file extension
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return new Response(
          JSON.stringify({ error: `Extension de archivo no permitida: ${ext}. Extensiones permitidas: jpg, jpeg, png, webp, svg, pdf` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Forward the validated file to Directus
    const res = await fetch(`${DIRECTUS_URL}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[gestion-api/upload] Directus error:", res.status, text);
      throw new Error(`Error al subir archivo: ${res.status}`);
    }

    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, data: data.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[gestion-api/upload]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al subir archivo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
