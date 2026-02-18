import type { APIRoute } from "astro";
import { directusPublic } from "../lib/directus";

const SITE_URL = process.env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";

export const GET: APIRoute = async () => {
  const urls: { loc: string; changefreq: string; priority: string }[] = [];

  // Static pages
  urls.push({ loc: `${SITE_URL}/`, changefreq: "weekly", priority: "1.0" });
  urls.push({ loc: `${SITE_URL}/catalogo`, changefreq: "daily", priority: "0.9" });
  urls.push({ loc: `${SITE_URL}/marcas`, changefreq: "weekly", priority: "0.7" });

  // Dynamic: categories
  try {
    const catRes = await directusPublic(
      "/items/categorias?filter[status][_eq]=published&fields=slug,date_updated&sort=nombre&limit=-1"
    );
    for (const cat of catRes.data || []) {
      urls.push({
        loc: `${SITE_URL}/categoria/${cat.slug}`,
        changefreq: "weekly",
        priority: "0.8",
      });
    }
  } catch (e) {
    console.error("[sitemap] Error fetching categorias:", e);
  }

  // Dynamic: products
  try {
    const prodRes = await directusPublic(
      "/items/productos?filter[status][_eq]=published&fields=slug,date_updated&sort=-date_updated&limit=-1"
    );
    for (const prod of prodRes.data || []) {
      urls.push({
        loc: `${SITE_URL}/catalogo/${prod.slug}`,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  } catch (e) {
    console.error("[sitemap] Error fetching productos:", e);
  }

  // Dynamic: brands
  try {
    const marcaRes = await directusPublic(
      "/items/marcas?filter[status][_eq]=published&fields=slug&sort=nombre&limit=-1"
    );
    for (const marca of marcaRes.data || []) {
      urls.push({
        loc: `${SITE_URL}/marca/${marca.slug}`,
        changefreq: "monthly",
        priority: "0.5",
      });
    }
  } catch (e) {
    console.error("[sitemap] Error fetching marcas:", e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
