/**
 * Migracion XLSX -> Directus - Tienda Alcora B2B
 *
 * - Sube productos, imagenes y fichas PDF desde el Excel definitivo
 * - Compatible con Directus donde productos.id es integer o string
 * - Usa SKU como clave funcional para deduplicar
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || "";
const XLSX_PATH = process.env.XLSX_PATH
  ? path.resolve(process.env.XLSX_PATH)
  : path.resolve(process.cwd(), "Productos Tienda B2B Alcora 07102025.xlsx");

if (!ADMIN_TOKEN) {
  console.error("ERROR: Define DIRECTUS_ADMIN_TOKEN en .env");
  process.exit(1);
}

const jsonHeaders = {
  Authorization: `Bearer ${ADMIN_TOKEN}`,
  "Content-Type": "application/json",
};

type AnyRow = Record<string, any>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pick(row: AnyRow, keys: string[]): string {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return "";
}

function parsePrice(value: string): number {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseStock(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : -1;
}

function normalizeDropboxUrl(url: string): string {
  if (!url.includes("dropbox.com")) return url;
  return url
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace("?dl=0", "")
    .replace("?dl=1", "");
}

async function apiJson(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<any> {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    method,
    headers: jsonHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} -> ${res.status}: ${text}`);
  }
  return res.json();
}

async function getProductosIdType(): Promise<"string" | "integer" | "unknown"> {
  const fields = await apiJson("GET", "/fields/productos");
  const idField = (fields?.data || []).find((f: any) => f.field === "id");
  if (idField?.type === "string") return "string";
  if (idField?.type === "integer") return "integer";
  return "unknown";
}

async function uploadFileFromUrl(url: string, title: string): Promise<string | null> {
  try {
    const downloadUrl = normalizeDropboxUrl(url);
    const sourceRes = await fetch(downloadUrl);
    if (!sourceRes.ok) {
      console.warn(`  ! No se pudo descargar: ${url} (${sourceRes.status})`);
      return null;
    }

    const contentType =
      sourceRes.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await sourceRes.arrayBuffer());

    const extByType: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "application/pdf": ".pdf",
    };
    const ext = extByType[contentType] || "";
    const filename = `${slugify(title)}${ext}`;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", new Blob([buffer], { type: contentType }), filename);

    const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.warn(`  ! Fallo subida "${title}": ${text.slice(0, 160)}`);
      return null;
    }

    const payload = await uploadRes.json();
    return payload.data.id as string;
  } catch (error: any) {
    console.warn(`  ! Error subiendo "${title}": ${error.message}`);
    return null;
  }
}

const categoryCache = new Map<string, number>();

async function getOrCreateCategory(nombre: string, parentId: number | null): Promise<number> {
  const key = parentId ? `${parentId}:${nombre}` : `root:${nombre}`;
  const cached = categoryCache.get(key);
  if (cached) return cached;

  const slug = slugify(nombre);
  // slug es unico globalmente en esta instancia de Directus
  // si existe, lo reutilizamos aunque el parent no coincida
  const existing = await apiJson(
    "GET",
    `/items/categorias?filter[slug][_eq]=${encodeURIComponent(slug)}&fields=id,parent&limit=1`
  );
  const found = existing?.data?.[0]?.id as number | undefined;
  if (found) {
    categoryCache.set(key, found);
    return found;
  }

  const created = await apiJson("POST", "/items/categorias", {
    nombre,
    slug,
    parent: parentId,
    status: "published",
  });
  const id = created.data.id as number;
  categoryCache.set(key, id);
  console.log(`  + Categoria: ${nombre} (id=${id}${parentId ? `, parent=${parentId}` : ""})`);
  return id;
}

function buildCategoryParts(row: AnyRow): string[] {
  const categoriasStr = pick(row, ["Categorías", "Categorias", "Categoria", "CATEGORIA", "CategorÃ­as"]);
  if (categoriasStr) {
    return categoriasStr
      .split(">")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  const parent = pick(row, ["CARPETA PRINCIPAL", "Carpeta principal"]);
  const child = pick(row, ["SUBCARPETA", "Subcarpeta"]);
  return [parent, child].filter(Boolean);
}

async function main() {
  console.log("==============================================");
  console.log("Tienda Alcora - XLSX Migration");
  console.log("==============================================");

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`ERROR: No existe el XLSX en: ${XLSX_PATH}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(XLSX_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows: AnyRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const productosIdType = await getProductosIdType();

  console.log(`Hoja: ${sheetName}`);
  console.log(`Filas: ${rows.length}`);
  console.log(`productos.id type: ${productosIdType}`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const nombre = pick(row, ["Nombre", "nombre", "NOMBRE", "Producto"]);
      const sku = pick(row, ["SKU", "sku", "ID", "Referencia", "REF"]);
      const precioRaw = pick(row, ["Precio normal", "Precio", "precio", "PVP"]);
      const stockRaw = pick(row, ["Inventario", "Stock", "stock", "STOCK"]);
      const imagenesRaw = pick(row, ["Imágenes", "Imagenes", "Imagen", "imagen", "ImÃ¡genes"]);
      const descripcion = pick(row, ["Descripción", "Descripcion", "descripcion", "DescripciÃ³n"]);
      const extracto = pick(row, ["Descripción corta", "Extracto", "DescripciÃ³n corta"]);
      const fichaTecnicaUrl = pick(row, ["Meta: ficha_tecnica", "ficha_tecnica", "Ficha técnica", "Ficha tÃ©cnica", "Ficha tecnica"]);
      const fichaSeguridadUrl = pick(row, ["Meta: ficha_seguridad", "ficha_seguridad", "Ficha seguridad", "Ficha de seguridad"]);

      if (!nombre) {
        skipped++;
        continue;
      }
      if (!sku) {
        console.warn(`[Fila ${rowNum}] Sin SKU/ID, se omite.`);
        skipped++;
        continue;
      }

      console.log(`\n[Fila ${rowNum}] ${sku} - ${nombre}`);

      const precio = parsePrice(precioRaw);
      const stock = parseStock(stockRaw || "-1");

      let categoriaId: number | null = null;
      const categoryParts = buildCategoryParts(row);
      if (categoryParts.length > 0) {
        const parentId = await getOrCreateCategory(categoryParts[0], null);
        categoriaId = parentId;
        if (categoryParts.length > 1) {
          categoriaId = await getOrCreateCategory(categoryParts[1], parentId);
        }
      }

      const existing = await apiJson(
        "GET",
        `/items/productos?filter[sku][_eq]=${encodeURIComponent(sku)}&fields=id,sku&limit=1`
      );
      if (existing?.data?.length > 0) {
        console.log(`  - Ya existe: ${sku}`);
        skipped++;
        continue;
      }

      let imagenPrincipalId: string | null = null;
      const galeria: { directus_files_id: string }[] = [];
      if (imagenesRaw) {
        const imageUrls = imagenesRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        for (let imageIndex = 0; imageIndex < imageUrls.length; imageIndex++) {
          const imageId = await uploadFileFromUrl(
            imageUrls[imageIndex],
            `${sku}-img-${imageIndex + 1}`
          );
          if (!imageId) continue;
          if (!imagenPrincipalId) imagenPrincipalId = imageId;
          galeria.push({ directus_files_id: imageId });
        }
      }

      let fichaTecnicaId: string | null = null;
      if (fichaTecnicaUrl) {
        fichaTecnicaId = await uploadFileFromUrl(
          fichaTecnicaUrl,
          `${sku}-ficha-tecnica`
        );
      }

      let fichaSeguridadId: string | null = null;
      if (fichaSeguridadUrl) {
        fichaSeguridadId = await uploadFileFromUrl(
          fichaSeguridadUrl,
          `${sku}-ficha-seguridad`
        );
      }

      const productData: Record<string, any> = {
        sku,
        status: "published",
        nombre,
        slug: slugify(`${nombre}-${sku}`),
        descripcion: descripcion || null,
        extracto: extracto ? extracto.slice(0, 255) : null,
        precio_base: precio,
        stock,
        categoria: categoriaId,
        imagen_principal: imagenPrincipalId,
        galeria: galeria.length > 0 ? galeria : null,
        ficha_tecnica: fichaTecnicaId,
        ficha_seguridad: fichaSeguridadId,
      };

      if (productosIdType === "string") {
        productData.id = sku;
      }

      await apiJson("POST", "/items/productos", productData);
      console.log(`  + Creado: ${sku} (${precio} EUR)`);
      created++;
    } catch (error: any) {
      const message = error?.message || "";
      if (message.includes("RECORD_NOT_UNIQUE") && message.includes("\"field\":\"sku\"")) {
        console.log(`  - SKU duplicado (se omite): fila ${rowNum}`);
        skipped++;
        continue;
      }
      console.error(`[Fila ${rowNum}] Error: ${error.message}`);
      errors++;
    }
  }

  console.log("\n==============================================");
  console.log("Resumen migracion");
  console.log("==============================================");
  console.log(`Creados: ${created}`);
  console.log(`Saltados: ${skipped}`);
  console.log(`Errores: ${errors}`);
  console.log(`Total: ${rows.length}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
