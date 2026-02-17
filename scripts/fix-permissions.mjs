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

// Fix public permissions
const perms = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicyId}`);
console.log('Public permissions:');
for (const p of perms.data) {
  console.log(' ', p.id, p.collection, p.action, 'fields:', p.fields);
  if ((p.collection === 'productos' || p.collection === 'categorias') && p.fields && !p.fields.includes('status')) {
    const newFields = [...p.fields, 'status'];
    await api('PATCH', `/permissions/${p.id}`, { fields: newFields });
    console.log('  -> Updated to include status');
  }
}

// Also need to add date_created to productos permission (used for sorting)
for (const p of perms.data) {
  if (p.collection === 'productos' && p.fields && !p.fields.includes('date_created')) {
    const newFields = [...p.fields, 'date_created'];
    await api('PATCH', `/permissions/${p.id}`, { fields: newFields });
    console.log('  -> Updated productos to include date_created');
  }
}

// Verify
const perms2 = await api('GET', `/permissions?filter[policy][_eq]=${publicPolicyId}`);
console.log('\nUpdated public permissions:');
for (const p of perms2.data) {
  console.log(' ', p.collection, p.action, 'fields:', p.fields);
}

// Test query
const test = await fetch(`${DIRECTUS_URL}/items/productos?filter[status][_eq]=published&fields=id,nombre,slug&limit=3`);
const testData = await test.json();
console.log('\nTest public query:', JSON.stringify(testData, null, 2));
