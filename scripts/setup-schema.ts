/**
 * Setup Directus Schema - Tienda Alcora B2B
 *
 * Crea todas las colecciones, campos y relaciones necesarias.
 * Ejecutar: npx tsx setup-schema.ts
 *
 * Requisitos: Directus corriendo en DIRECTUS_URL con DIRECTUS_ADMIN_TOKEN
 */

import "dotenv/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || "";

if (!ADMIN_TOKEN) {
  console.error(
    "ERROR: Define DIRECTUS_ADMIN_TOKEN en .env (genera uno en Directus > Settings > Access Tokens)"
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${ADMIN_TOKEN}`,
  "Content-Type": "application/json",
};

async function api(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Custom fields on directus_users ───
async function setupUserFields() {
  console.log("→ Adding custom fields to directus_users...");

  const fields = [
    {
      field: "grupo_cliente",
      type: "string",
      meta: {
        interface: "select-dropdown",
        display: "labels",
        options: {
          choices: [
            { text: "Distribuidor", value: "distribuidor" },
            { text: "Empresa", value: "empresa" },
            { text: "Hospital", value: "hospital" },
            { text: "Particular", value: "particular" },
          ],
        },
        width: "half",
        sort: 10,
        group: null,
      },
      schema: { is_nullable: true },
    },
    {
      field: "razon_social",
      type: "string",
      meta: {
        interface: "input",
        width: "half",
        sort: 11,
        note: "Nombre de la empresa o razon social",
      },
      schema: { is_nullable: true },
    },
    {
      field: "cif_nif",
      type: "string",
      meta: {
        interface: "input",
        width: "half",
        sort: 12,
        note: "CIF o NIF de la empresa",
      },
      schema: { is_nullable: true },
    },
    {
      field: "telefono",
      type: "string",
      meta: { interface: "input", width: "half", sort: 13 },
      schema: { is_nullable: true },
    },
    {
      field: "direccion_facturacion",
      type: "text",
      meta: {
        interface: "input-multiline",
        width: "half",
        sort: 14,
        note: "Direccion completa de facturacion",
      },
      schema: { is_nullable: true },
    },
    {
      field: "direccion_envio",
      type: "text",
      meta: {
        interface: "input-multiline",
        width: "half",
        sort: 15,
        note: "Direccion de envio (si diferente a facturacion)",
      },
      schema: { is_nullable: true },
    },
  ];

  for (const field of fields) {
    try {
      await api("POST", "/fields/directus_users", field);
      console.log(`  ✓ ${field.field}`);
    } catch (e: any) {
      if (e.message.includes("already exists") || e.message.includes("409")) {
        console.log(`  - ${field.field} (ya existe)`);
      } else {
        console.error(`  ✗ ${field.field}: ${e.message}`);
      }
    }
  }
}

// ─── Collection: categorias ───
async function setupCategorias() {
  console.log("→ Creating collection: categorias...");

  try {
    await api("POST", "/collections", {
      collection: "categorias",
      meta: {
        icon: "category",
        note: "Categorias de productos con jerarquia padre-hijo",
        display_template: "{{nombre}}",
        sort_field: "sort",
        archive_field: "status",
        archive_value: "archived",
        unarchive_value: "draft",
      },
      schema: {},
      fields: [
        {
          field: "id",
          type: "string",
          meta: {
            interface: "input",
            width: "half",
            required: true,
            note: "SKU del proveedor (ID real del producto)",
          },
          schema: { is_primary_key: true, is_nullable: false },
        },
        {
          field: "status",
          type: "string",
          meta: {
            interface: "select-dropdown",
            display: "labels",
            width: "full",
            options: {
              choices: [
                { text: "Publicado", value: "published", color: "var(--theme--success)" },
                { text: "Borrador", value: "draft", color: "var(--theme--warning)" },
                { text: "Archivado", value: "archived", color: "var(--theme--danger)" },
              ],
            },
          },
          schema: { default_value: "draft", is_nullable: false },
        },
        {
          field: "nombre",
          type: "string",
          meta: { interface: "input", width: "half", required: true },
          schema: { is_nullable: false },
        },
        {
          field: "slug",
          type: "string",
          meta: {
            interface: "input",
            width: "half",
            required: true,
            note: "URL amigable, ej: productos-limpieza",
          },
          schema: { is_nullable: false, is_unique: true },
        },
        {
          field: "descripcion",
          type: "text",
          meta: { interface: "input-rich-text-html", width: "full" },
          schema: { is_nullable: true },
        },
        {
          field: "imagen",
          type: "uuid",
          meta: { interface: "file-image", width: "half" },
          schema: { is_nullable: true },
        },
        {
          field: "sort",
          type: "integer",
          meta: { interface: "input", hidden: true, width: "half" },
          schema: { is_nullable: true },
        },
      ],
    });
    console.log("  ✓ Collection created");
  } catch (e: any) {
    if (e.message.includes("already exists") || e.message.includes("409")) {
      console.log("  - Collection already exists");
    } else {
      throw e;
    }
  }

  // M2O parent (recursive)
  try {
    await api("POST", "/fields/categorias", {
      field: "parent",
      type: "integer",
      meta: {
        interface: "select-dropdown-m2o",
        display: "related-values",
        display_options: { template: "{{nombre}}" },
        width: "half",
        note: "Categoria padre (dejar vacio para categoria raiz)",
      },
      schema: { is_nullable: true },
    });
    await api("POST", "/relations", {
      collection: "categorias",
      field: "parent",
      related_collection: "categorias",
      meta: { one_field: "subcategorias" },
      schema: { on_delete: "SET NULL" },
    });
    console.log("  ✓ parent (M2O recursive)");
  } catch (e: any) {
    console.log(`  - parent: ${e.message.slice(0, 80)}`);
  }

  // O2M subcategorias alias
  try {
    await api("POST", "/fields/categorias", {
      field: "subcategorias",
      type: "alias",
      meta: {
        interface: "list-o2m",
        display: "related-values",
        display_options: { template: "{{nombre}}" },
        special: ["o2m"],
      },
    });
    console.log("  ✓ subcategorias (O2M alias)");
  } catch {
    console.log("  - subcategorias alias (ya existe o creado con relacion)");
  }
}

// ─── Collection: productos ───
async function setupProductos() {
  console.log("→ Creating collection: productos...");

  try {
    await api("POST", "/collections", {
      collection: "productos",
      meta: {
        icon: "inventory_2",
        note: "Catalogo de productos B2B",
        display_template: "{{nombre}} ({{sku}})",
        sort_field: "sort",
        archive_field: "status",
        archive_value: "archived",
        unarchive_value: "draft",
      },
      schema: {},
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "status",
          type: "string",
          meta: {
            interface: "select-dropdown",
            display: "labels",
            width: "full",
            options: {
              choices: [
                { text: "Publicado", value: "published", color: "var(--theme--success)" },
                { text: "Borrador", value: "draft", color: "var(--theme--warning)" },
                { text: "Archivado", value: "archived", color: "var(--theme--danger)" },
              ],
            },
          },
          schema: { default_value: "draft", is_nullable: false },
        },
        {
          field: "sort",
          type: "integer",
          meta: { interface: "input", hidden: true },
          schema: { is_nullable: true },
        },
        {
          field: "sku",
          type: "string",
          meta: {
            interface: "input",
            width: "half",
            required: true,
            note: "Codigo SKU (debe coincidir con ID)",
          },
          schema: { is_nullable: false, is_unique: true },
        },
        {
          field: "nombre",
          type: "string",
          meta: { interface: "input", width: "half", required: true },
          schema: { is_nullable: false },
        },
        {
          field: "slug",
          type: "string",
          meta: { interface: "input", width: "half", required: true },
          schema: { is_nullable: false, is_unique: true },
        },
        {
          field: "extracto",
          type: "string",
          meta: {
            interface: "input",
            width: "full",
            note: "Descripcion corta para listados (max 200 chars)",
          },
          schema: { is_nullable: true, max_length: 255 },
        },
        {
          field: "descripcion",
          type: "text",
          meta: { interface: "input-rich-text-html", width: "full" },
          schema: { is_nullable: true },
        },
        {
          field: "precio_base",
          type: "decimal",
          meta: {
            interface: "input",
            width: "half",
            required: true,
            note: "Precio base sin descuento (EUR). No visible al publico.",
          },
          schema: { is_nullable: false, numeric_precision: 10, numeric_scale: 2 },
        },
        {
          field: "stock",
          type: "integer",
          meta: {
            interface: "input",
            width: "half",
            note: "-1 = stock ilimitado",
          },
          schema: { default_value: -1, is_nullable: false },
        },
        {
          field: "imagen_principal",
          type: "uuid",
          meta: { interface: "file-image", width: "half" },
          schema: { is_nullable: true },
        },
        {
          field: "galeria",
          type: "json",
          meta: {
            interface: "list",
            width: "full",
            note: "Array de UUIDs de imagenes adicionales",
            options: {
              fields: [
                { field: "directus_files_id", name: "Imagen", type: "uuid", meta: { interface: "file-image" } },
              ],
            },
          },
          schema: { is_nullable: true },
        },
        {
          field: "ficha_tecnica",
          type: "uuid",
          meta: {
            interface: "file",
            width: "half",
            note: "PDF ficha tecnica",
          },
          schema: { is_nullable: true },
        },
        {
          field: "ficha_seguridad",
          type: "uuid",
          meta: {
            interface: "file",
            width: "half",
            note: "PDF ficha de seguridad",
          },
          schema: { is_nullable: true },
        },
        {
          field: "formato",
          type: "string",
          meta: { interface: "input", width: "half", note: "Ej: Bote 1L, Caja 6 uds" },
          schema: { is_nullable: true },
        },
        {
          field: "unidad_venta",
          type: "string",
          meta: { interface: "input", width: "half", note: "Unidad de venta" },
          schema: { is_nullable: true },
        },
      ],
    });
    console.log("  ✓ Collection created");
  } catch (e: any) {
    if (e.message.includes("already exists") || e.message.includes("409")) {
      console.log("  - Collection already exists");
    } else {
      throw e;
    }
  }

  // M2O categoria
  try {
    await api("POST", "/fields/productos", {
      field: "categoria",
      type: "integer",
      meta: {
        interface: "select-dropdown-m2o",
        display: "related-values",
        display_options: { template: "{{nombre}}" },
        width: "half",
      },
      schema: { is_nullable: true },
    });
    await api("POST", "/relations", {
      collection: "productos",
      field: "categoria",
      related_collection: "categorias",
      meta: { one_field: "productos" },
      schema: { on_delete: "SET NULL" },
    });
    console.log("  ✓ categoria (M2O -> categorias)");
  } catch (e: any) {
    console.log(`  - categoria: ${e.message.slice(0, 80)}`);
  }

  // File relations for imagen_principal, ficha_tecnica, ficha_seguridad
  for (const field of ["imagen_principal", "ficha_tecnica", "ficha_seguridad"]) {
    try {
      await api("POST", "/relations", {
        collection: "productos",
        field,
        related_collection: "directus_files",
        schema: { on_delete: "SET NULL" },
      });
      console.log(`  ✓ ${field} (FK -> directus_files)`);
    } catch {
      console.log(`  - ${field} relation (ya existe)`);
    }
  }
}

// ─── Collection: tarifas_especiales ───
async function setupTarifas() {
  console.log("→ Creating collection: tarifas_especiales...");

  try {
    await api("POST", "/collections", {
      collection: "tarifas_especiales",
      meta: {
        icon: "percent",
        note: "Descuentos por grupo de cliente, producto o categoria",
        display_template: "{{grupo_cliente}} - {{descuento_porcentaje}}%",
      },
      schema: {},
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "grupo_cliente",
          type: "string",
          meta: {
            interface: "select-dropdown",
            display: "labels",
            width: "half",
            required: true,
            options: {
              choices: [
                { text: "Distribuidor", value: "distribuidor" },
                { text: "Empresa", value: "empresa" },
                { text: "Hospital", value: "hospital" },
                { text: "Particular", value: "particular" },
              ],
            },
          },
          schema: { is_nullable: false },
        },
        {
          field: "descuento_porcentaje",
          type: "decimal",
          meta: {
            interface: "input",
            width: "half",
            required: true,
            note: "Porcentaje de descuento. Ej: 15.00 = 15%",
          },
          schema: { is_nullable: false, numeric_precision: 5, numeric_scale: 2 },
        },
      ],
    });
    console.log("  ✓ Collection created");
  } catch (e: any) {
    if (e.message.includes("already exists") || e.message.includes("409")) {
      console.log("  - Collection already exists");
    } else {
      throw e;
    }
  }

  // M2O producto (nullable)
  try {
    await api("POST", "/fields/tarifas_especiales", {
      field: "producto",
      type: "string",
      meta: {
        interface: "select-dropdown-m2o",
        display: "related-values",
        display_options: { template: "{{nombre}}" },
        width: "half",
        note: "Si vacio, aplica a toda la categoria o globalmente",
      },
      schema: { is_nullable: true },
    });
    await api("POST", "/relations", {
      collection: "tarifas_especiales",
      field: "producto",
      related_collection: "productos",
      schema: { on_delete: "CASCADE" },
    });
    console.log("  ✓ producto (M2O -> productos)");
  } catch (e: any) {
    console.log(`  - producto: ${e.message.slice(0, 80)}`);
  }

  // M2O categoria (nullable)
  try {
    await api("POST", "/fields/tarifas_especiales", {
      field: "categoria",
      type: "integer",
      meta: {
        interface: "select-dropdown-m2o",
        display: "related-values",
        display_options: { template: "{{nombre}}" },
        width: "half",
        note: "Si vacio y producto vacio, aplica globalmente al grupo",
      },
      schema: { is_nullable: true },
    });
    await api("POST", "/relations", {
      collection: "tarifas_especiales",
      field: "categoria",
      related_collection: "categorias",
      schema: { on_delete: "CASCADE" },
    });
    console.log("  ✓ categoria (M2O -> categorias)");
  } catch (e: any) {
    console.log(`  - categoria: ${e.message.slice(0, 80)}`);
  }
}

// ─── Collection: pedidos ───
async function setupPedidos() {
  console.log("→ Creating collection: pedidos...");

  try {
    await api("POST", "/collections", {
      collection: "pedidos",
      meta: {
        icon: "shopping_cart",
        note: "Pedidos / Solicitudes de presupuesto",
        display_template: "Pedido #{{id}} - {{estado}}",
      },
      schema: {},
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "estado",
          type: "string",
          meta: {
            interface: "select-dropdown",
            display: "labels",
            width: "half",
            options: {
              choices: [
                { text: "Solicitado", value: "solicitado", color: "var(--theme--warning)" },
                { text: "Aprobado - Pendiente Pago", value: "aprobado_pendiente_pago", color: "var(--theme--primary)" },
                { text: "Pagado", value: "pagado", color: "var(--theme--success)" },
                { text: "Enviado", value: "enviado", color: "var(--theme--success)" },
                { text: "Cancelado", value: "cancelado", color: "var(--theme--danger)" },
              ],
            },
          },
          schema: { default_value: "solicitado", is_nullable: false },
        },
        {
          field: "user_created",
          type: "uuid",
          meta: {
            interface: "select-dropdown-m2o",
            display: "user",
            width: "half",
            special: ["user-created"],
            readonly: true,
          },
          schema: { is_nullable: true },
        },
        {
          field: "date_created",
          type: "timestamp",
          meta: { interface: "datetime", width: "half", special: ["date-created"], readonly: true },
          schema: { is_nullable: true },
        },
        {
          field: "notas_cliente",
          type: "text",
          meta: { interface: "input-multiline", width: "half" },
          schema: { is_nullable: true },
        },
        {
          field: "notas_admin",
          type: "text",
          meta: { interface: "input-multiline", width: "half", note: "Notas internas (no visibles al cliente)" },
          schema: { is_nullable: true },
        },
        {
          field: "subtotal",
          type: "decimal",
          meta: { interface: "input", width: "third" },
          schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 2 },
        },
        {
          field: "costo_envio",
          type: "decimal",
          meta: { interface: "input", width: "third" },
          schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 2 },
        },
        {
          field: "total",
          type: "decimal",
          meta: { interface: "input", width: "third" },
          schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 2 },
        },
        {
          field: "metodo_pago",
          type: "string",
          meta: {
            interface: "select-dropdown",
            width: "half",
            options: {
              choices: [
                { text: "Transferencia bancaria", value: "transferencia" },
                { text: "Tarjeta (Redsys)", value: "tarjeta" },
              ],
            },
          },
          schema: { is_nullable: true },
        },
        {
          field: "referencia_pago",
          type: "string",
          meta: { interface: "input", width: "half", note: "Referencia del pago (Redsys/transferencia)" },
          schema: { is_nullable: true },
        },
        {
          field: "direccion_envio",
          type: "text",
          meta: { interface: "input-multiline", width: "half" },
          schema: { is_nullable: true },
        },
        {
          field: "direccion_facturacion",
          type: "text",
          meta: { interface: "input-multiline", width: "half" },
          schema: { is_nullable: true },
        },
      ],
    });
    console.log("  ✓ Collection created");
  } catch (e: any) {
    if (e.message.includes("already exists") || e.message.includes("409")) {
      console.log("  - Collection already exists");
    } else {
      throw e;
    }
  }

  // Relation user_created -> directus_users
  try {
    await api("POST", "/relations", {
      collection: "pedidos",
      field: "user_created",
      related_collection: "directus_users",
      schema: { on_delete: "SET NULL" },
    });
    console.log("  ✓ user_created (M2O -> directus_users)");
  } catch {
    console.log("  - user_created relation (ya existe)");
  }
}

// ─── Collection: pedidos_items ───
async function setupPedidosItems() {
  console.log("→ Creating collection: pedidos_items...");

  try {
    await api("POST", "/collections", {
      collection: "pedidos_items",
      meta: {
        icon: "list_alt",
        note: "Lineas de pedido",
        display_template: "{{nombre_producto}} x{{cantidad}}",
        hidden: true,
      },
      schema: {},
      fields: [
        {
          field: "id",
          type: "integer",
          meta: { hidden: true, interface: "input", readonly: true },
          schema: { is_primary_key: true, has_auto_increment: true },
        },
        {
          field: "nombre_producto",
          type: "string",
          meta: { interface: "input", width: "half", note: "Snapshot del nombre al momento del pedido" },
          schema: { is_nullable: true },
        },
        {
          field: "sku",
          type: "string",
          meta: { interface: "input", width: "half" },
          schema: { is_nullable: true },
        },
        {
          field: "cantidad",
          type: "integer",
          meta: { interface: "input", width: "third", required: true },
          schema: { is_nullable: false, default_value: 1 },
        },
        {
          field: "precio_unitario",
          type: "decimal",
          meta: { interface: "input", width: "third", note: "Precio con descuento aplicado" },
          schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 2 },
        },
        {
          field: "subtotal",
          type: "decimal",
          meta: { interface: "input", width: "third" },
          schema: { is_nullable: true, numeric_precision: 10, numeric_scale: 2 },
        },
      ],
    });
    console.log("  ✓ Collection created");
  } catch (e: any) {
    if (e.message.includes("already exists") || e.message.includes("409")) {
      console.log("  - Collection already exists");
    } else {
      throw e;
    }
  }

  // M2O pedido -> pedidos
  try {
    await api("POST", "/fields/pedidos_items", {
      field: "pedido",
      type: "integer",
      meta: { interface: "select-dropdown-m2o", width: "half", hidden: true },
      schema: { is_nullable: false },
    });
    await api("POST", "/relations", {
      collection: "pedidos_items",
      field: "pedido",
      related_collection: "pedidos",
      meta: { one_field: "items" },
      schema: { on_delete: "CASCADE" },
    });
    console.log("  ✓ pedido (M2O -> pedidos)");
  } catch (e: any) {
    console.log(`  - pedido: ${e.message.slice(0, 80)}`);
  }

  // O2M items alias on pedidos
  try {
    await api("POST", "/fields/pedidos", {
      field: "items",
      type: "alias",
      meta: {
        interface: "list-o2m",
        display: "related-values",
        display_options: { template: "{{nombre_producto}} x{{cantidad}} = {{subtotal}}€" },
        special: ["o2m"],
      },
    });
    console.log("  ✓ items alias on pedidos (O2M -> pedidos_items)");
  } catch {
    console.log("  - items alias (ya existe)");
  }

  // M2O producto -> productos
  try {
    await api("POST", "/fields/pedidos_items", {
      field: "producto",
      type: "string",
      meta: {
        interface: "select-dropdown-m2o",
        display: "related-values",
        display_options: { template: "{{nombre}}" },
        width: "half",
      },
      schema: { is_nullable: true },
    });
    await api("POST", "/relations", {
      collection: "pedidos_items",
      field: "producto",
      related_collection: "productos",
      schema: { on_delete: "SET NULL" },
    });
    console.log("  ✓ producto (M2O -> productos)");
  } catch (e: any) {
    console.log(`  - producto: ${e.message.slice(0, 80)}`);
  }
}

// ─── Main ───
async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  Tienda Alcora - Schema Setup        ║");
  console.log("╚══════════════════════════════════════╝\n");

  await setupUserFields();
  await setupCategorias();
  await setupProductos();
  await setupTarifas();
  await setupPedidos();
  await setupPedidosItems();

  console.log("\n✅ Schema setup complete!");
  console.log(
    "Siguiente paso: Crear un Admin Token en Directus y ejecutar migrate-xlsx.ts"
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
