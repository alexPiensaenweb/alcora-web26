/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
export { renderers } from '../renderers.mjs';

const $$PoliticaPrivacidad = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Pol\xEDtica de Privacidad - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> <h1 class="text-3xl font-bold text-navy mb-8">Política de Privacidad</h1> <div class="prose prose-sm max-w-none text-navy space-y-6"> <section> <h2 class="text-xl font-semibold text-navy">1. Responsable del tratamiento</h2> <ul class="text-text-muted list-none space-y-1"> <li><strong>Empresa:</strong> Alcora Salud Ambiental S.L.</li> <li><strong>Dirección:</strong> Pol. Malpica, C/ F Oeste Nave 98, 50016 Zaragoza</li> <li><strong>Email:</strong> <a href="mailto:central@alcora.es" class="text-action">central@alcora.es</a></li> <li><strong>Teléfono:</strong> 976 29 10 19</li> </ul> </section> <section> <h2 class="text-xl font-semibold text-navy">2. Finalidad del tratamiento</h2> <p class="text-text-muted">Los datos personales recogidos se tratan con las siguientes finalidades:</p> <ul class="text-text-muted list-disc pl-5 space-y-1"> <li>Gestión de cuentas de clientes profesionales y pedidos</li> <li>Procesamiento de solicitudes de registro</li> <li>Facturación y gestión de envíos</li> <li>Comunicaciones comerciales (solo con consentimiento previo)</li> <li>Atención de consultas y solicitudes</li> </ul> </section> <section> <h2 class="text-xl font-semibold text-navy">3. Base legal</h2> <p class="text-text-muted">
El tratamiento de sus datos se basa en la ejecución de un contrato o relación comercial,
          el cumplimiento de obligaciones legales (facturación) y, en su caso, el consentimiento
          otorgado para comunicaciones comerciales.
</p> </section> <section> <h2 class="text-xl font-semibold text-navy">4. Datos recopilados</h2> <ul class="text-text-muted list-disc pl-5 space-y-1"> <li>Nombre y apellidos</li> <li>Razón social y CIF/NIF</li> <li>Email y teléfono</li> <li>Dirección postal</li> <li>Tipo de negocio y cargo</li> <li>Datos de pedidos y facturación</li> </ul> </section> <section> <h2 class="text-xl font-semibold text-navy">5. Conservación de datos</h2> <p class="text-text-muted">
Los datos se conservarán mientras dure la relación comercial y, tras su finalización,
          durante los plazos legalmente exigidos para cumplir obligaciones fiscales y mercantiles.
</p> </section> <section> <h2 class="text-xl font-semibold text-navy">6. Derechos del interesado</h2> <p class="text-text-muted">
Puede ejercer sus derechos de acceso, rectificación, supresión, limitación, portabilidad
          y oposición enviando un escrito a <a href="mailto:central@alcora.es" class="text-action">central@alcora.es</a>
o a la dirección postal indicada, adjuntando copia de su documento de identidad.
</p> </section> <section> <h2 class="text-xl font-semibold text-navy">7. Destinatarios</h2> <p class="text-text-muted">
No se cederán datos a terceros salvo obligación legal o para la gestión de envíos
          (empresa de transporte).
</p> </section> <p class="text-xs text-text-muted pt-4 border-t border-border">
Última actualización: febrero 2026
</p> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/politica-privacidad.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/politica-privacidad.astro";
const $$url = "/politica-privacidad";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$PoliticaPrivacidad,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
