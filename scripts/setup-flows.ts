/**
 * Setup Directus Flows for email automation
 *
 * Run this after Directus is running and schema is set up:
 *   npx tsx setup-flows.ts
 *
 * Creates 3 Flows:
 * 1. Nuevo Registro B2B → emails to admin + user
 * 2. Activacion de Cuenta → email to user
 * 3. Nuevo Pedido → emails to admin + user
 */

import "dotenv/config";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@alcora.es";
const SMTP_FROM = process.env.SMTP_FROM || "tienda@alcora.es";

if (!ADMIN_TOKEN) {
  console.error("DIRECTUS_ADMIN_TOKEN is required");
  process.exit(1);
}

async function directusFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || "GET"} ${endpoint}: ${res.status} - ${text}`);
  }

  return res.json();
}

async function createFlow(flow: any) {
  try {
    const result = await directusFetch("/flows", {
      method: "POST",
      body: JSON.stringify(flow),
    });
    console.log(`  Flow created: ${flow.name}`);
    return result.data;
  } catch (err: any) {
    if (err.message.includes("already exists") || err.message.includes("unique")) {
      console.log(`  Flow already exists: ${flow.name}`);
      return null;
    }
    throw err;
  }
}

async function createOperation(operation: any) {
  try {
    const result = await directusFetch("/operations", {
      method: "POST",
      body: JSON.stringify(operation),
    });
    console.log(`    Operation created: ${operation.name}`);
    return result.data;
  } catch (err: any) {
    if (err.message.includes("already exists") || err.message.includes("unique")) {
      console.log(`    Operation already exists: ${operation.name}`);
      return null;
    }
    throw err;
  }
}

async function main() {
  console.log("Setting up Directus Flows...\n");

  // ─── Flow 1: Nuevo Registro B2B ───
  console.log("1. Flow: Nuevo Registro B2B");
  const flow1 = await createFlow({
    name: "Nuevo Registro B2B",
    status: "active",
    trigger: "event",
    accountability: "all",
    options: {
      type: "action",
      scope: ["items.create"],
      collections: ["directus_users"],
    },
  });

  if (flow1) {
    // Email to admin
    const op1a = await createOperation({
      name: "Email a Admin - Nuevo Registro",
      flow: flow1.id,
      type: "mail",
      position_x: 20,
      position_y: 1,
      options: {
        to: ADMIN_EMAIL,
        subject: "Nuevo registro B2B - {{$trigger.payload.first_name}} {{$trigger.payload.last_name}}",
        body: `<h2>Nuevo registro B2B en Tienda Alcora</h2>
<p>Un nuevo usuario ha solicitado acceso:</p>
<ul>
<li><strong>Nombre:</strong> {{$trigger.payload.first_name}} {{$trigger.payload.last_name}}</li>
<li><strong>Email:</strong> {{$trigger.payload.email}}</li>
<li><strong>Razon social:</strong> {{$trigger.payload.razon_social}}</li>
<li><strong>CIF/NIF:</strong> {{$trigger.payload.cif_nif}}</li>
<li><strong>Telefono:</strong> {{$trigger.payload.telefono}}</li>
</ul>
<p>Acceda al <a href="${DIRECTUS_URL}/admin/users/{{$trigger.key}}">panel de Directus</a> para revisar y activar la cuenta.</p>`,
      },
    });

    // Email to user
    const op1b = await createOperation({
      name: "Email a Usuario - Registro Recibido",
      flow: flow1.id,
      type: "mail",
      position_x: 40,
      position_y: 1,
      options: {
        to: "{{$trigger.payload.email}}",
        subject: "Solicitud de registro recibida - Tienda Alcora",
        body: `<h2>Hemos recibido su solicitud</h2>
