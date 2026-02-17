# 🧬 AGENCY_STANDARD_2026.md

> **Versión:** 2.0 (Next.js App Router + Directus Hybrid)
> **Última Actualización:** Febrero 2026
> **Filosofía:** "Maximum Performance, Zero Bloat". Separación estricta entre Diseño (JSON Canvas) y Datos de Negocio (SQL).

---

## 1. EL STACK TECNOLÓGICO (MANDATORIO)

Cualquier proyecto nuevo debe adherirse estrictamente a estas tecnologías. No se admiten excepciones sin aprobación del CTO.

* **Backend (Headless):** Directus (Dockerizado) + PostgreSQL + Redis.
* **Frontend:** Next.js (App Router). Uso estricto de **React Server Components (RSC)**.
* **Estilos:** Tailwind CSS (configurado con Variables CSS dinámicas).
* **Infraestructura:** Docker Compose (independiente por cliente) gestionado bajo arquitectura **Hub & Spoke**.

---

## 2. ARQUITECTURA DE DATOS: "HYBRID CONTENT MODEL"

Abandonamos el modelo tradicional de CMS donde "todo es una página". Dividimos los datos en dos mundos:

### A. Mundo Visual (The JSON Canvas) - `web_pages`
El diseño y estructura de las landings **NO** se modela con relaciones complejas (M2A) en la base de datos.
* **Colección:** `web_pages`.
* **Campo Clave:** `canvas_content` (Tipo JSON).
* **Funcionamiento:** Un **Editor Visual Propio** genera un árbol JSON completo del layout (Hero, Grid, Textos). Next.js recibe ese JSON y renderiza los componentes recursivamente.
* **Regla de Imágenes:** Las imágenes dentro del JSON se guardan siempre como **UUIDs de Directus**, nunca como URLs absolutas.
* **Regla de SEO:** Títulos y Metas van en campos SQL separados (`seo_title`, `seo_desc`) dentro de `web_pages`, no en el JSON.

### B. Mundo de Negocio (Business Data) - SQL Puro
Los datos que requieren filtrado, búsqueda, ordenación o gestión masiva viven en colecciones estructuradas.
* **Ejemplos:** `pim_products`, `blog_posts`, `crm_leads`, `real_estate_properties`, `portfolio_projects`.
* **Conexión:** El "Canvas JSON" puede hacer referencia a estos datos por ID.
    * *Ejemplo:* Un bloque visual `ProductGrid` en el JSON guarda `{ "category_id": 5, "limit": 4 }`. El Frontend usa esos IDs para hacer fetch de los datos reales a la colección `pim_products`.

---

## 3. SISTEMA DE "SKILLS" (MODULARIDAD)

No construimos webs desde cero. Activamos módulos pre-construidos en nuestra plantilla maestra.
Cada proyecto tiene una colección Singleton `sys_skills` que actúa como panel de interruptores.

### Lista de Skills Estándar:

1.  **🟢 SKILL_CORPORATE (Base):**
    * *Siempre activo.*
    * Gestión de páginas (`web_pages`), Menús (`sys_menus`), Textos Legales, `sys_brand` (Colores/Fuentes) y SEO global.

2.  **🔵 SKILL_BLOG (Publisher):**
    * **Activa:** `blog_posts`, `blog_categories`, `blog_authors`.
    * **Frontend:** Rutas `/blog`, `/blog/[slug]` y renderizado de artículos ricos.

3.  **🟠 SKILL_PIM (Catálogo Técnico):**
    * **Activa:** `pim_products`, `pim_categories`, `pim_attributes`, `pim_brands`, `pim_docs`.
    * **Frontend:** Buscador facetado, Fichas técnicas, Comparador de productos.
    * **Nota:** No incluye carrito de compra. Ideal para B2B/Industrial.

4.  **🟣 SKILL_ECOMMERCE (Venta):**
    * **Requisito:** `SKILL_PIM` activo.
    * **Activa:** `shop_orders`, `shop_customers`, `shop_cart`, `shop_coupons`.
    * **Frontend:** Contexto de Carrito, Checkout, Pasarela de pago (Stripe/Redsys), Área de cliente.

5.  **🔴 SKILL_CRM (Captación):**
    * **Activa:** `crm_leads`, `crm_pipelines` (Kanban).
    * **Frontend:** Formularios complejos, Popups de captación, Enrutado inteligente de emails.

---

## 4. PROTOCOLOS DE FRONTEND (NEXT.JS APP ROUTER)

### A. Server Components First
* El 90% de los componentes deben ser asíncronos (`async function`) y ejecutarse en el servidor (RSC).
* **Data Fetching:** Se realiza directamente en el componente usando `lib/directus.ts`.
* **Client Components:** Uso restringido a interactividad (Click listeners, Swipers, State del Editor Visual). Deben ser hojas del árbol (`'use client'`).

### B. Imágenes y Assets
* Se utiliza `next/image` con un **Loader Personalizado** que conecta con la API de Assets de Directus.
* Se prohíbe subir imágenes de contenido a la carpeta `/public` del repositorio.

### C. Design Tokens & Branding
* Los colores y tipografías **NO** se hardcodean en Tailwind (ej: nada de `bg-blue-500` arbitrario).
* Se configuran en Directus (`sys_brand`) y se inyectan como variables CSS (`--color-primary`) en el `:root` del layout principal.
* Tailwind se configura para leer estas variables: `colors: { primary: 'var(--color-primary)' }`.

---

## 5. INFRAESTRUCTURA Y OPERACIONES

### A. Modelo Hub & Spoke
* **Agencia (Hub):** Instancia Directus "Master" que monitoriza todos los proyectos. Contiene la lista de clientes y tokens de acceso.
* **Cliente (Spoke):** Instancia Docker aislada con su propia BBDD y Redis.
* **Gestión:** El Hub tiene un token maestro para realizar acciones de mantenimiento (Updates de Schema, Backups, Health Checks) en los clientes.

### B. MVP en 10 Días (Roadmap Estándar)
El estándar de entrega para una primera versión funcional es:
1.  **Día 1:** Despliegue de Docker "Agency Boilerplate" + Configuración de `sys_skills` y `sys_brand`.
2.  **Día 2-3:** Carga de datos legales y contacto + Modelado de datos de negocio (`pim_*`).
3.  **Día 4-8:** Maquetación visual de landings mediante Editor JSON + Ajuste de componentes React específicos.
4.  **Día 9-10:** Testing, SEO Técnico y Pase a Producción.

---

## 6. INSTRUCCIONES PARA EL AGENTE IA

Si estás leyendo este documento para planificar o ejecutar un proyecto:

1.  **Analiza** los requisitos del cliente y determina qué **SKILLS** activar.
2.  **Define** el Schema de Datos solo para las colecciones de negocio (SQL).
3.  **No sugieras** arquitecturas basadas en WordPress, PHP o Plugins.
4.  **No sugieras** crear colecciones M2A para la maquetación visual (usa el campo `canvas_content` JSON).
5.  **Genera** código Next.js que priorice Server Components y `next/image`.