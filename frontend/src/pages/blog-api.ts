import type { APIRoute } from "astro";
import { getArticulos, getAssetUrl } from "../lib/directus";

const VALID_CATEGORIAS = ["guia", "consejo", "producto", "noticia"] as const;

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 9;
    const categoriaParam = url.searchParams.get("categoria") || "";

    // Validate categoria param
    const categoria = VALID_CATEGORIAS.includes(categoriaParam as any)
      ? (categoriaParam as 'guia' | 'consejo' | 'producto' | 'noticia')
      : undefined;

    const { data: articles, meta } = await getArticulos({ page, limit, categoria });

    const items = articles.map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      extracto: a.extracto,
      imageUrl: getAssetUrl(a.imagen_principal),
      categoria_blog: a.categoria_blog,
      fecha_publicacion: a.fecha_publicacion || a.date_created,
    }));

    const total = meta.total_count;
    return new Response(
      JSON.stringify({
        items,
        meta: { page, limit, total, hasMore: page * limit < total },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Blog API error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error cargando articulos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
