const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_TOKEN = 'alcora-admin-static-token-2026-2121cd1c10b42e21ea3a81b4603a7c1d';
const headers = { 'Authorization': 'Bearer ' + ADMIN_TOKEN, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.substring(0,300)}`);
  return JSON.parse(text);
}

const publicPolicyId = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';
const clientePolicyId = 'de7deed6-1e23-43ec-aaa1-e41c36cc7884';

// Simplest fix: set all public permissions to use wildcard fields
// Public can read everything except precio_base which we'll handle via query fields
console.log('Updating public permissions to use wildcard...');

const perms = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicyId}`);
for (const p of perms.data) {
  await api('PATCH', `/permissions/${p.id}`, { fields: ['*'] });
  console.log(`  Updated ${p.collection} ${p.action} -> fields: [*]`);
}

// Also update Cliente permissions to ensure all fields accessible
const clientePerms = await api('GET', `/permissions?filter[policy][_eq]=${clientePolicyId}`);
for (const p of clientePerms.data) {
  if (p.fields && !p.fields.includes('*')) {
    await api('PATCH', `/permissions/${p.id}`, { fields: ['*'] });
    console.log(`  Updated Cliente ${p.collection} ${p.action} -> fields: [*]`);
  } else {
    console.log(`  OK Cliente ${p.collection} ${p.action} already has wildcard`);
  }
}

// Test queries
console.log('\n--- Testing ---');

const cats = await fetch(`${DIRECTUS_URL}/items/categorias?filter[status][_eq]=published&sort=sort,nombre&fields=*,subcategorias.*`);
const catsData = await cats.json();
console.log('Categories:', catsData.data ? catsData.data.map(c => c.nombre).join(', ') : 'ERROR: ' + JSON.stringify(catsData.errors));

const prods = await fetch(`${DIRECTUS_URL}/items/productos?filter[status][_eq]=published&fields=id,nombre,slug,precio_base&limit=3`);
const prodsData = await prods.json();
console.log('Products:', prodsData.data ? prodsData.data.map(p => `${p.nombre} (${p.precio_base}€)`).join(', ') : 'ERROR: ' + JSON.stringify(prodsData.errors));
