/**
 * Directus SDK client - Server-side only
 *
 * Usado en componentes Astro (.astro) y API routes.
 * NO importar en componentes React client-side.
 */

// Runtime resolution - process.env works in Astro SSR (Node adapter)
// import.meta.env.PUBLIC_* is resolved at build time by Vite
function resolveDirectusUrl(): string {
  return process.env.DIRECTUS_URL ||
    import.meta.env.DIRECTUS_URL ||
    "http://127.0.0.1:8055";
}

function resolvePublicDirectusUrl(): string {
  return process.env.PUBLIC_DIRECTUS_URL ||
    import.meta.env.PUBLIC_DIRECTUS_URL ||
    "https://tienda.alcora.es";
}

export function getDirectusUrl(): string {
  return resolveDirectusUrl();
}

export function getPublicDirectusUrl(): string {
  return resolvePublicDirectusUrl();
}

export function getPublicAssetUrl(fileId: string | null): string {
  if (!fileId) return "/placeholder.svg";
  return `${resolvePublicDirectusUrl()}/assets/${fileId}`;
}

export function getAssetUrl(
  fileId: string | null,
  params?: { width?: number; height?: number; quality?: number; fit?: string }
): string {
  void params;
  if (!fileId) return "/placeholder.svg";
  return `${resolvePublicDirectusUrl()}/assets/${fileId}`;
}

// ─── Generic fetch helpers ───

