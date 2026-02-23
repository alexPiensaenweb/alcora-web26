function resolveDirectusUrl() {
  return process.env.DIRECTUS_URL || "http://127.0.0.1:8055";
}
function resolvePublicDirectusUrl() {
  return process.env.PUBLIC_DIRECTUS_URL || "https://tienda.alcora.es";
}
function getDirectusUrl() {
  return resolveDirectusUrl();
}
function getPublicDirectusUrl() {
  return resolvePublicDirectusUrl();
}
function getPublicAssetUrl(fileId) {
  if (!fileId) return "/placeholder.svg";
  return `${resolvePublicDirectusUrl()}/assets/${fileId}`;
}
function getAssetUrl(fileId, params) {
  if (!fileId) return "/placeholder.svg";
  return `${resolvePublicDirectusUrl()}/assets/${fileId}`;
}
async function directusFetch(endpoint, options = {}) {
  const res = await fetch(`${resolveDirectusUrl()}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!res.ok) {
    const text2 = await res.text();
    throw new Error(
      `Directus ${options.method || "GET"} ${endpoint}: ${res.status} - ${text2}`
    );
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { data: null };
  }
  const text = await res.text();
  if (!text) return { data: null };
  return JSON.parse(text);
}
async function directusPublic(endpoint) {
  return directusFetch(endpoint);
}
async function directusAuth(endpoint, token, options = {}) {
  return directusFetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
}
async function directusAdmin(endpoint, options = {}) {
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || "migration-static-token-alcora-2026";
  return directusFetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...options.headers
    }
  });
}
async function getCategorias() {
  const res = await directusPublic(
    "/items/categorias?filter[status][_eq]=published&sort=sort,nombre&fields=*"
  );
  return res.data;
}
async function getCategoriaBySlug(slug) {
  const res = await directusPublic(
    `/items/categorias?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*,parent.*&limit=1`
  );
  return res.data?.[0] || null;
}
async function getProductos(params) {
  const limit = params?.limit || 12;
  const page = params?.page || 1;
  const offset = (page - 1) * limit;
  const filters = ["filter[status][_eq]=published"];
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
    meta: { total_count: res.meta?.filter_count || 0 }
  };
}
async function getProductoBySlug(slug) {
  const res = await directusPublic(
    `/items/productos?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*,categoria.id,categoria.nombre,categoria.slug,categoria.parent.*,marca_id.id,marca_id.nombre,marca_id.slug,marca_id.logo&limit=1`
  );
  return res.data?.[0] || null;
}
async function getTarifasForGrupo(grupoCliente, _token) {
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
async function getPedidosForUser(token) {
  const res = await directusAuth(
    "/items/pedidos?sort=-date_created&fields=*,items.*&filter[user_created][_eq]=$CURRENT_USER",
    token
  );
  return res.data;
}
async function getPedidoById(id, token) {
  const res = await directusAuth(
    `/items/pedidos/${id}?fields=*,items.*,items.producto.nombre,items.producto.imagen_principal`,
    token
  );
  return res.data;
}
async function getMarcas() {
  const res = await directusPublic(
    "/items/marcas?filter[status][_eq]=published&sort=nombre&fields=*"
  );
  return res.data;
}
async function getMarcaBySlug(slug) {
  const res = await directusPublic(
    `/items/marcas?filter[slug][_eq]=${encodeURIComponent(slug)}&filter[status][_eq]=published&fields=*&limit=1`
  );
  return res.data?.[0] || null;
}
async function getEmpresa() {
  try {
    const res = await directusAdmin(
      "/items/empresa/1?fields=denominacion_social,telefono,telefono_whatsapp,email,domicilio,web_corporativa"
    );
    return res.data || null;
  } catch {
    return null;
  }
}

export { directusAdmin, directusAuth, directusPublic, getAssetUrl, getCategoriaBySlug, getCategorias, getDirectusUrl, getEmpresa, getMarcaBySlug, getMarcas, getPedidoById, getPedidosForUser, getProductoBySlug, getProductos, getPublicAssetUrl, getPublicDirectusUrl, getTarifasForGrupo };
