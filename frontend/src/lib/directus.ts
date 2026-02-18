/**
 * Directus SDK client - Server-side only
 *
 * Usado en componentes Astro (.astro) y API routes.
 * NO importar en componentes React client-side.
 */

const DIRECTUS_URL =
  process.env.DIRECTUS_URL ||
  import.meta.env.DIRECTUS_URL ||
  "http://localhost:8055";
const PUBLIC_DIRECTUS_URL =
  process.env.PUBLIC_DIRECTUS_URL ||
  import.meta.env.PUBLIC_DIRECTUS_URL ||
  "http://localhost:8055";

export function getDirectusUrl(): string {
  return DIRECTUS_URL;
}

export function getPublicAssetUrl(fileId: string | null): string {
  if (!fileId) return "/placeholder.svg";
  return `${PUBLIC_DIRECTUS_URL}/assets/${fileId}`;
}

export function getAssetUrl(
  fileId: string | null,
  params?: { width?: number; height?: number; quality?: number; fit?: string }
): string {
  void params;
  if (!fileId) return "/placeholder.svg";
  return `${PUBLIC_DIRECTUS_URL}/assets/${fileId}`;
}

// ─── Generic fetch helpers ───

async function directusFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Directus ${options.method || "GET"} ${endpoint}: ${res.status} - ${text}`
    );
  }

  return res.json();
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
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...options.headers,
    },
  });
}

// ─── Collection-specific fetchers ───

import type { Categoria, Producto, Marca, TarifaEspecial, Pedido } from "./types";

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

  const qs = `${filters.join("&")}&fields=id,sku,nombre,slug,extracto,precio_base,stock,imagen_principal,formato,categoria.id,categoria.nombre,categoria.slug&sort=nombre&limit=${limit}&offset=${offset}&meta=filter_count`;

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
    `/items/productos?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*,categoria.id,categoria.nombre,categoria.slug,categoria.parent.*,marca_id.id,marca_id.nombre,marca_id.slug,marca_id.logo&limit=1`
  );
  return res.data?.[0] || null;
}

export async function getTarifasForGrupo(
  grupoCliente: string,
  token: string
): Promise<TarifaEspecial[]> {
  const res = await directusAuth(
    `/items/tarifas_especiales?filter[grupo_cliente][_eq]=${encodeURIComponent(grupoCliente)}&fields=*`,
    token
  );
  return res.data;
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
