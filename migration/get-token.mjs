const resp = await fetch("https://tienda.alcora.es/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alcora.es", password: "AlcoraAdmin2026!" })
});
const json = await resp.json();
console.log(json.data.access_token);