<p>Estimado/a {{$trigger.payload.first_name}},</p>
<p>Su solicitud de acceso a la Tienda B2B de Alcora Salud Ambiental ha sido recibida correctamente.</p>
<p>Un administrador revisara sus datos y activara su cuenta en las proximas horas. Recibira un email de confirmacion cuando su cuenta este activa.</p>
<p>Gracias por su interes.</p>
<p>Atentamente,<br>Equipo Alcora Salud Ambiental</p>`,
      },
    });

    // Link operations
    if (op1a && op1b) {
      await directusFetch(`/flows/${flow1.id}`, {
        method: "PATCH",
        body: JSON.stringify({ operation: op1a.id }),
      });
      await directusFetch(`/operations/${op1a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resolve: op1b.id }),
      });
    }
  }

  // ─── Flow 2: Activacion de Cuenta ───
  console.log("\n2. Flow: Activacion de Cuenta");
  const flow2 = await createFlow({
    name: "Activacion de Cuenta",
    status: "active",
    trigger: "event",
    accountability: "all",
    options: {
      type: "filter",
      scope: ["items.update"],
      collections: ["directus_users"],
    },
  });

  if (flow2) {
    // Condition: status changed to active
    const op2a = await createOperation({
      name: "Verificar Status Activo",
      flow: flow2.id,
      type: "condition",
      position_x: 20,
      position_y: 1,
      options: {
        filter: {
          "$trigger.payload.status": { _eq: "active" },
        },
      },
    });

    // Read user data
    const op2b = await createOperation({
      name: "Leer Datos Usuario",
      flow: flow2.id,
      type: "item-read",
      position_x: 40,
      position_y: 1,
      options: {
        collection: "directus_users",
        key: "{{$trigger.keys[0]}}",
      },
    });

    // Email to activated user
    const op2c = await createOperation({
      name: "Email Cuenta Activada",
      flow: flow2.id,
      type: "mail",
      position_x: 60,
      position_y: 1,
      options: {
        to: "{{$last.email}}",
        subject: "Su cuenta ha sido activada - Tienda Alcora",
        body: `<h2>Su cuenta esta activa</h2>
<p>Estimado/a {{$last.first_name}},</p>
<p>Su cuenta en la Tienda B2B de Alcora Salud Ambiental ha sido verificada y activada correctamente.</p>
<p>Ya puede acceder con sus credenciales para:</p>
<ul>
<li>Ver precios exclusivos para su grupo de cliente</li>
<li>Realizar pedidos</li>
<li>Descargar fichas tecnicas y de seguridad</li>
</ul>
<p><a href="${process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es"}/login" style="display:inline-block;background:#2970ff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Acceder a mi cuenta</a></p>
<p>Gracias por confiar en nosotros.</p>
<p>Atentamente,<br>Equipo Alcora Salud Ambiental</p>`,
      },
    });

    if (op2a && op2b && op2c) {
      await directusFetch(`/flows/${flow2.id}`, {
        method: "PATCH",
        body: JSON.stringify({ operation: op2a.id }),
      });
      await directusFetch(`/operations/${op2a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resolve: op2b.id }),
      });
      await directusFetch(`/operations/${op2b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resolve: op2c.id }),
      });
    }
  }

  // ─── Flow 3: Nuevo Pedido ───
  console.log("\n3. Flow: Nuevo Pedido");
  const flow3 = await createFlow({
    name: "Nuevo Pedido",
    status: "active",
    trigger: "event",
    accountability: "all",
    options: {
      type: "action",
      scope: ["items.create"],
      collections: ["pedidos"],
    },
  });

  if (flow3) {
    // Read order with user data
    const op3a = await createOperation({
      name: "Leer Pedido Completo",
      flow: flow3.id,
      type: "item-read",
      position_x: 20,
      position_y: 1,
      options: {
        collection: "pedidos",
        key: "{{$trigger.key}}",
        query: {
          fields: ["*", "user_created.email", "user_created.first_name", "user_created.razon_social", "items.*"],
        },
      },
    });

    // Email to admin
    const op3b = await createOperation({
      name: "Email a Admin - Nuevo Pedido",
      flow: flow3.id,
      type: "mail",
      position_x: 40,
      position_y: 1,
      options: {
        to: ADMIN_EMAIL,
        subject: "Nuevo pedido #{{$trigger.key}} - Tienda Alcora",
        body: `<h2>Nuevo pedido recibido</h2>
<p><strong>Pedido #{{$trigger.key}}</strong></p>
<p><strong>Cliente:</strong> {{$last.user_created.razon_social}} ({{$last.user_created.email}})</p>
<p><strong>Total:</strong> {{$last.total}}€</p>
<p><strong>Metodo de pago:</strong> {{$last.metodo_pago}}</p>
<p>Acceda al <a href="${DIRECTUS_URL}/admin/content/pedidos/{{$trigger.key}}">panel de Directus</a> para revisar el pedido.</p>`,
      },
    });

    // Email to customer
    const op3c = await createOperation({
      name: "Email a Cliente - Confirmacion Pedido",
      flow: flow3.id,
      type: "mail",
      position_x: 60,
      position_y: 1,
      options: {
        to: "{{$last.user_created.email}}",
        subject: "Confirmacion pedido #{{$trigger.key}} - Tienda Alcora",
        body: `<h2>Pedido recibido</h2>
<p>Estimado/a {{$last.user_created.first_name}},</p>
<p>Hemos recibido su pedido <strong>#{{$trigger.key}}</strong> correctamente.</p>
<p><strong>Resumen:</strong></p>
<ul>
<li>Subtotal: {{$last.subtotal}}€</li>
<li>Envio: {{$last.costo_envio}}€</li>
<li><strong>Total: {{$last.total}}€</strong></li>
</ul>
<p>Nuestro equipo revisara su pedido y le notificara los siguientes pasos.</p>
<p>Puede consultar el estado de su pedido en <a href="${process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es"}/cuenta/pedidos">su area de cliente</a>.</p>
<p>Gracias por su compra.</p>
<p>Atentamente,<br>Equipo Alcora Salud Ambiental</p>`,
      },
    });

    if (op3a && op3b && op3c) {
      await directusFetch(`/flows/${flow3.id}`, {
        method: "PATCH",
        body: JSON.stringify({ operation: op3a.id }),
      });
      await directusFetch(`/operations/${op3a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resolve: op3b.id }),
      });
      await directusFetch(`/operations/${op3b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resolve: op3c.id }),
      });
    }
  }

  console.log("\nFlows setup complete!");
}

main().catch(console.error);
