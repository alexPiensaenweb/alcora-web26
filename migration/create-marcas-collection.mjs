/**
 * Script para crear la colección "marcas" en Directus y migrar
 * los datos del campo texto "marca" en productos a una relación M2O.
 *
 * Uso: node migration/create-marcas-collection.mjs
 *
 * Requiere:
 *  - DIRECTUS_URL (default: http://localhost:8055)
 *  - DIRECTUS_TOKEN (static admin token)
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN || "migration-static-token-alcora-2026";

async function directus(endpoint, options = {}) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${endpoint}: ${text}`);
  }
  return res.json();
}

async function main() {
  // 1. Create "marcas" collection
  console.log("1. Creating 'marcas' collection...");
  try {
    await directus("/collections/marcas");
    console.log("   Collection 'marcas' already exists.");
  } catch {
    await directus("/collections", {
      method: "POST",
      body: JSON.stringify({
        collection: "marcas",
        schema: {},
        meta: {
          collection: "marcas",
          icon: "branding_watermark",
          note: "Marcas/fabricantes de productos",
          display_template: "{{nombre}}",
          archive_field: "status",
          archive_value: "archived",
          unarchive_value: "published",
          sort_field: "sort",
          singleton: false,
        },
      }),
    });
    console.log("   Collection 'marcas' created.");
  }

  // 2. Create fields for marcas collection
  console.log("2. Creating fields...");
  const fields = [
    {
      field: "status",
      type: "string",
      schema: { default_value: "published", max_length: 20 },
      meta: {
        interface: "select-dropdown",
        display: "labels",
        width: "half",
        options: {
          choices: [
            { text: "Published", value: "published" },
            { text: "Draft", value: "draft" },
            { text: "Archived", value: "archived" },
          ],
        },
      },
    },
    {
      field: "sort",
      type: "integer",
      schema: {},
      meta: { interface: "input", hidden: true },
    },
    {
      field: "nombre",
      type: "string",
      schema: { max_length: 100, is_nullable: false },
      meta: {
        interface: "input",
        display: "raw",
        width: "half",
        required: true,
        note: "Nombre de la marca",
      },
    },
    {
      field: "slug",
      type: "string",
      schema: { max_length: 100, is_unique: true },
      meta: {
        interface: "input",
        display: "raw",
        width: "half",
        note: "Identificador URL-friendly",
      },
    },
    {
      field: "logo",
      type: "uuid",
      schema: { is_nullable: true },
      meta: {
        interface: "file-image",
        display: "image",
        width: "half",
        note: "Logo de la marca",
      },
    },
    {
      field: "web",
      type: "string",
      schema: { max_length: 255, is_nullable: true },
      meta: {
        interface: "input",
        display: "raw",
        width: "half",
        note: "URL web del fabricante",
      },
    },
  ];

  for (const field of fields) {
    try {
      await directus(`/fields/marcas/${field.field}`);
      console.log(`   Field '${field.field}' already exists.`);
    } catch {
      await directus("/fields/marcas", {
        method: "POST",
        body: JSON.stringify(field),
      });
      console.log(`   Field '${field.field}' created.`);
    }
  }

  // 3. Set public read permissions for marcas
  console.log("3. Setting public permissions...");
  try {
    const permsRes = await directus(
      "/permissions?filter[collection][_eq]=marcas&filter[role][_null]=true&filter[action][_eq]=read"
    );
    if (permsRes.data && permsRes.data.length > 0) {
      console.log("   Public read permission already exists.");
    } else {
      await directus("/permissions", {
        method: "POST",
        body: JSON.stringify({
          role: null,
          collection: "marcas",
          action: "read",
          fields: ["*"],
        }),
      });
      console.log("   Public read permission created.");
    }
  } catch (err) {
    console.log("   Could not set permissions:", err.message);
  }

  // 4. Extract unique brands from existing products
  console.log("4. Extracting unique brands from products...");
  let page = 1;
  const allBrands = new Set();
  const productBrandMap = []; // [{id, marca}]

  while (true) {
    const res = await directus(
      `/items/productos?fields=id,marca&filter[marca][_nnull]=true&limit=100&offset=${(page - 1) * 100}`
    );
    if (!res.data || res.data.length === 0) break;
    for (const p of res.data) {
      if (p.marca && p.marca.trim()) {
        const brand = p.marca.trim();
        allBrands.add(brand);
        productBrandMap.push({ id: p.id, marca: brand });
      }
    }
    page++;
  }

  console.log(`   Found ${allBrands.size} unique brands from ${productBrandMap.length} products`);

  // 5. Create marca records
  console.log("5. Creating marca records...");
  const brandIdMap = {}; // { brandName: marcaId }

  for (const brand of allBrands) {
    const slug = brand
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      const result = await directus("/items/marcas", {
        method: "POST",
        body: JSON.stringify({
          nombre: brand,
          slug: slug,
          status: "published",
        }),
      });
      brandIdMap[brand] = result.data.id;
      console.log(`   Created: ${brand} (id: ${result.data.id})`);
    } catch (err) {
      // May already exist - try to find it
      try {
        const existing = await directus(
          `/items/marcas?filter[nombre][_eq]=${encodeURIComponent(brand)}&limit=1`
        );
        if (existing.data?.[0]) {
          brandIdMap[brand] = existing.data[0].id;
          console.log(`   Already exists: ${brand} (id: ${existing.data[0].id})`);
        }
      } catch {
        console.log(`   Failed to create/find: ${brand} - ${err.message}`);
      }
    }
  }

  // 6. Create M2O relation field: productos.marca_id -> marcas.id
  console.log("6. Creating M2O relation field 'marca_id' in productos...");
  try {
    await directus("/fields/productos/marca_id");
    console.log("   Field 'marca_id' already exists.");
  } catch {
    await directus("/relations", {
      method: "POST",
      body: JSON.stringify({
        collection: "productos",
        field: "marca_id",
        related_collection: "marcas",
        meta: {
          sort_field: null,
        },
        schema: {
          on_delete: "SET NULL",
        },
      }),
    });

    // Update the field meta for a nice interface
    await directus("/fields/productos/marca_id", {
      method: "PATCH",
      body: JSON.stringify({
        meta: {
          interface: "select-dropdown-m2o",
          display: "related-values",
          display_options: {
            template: "{{nombre}}",
          },
          width: "half",
          note: "Marca/fabricante del producto",
        },
      }),
    });
    console.log("   Field 'marca_id' created with M2O relation.");
  }

  // 7. Update products to point to the new marca record
  console.log("7. Updating products with marca_id...");
  let updated = 0;
  for (const { id, marca } of productBrandMap) {
    const marcaId = brandIdMap[marca];
    if (marcaId) {
      await directus(`/items/productos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ marca_id: marcaId }),
      });
      updated++;
      if (updated % 20 === 0) console.log(`   Updated ${updated}/${productBrandMap.length}...`);
    }
  }

  console.log(`\nDone! Created ${allBrands.size} brands, updated ${updated} products.`);
  console.log("\nNext steps:");
  console.log("  - Verify in Directus admin that 'marcas' collection is visible");
  console.log("  - Update frontend code to use marca_id relation instead of marca text field");
  console.log("  - Optionally remove the old 'marca' text field from productos");
}

main().catch(console.error);