/** Add a unique param to bypass Directus Redis cache for time-sensitive reads */
function cacheBust(endpoint: string): string {
  const sep = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${sep}_t=${Date.now()}`;
}

async function directusFetch(
  endpoint: string,
  options: RequestInit & { bypassCache?: boolean } = {}
): Promise<any> {
  const { bypassCache, ...fetchOptions } = options;
  const finalEndpoint = bypassCache ? cacheBust(endpoint) : endpoint;
  const res = await fetch(`${resolveDirectusUrl()}${finalEndpoint}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      // Bypass Directus Redis cache on time-sensitive reads
      ...(bypassCache ? { "Cache-Control": "no-cache, no-store" } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Directus ${options.method || "GET"} ${endpoint}: ${res.status} - ${text}`
    );
  }

  // DELETE returns 204 No Content with empty body
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { data: null };
  }

  const text = await res.text();
  if (!text) return { data: null };

  return JSON.parse(text);
}

export async function directusPublic(endpoint: string): Promise<any> {
  return directusFetch(endpoint);
}

export async function directusAuth(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> {
  return directusFetch(endpoint, {
    ...options,
    bypassCache: true,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function directusAdmin(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const adminToken =
    process.env.DIRECTUS_ADMIN_TOKEN || import.meta.env.DIRECTUS_ADMIN_TOKEN;
  if (!adminToken) throw new Error("DIRECTUS_ADMIN_TOKEN not configured");
  return directusFetch(endpoint, {
    ...options,
    bypassCache: true,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...options.headers,
    },
  });
}

/**
 * Purge the Directus Redis cache.
 * Call after admin mutations to ensure subsequent reads get fresh data.
 * This is necessary because CACHE_AUTO_PURGE is not enabled on the server.
 */
export async function purgeDirectusCache(): Promise<void> {
  try {
    await directusAdmin("/utils/cache/clear", { method: "POST" });
  } catch (err) {
    // Non-critical: cache will expire naturally via TTL
    console.warn("[directus] Cache purge failed:", err instanceof Error ? err.message : err);
  }
}

// ─── Collection-specific fetchers ───

import type { Categoria, Producto, Marca, TarifaEspecial, Pedido, ArticuloBlog } from "./types";

export async function getCategorias(): Promise<Categoria[]> {
  const res = await directusPublic(
    "/items/categorias?filter[status][_eq]=published&sort=sort,nombre&fields=*"
  );
  return res.data;
}

export async function getCategoriaBySlug(
  slug: string
): Promise<Categoria | null> {
  const res = await directusPublic(
    `/items/categorias?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*,parent.*&limit=1`
  );
  return res.data?.[0] || null;
}

export async function getProductos(params?: {
  categoriaId?: number;
  categoriaIds?: number[];
  marcaId?: number;
  page?: number;
  limit?: number;
  search?: string;
  segmento?: 'b2b' | 'b2c' | 'ambos' | 'b2c_ambos';
}): Promise<{ data: Producto[]; meta: { total_count: number } }> {
  const limit = params?.limit || 12;
  const page = params?.page || 1;
  const offset = (page - 1) * limit;

  const filters: string[] = ["filter[status][_eq]=published"];
  if (params?.categoriaIds && params.categoriaIds.length > 0) {
    filters.push(
      `filter[categoria][_in]=${params.categoriaIds.join(",")}`
    );
  } else if (params?.categoriaId) {
    filters.push(`filter[categoria][_eq]=${params.categoriaId}`);
  }
  if (params?.marcaId) {
    filters.push(`filter[marca_id][_eq]=${params.marcaId}`);
  }
  if (params?.search) {
    filters.push(`search=${encodeURIComponent(params.search)}`);
  }

  // B2C/B2B visibility filter
  if (params?.segmento === 'b2c_ambos') {
    // Guests and particulares: show only b2c and ambos products
    filters.push('filter[segmento_venta][_in]=b2c,ambos');
  } else if (params?.segmento) {
    // Specific segmento value (e.g., 'b2b', 'b2c', 'ambos')
    filters.push(`filter[segmento_venta][_eq]=${encodeURIComponent(params.segmento)}`);
  }
  // If segmento is not provided: no filter (B2B users see all products — existing behavior)

  const qs = `${filters.join("&")}&fields=id,sku,nombre,slug,extracto,precio_base,stock,imagen_principal,formato,categoria.id,categoria.nombre,categoria.slug,segmento_venta,tipo_iva&sort=nombre&limit=${limit}&offset=${offset}&meta=filter_count`;

  const res = await directusPublic(`/items/productos?${qs}`);
  return {
    data: res.data,
    meta: { total_count: res.meta?.filter_count || 0 },
  };
}

export async function getProductoBySlug(
  slug: string
): Promise<Producto | null> {
  const res = await directusPublic(
    `/items/productos?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*,galeria.directus_files_id,categoria.id,categoria.nombre,categoria.slug,categoria.parent.*,marca_id.id,marca_id.nombre,marca_id.slug,marca_id.logo&limit=1`
  );
  return res.data?.[0] || null;
}

export async function getTarifasForGrupo(
  grupoCliente: string,
  _token?: string
): Promise<TarifaEspecial[]> {
  // Use admin token - users don't have permission to read tarifas_especiales
  try {
    const res = await directusAdmin(
      `/items/tarifas_especiales?filter[grupo_cliente][_eq]=${encodeURIComponent(grupoCliente)}&fields=*`
    );
    return res.data;
  } catch (err) {
    console.error("Error fetching tarifas:", err);
    return [];
  }
}

export async function getPedidosForUser(
  token: string
): Promise<Pedido[]> {
  const res = await directusAuth(
    "/items/pedidos?sort=-date_created&fields=*,items.*&filter[user_created][_eq]=$CURRENT_USER",
    token
  );
  return res.data;
}

export async function getPedidoById(
  id: number,
  token: string
): Promise<Pedido | null> {
  const res = await directusAuth(
    `/items/pedidos/${id}?fields=*,items.*,items.producto.nombre,items.producto.imagen_principal`,
    token
  );
  return res.data;
}

// ─── Marcas ───

export async function getMarcas(): Promise<Marca[]> {
  const res = await directusPublic(
    "/items/marcas?filter[status][_eq]=published&sort=nombre&fields=*"
  );
  return res.data;
}

export async function getMarcaBySlug(
  slug: string
): Promise<Marca | null> {
  const res = await directusPublic(
    `/items/marcas?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*&limit=1`
  );
  return res.data?.[0] || null;
}

export async function getEmpresa(): Promise<{
  denominacion_social: string;
  telefono: string;
  telefono_whatsapp: string | null;
  email: string;
  domicilio: string | null;
  web_corporativa: string | null;
} | null> {
  try {
    const res = await directusAdmin(
      "/items/empresa/1?fields=denominacion_social,telefono,telefono_whatsapp,email,domicilio,web_corporativa"
    );
    return res.data || null;
  } catch {
    return null;
  }
}

// ─── Articulos (Blog) ───

export async function getArticulos(params?: {
  page?: number;
  limit?: number;
  categoria?: 'guia' | 'consejo' | 'producto' | 'noticia';
}): Promise<{ data: ArticuloBlog[]; meta: { total_count: number } }> {
  const limit = params?.limit || 10;
  const page = params?.page || 1;
  const offset = (page - 1) * limit;

  const filters: string[] = ['filter[status][_eq]=published'];
  if (params?.categoria) {
    filters.push(`filter[categoria_blog][_eq]=${encodeURIComponent(params.categoria)}`);
  }

  const qs = `${filters.join('&')}&fields=id,slug,titulo,extracto,imagen_principal,categoria_blog,fecha_publicacion,date_created&sort=-fecha_publicacion,-date_created&limit=${limit}&offset=${offset}&meta=filter_count`;

  const res = await directusPublic(`/items/articulos?${qs}`);
  return {
    data: res.data,
    meta: { total_count: res.meta?.filter_count || 0 },
  };
}

export async function getArticuloBySlug(
  slug: string
): Promise<ArticuloBlog | null> {
  const res = await directusPublic(
    `/items/articulos?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*,productos_relacionados.productos_id.id,productos_relacionados.productos_id.nombre,productos_relacionados.productos_id.slug,productos_relacionados.productos_id.imagen_principal,productos_relacionados.productos_id.precio_base,productos_relacionados.productos_id.extracto,productos_relacionados.productos_id.segmento_venta,productos_relacionados.productos_id.tipo_iva&limit=1`
  );
  return res.data?.[0] || null;
}
