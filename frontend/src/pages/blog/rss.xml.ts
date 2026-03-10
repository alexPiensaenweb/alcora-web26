import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getArticulos } from "../../lib/directus";

export const GET: APIRoute = async (context) => {
  const { data: articles } = await getArticulos({ limit: 50 });
  const siteUrl = context.site?.toString() || process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";

  return rss({
    title: "Blog - Alcora Salud Ambiental",
    description: "Guias, consejos y novedades sobre salud ambiental, control de plagas y limpieza profesional",
    site: siteUrl,
    items: articles.map((article) => ({
      title: article.titulo,
      pubDate: new Date(article.fecha_publicacion || article.date_created),
      description: article.extracto || "",
      link: `/blog/${article.slug}`,
    })),
    customData: `<language>es-es</language>`,
  });
};
