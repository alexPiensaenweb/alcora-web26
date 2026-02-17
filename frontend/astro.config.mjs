import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), tailwind()],
  vite: {
    // PUBLIC_DIRECTUS_URL se necesita en cliente (React islands)
    // DIRECTUS_URL se lee en runtime via process.env en server
    define: {
      "import.meta.env.PUBLIC_DIRECTUS_URL": JSON.stringify(
        process.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055"
      ),
    },
  },
});
