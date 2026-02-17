const resp = await fetch("http://localhost:8056/collections", {
  headers: { Authorization: "Bearer zH7zNQCUU4EEV5Nh8I-yepbGw5vqTRWw" }
});
const json = await resp.json();
const custom = json.data.filter(c => !c.collection.startsWith("directus_"));
custom.forEach(c => console.log(c.collection));
