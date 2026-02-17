import type { APIRoute } from "astro";
import {
  getAssetUrl,
  getCategoriaBySlug,
  getCategorias,
  getProductos,
  getTarifasForGrupo,
} from "../../lib/directus";
import { calculatePrice, resolveDiscount } from "../../lib/pricing";
import type { Categoria } from "../../lib/types";

function collectDescendantIds(rootId: number, categorias: Categoria[]): number[] {
  const ids: number[] = [rootId];
  const queue: number[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = categorias.filter((cat) => {
      const parentId =
        typeof cat.parent === "object" ? cat.parent?.id : cat.parent;
      return parentId === current;
    });

    for (const child of children) {
      if (!ids.includes(child.id)) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
  }

  return ids;
}

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      48,
      Math.max(8, parseInt(url.searchParams.get("limit") || "24", 10))
    );
    const search = (url.searchParams.get("search") || "").trim();
    const categoriaSlug = (url.searchParams.get("categoria") || "").trim();

    let categoriaIds: number[] | undefined;
    if (categoriaSlug) {
      const categoria = await getCategoriaBySlug(categoriaSlug);
      if (categoria) {
        const allCategorias = await getCategorias();
        categoriaIds = collectDescendantIds(categoria.id, allCategorias);
      } else {
        return new Response(
          JSON.stringify({
            items: [],
            meta: { page, limit, total: 0, hasMore: false },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const { data: products, meta } = await getProductos({
      categoriaIds,
      page,
      limit,
      search,
    });

    const user = locals.user;
    const token = locals.token;
    let tarifas: any[] = [];
    if (user?.grupo_cliente && token) {
      tarifas = await getTarifasForGrupo(user.grupo_cliente, token);
    }

    const items = products.map((product: any) => {
      const categoriaId =
        typeof product.categoria === "object"
          ? product.categoria?.id
          : product.categoria;

      let price: number | null = null;
      if (user) {
        if (tarifas.length > 0) {
          const descuento = resolveDiscount(tarifas, product.id, categoriaId || null);
          price = calculatePrice(product.precio_base, descuento);
        } else {
          price = product.precio_base;
        }
      }

      return {
        id: product.id,
        sku: product.sku,
        nombre: product.nombre,
        slug: product.slug,
        extracto: product.extracto || null,
        formato: product.formato || null,
        imageUrl: getAssetUrl(product.imagen_principal, {
          width: 480,
          height: 480,
          fit: "contain",
        }),
        price,
      };
    });

    const total = meta?.total_count || 0;
    const hasMore = page * limit < total;

    return new Response(
      JSON.stringify({
        items,
        meta: { page, limit, total, hasMore },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error cargando productos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

