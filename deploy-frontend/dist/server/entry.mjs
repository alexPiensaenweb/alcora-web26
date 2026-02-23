import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CLrnvhOi.mjs';
import { manifest } from './manifest_DPBjCvkF.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/aviso-legal.astro.mjs');
const _page3 = () => import('./pages/carrito.astro.mjs');
const _page4 = () => import('./pages/cart/presupuesto.astro.mjs');
const _page5 = () => import('./pages/cart/submit.astro.mjs');
const _page6 = () => import('./pages/catalogo/_slug_.astro.mjs');
const _page7 = () => import('./pages/catalogo.astro.mjs');
const _page8 = () => import('./pages/categoria/_slug_.astro.mjs');
const _page9 = () => import('./pages/checkout.astro.mjs');
const _page10 = () => import('./pages/cuenta/pedidos/_id_.astro.mjs');
const _page11 = () => import('./pages/cuenta/pedidos.astro.mjs');
const _page12 = () => import('./pages/cuenta/perfil.astro.mjs');
const _page13 = () => import('./pages/cuenta.astro.mjs');
const _page14 = () => import('./pages/cuenta-api/login.astro.mjs');
const _page15 = () => import('./pages/cuenta-api/logout.astro.mjs');
const _page16 = () => import('./pages/cuenta-api/me.astro.mjs');
const _page17 = () => import('./pages/cuenta-api/profile.astro.mjs');
const _page18 = () => import('./pages/cuenta-api/register.astro.mjs');
const _page19 = () => import('./pages/gestion/pedidos/_id_.astro.mjs');
const _page20 = () => import('./pages/gestion/pedidos.astro.mjs');
const _page21 = () => import('./pages/gestion/productos/nuevo.astro.mjs');
const _page22 = () => import('./pages/gestion/productos.astro.mjs');
const _page23 = () => import('./pages/gestion/usuarios.astro.mjs');
const _page24 = () => import('./pages/gestion.astro.mjs');
const _page25 = () => import('./pages/gestion-api/pedidos/_id_/estado.astro.mjs');
const _page26 = () => import('./pages/gestion-api/pedidos/_id_/notas.astro.mjs');
const _page27 = () => import('./pages/gestion-api/productos/crear.astro.mjs');
const _page28 = () => import('./pages/gestion-api/productos/importar.astro.mjs');
const _page29 = () => import('./pages/gestion-api/productos/_id_.astro.mjs');
const _page30 = () => import('./pages/gestion-api/upload.astro.mjs');
const _page31 = () => import('./pages/gestion-api/usuarios/_id_/estado.astro.mjs');
const _page32 = () => import('./pages/gestion-api/usuarios/_id_/grupo.astro.mjs');
const _page33 = () => import('./pages/login.astro.mjs');
const _page34 = () => import('./pages/marca/_slug_.astro.mjs');
const _page35 = () => import('./pages/marcas.astro.mjs');
const _page36 = () => import('./pages/pago/ko.astro.mjs');
const _page37 = () => import('./pages/pago/ok.astro.mjs');
const _page38 = () => import('./pages/politica-cookies.astro.mjs');
const _page39 = () => import('./pages/politica-privacidad.astro.mjs');
const _page40 = () => import('./pages/products-api.astro.mjs');
const _page41 = () => import('./pages/registro.astro.mjs');
const _page42 = () => import('./pages/search/suggest.astro.mjs');
const _page43 = () => import('./pages/sitemap-dynamic.xml.astro.mjs');
const _page44 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/aviso-legal.astro", _page2],
    ["src/pages/carrito.astro", _page3],
    ["src/pages/cart/presupuesto.ts", _page4],
    ["src/pages/cart/submit.ts", _page5],
    ["src/pages/catalogo/[slug].astro", _page6],
    ["src/pages/catalogo/index.astro", _page7],
    ["src/pages/categoria/[slug].astro", _page8],
    ["src/pages/checkout.astro", _page9],
    ["src/pages/cuenta/pedidos/[id].astro", _page10],
    ["src/pages/cuenta/pedidos.astro", _page11],
    ["src/pages/cuenta/perfil.astro", _page12],
    ["src/pages/cuenta/index.astro", _page13],
    ["src/pages/cuenta-api/login.ts", _page14],
    ["src/pages/cuenta-api/logout.ts", _page15],
    ["src/pages/cuenta-api/me.ts", _page16],
    ["src/pages/cuenta-api/profile.ts", _page17],
    ["src/pages/cuenta-api/register.ts", _page18],
    ["src/pages/gestion/pedidos/[id].astro", _page19],
    ["src/pages/gestion/pedidos.astro", _page20],
    ["src/pages/gestion/productos/nuevo.astro", _page21],
    ["src/pages/gestion/productos.astro", _page22],
    ["src/pages/gestion/usuarios.astro", _page23],
    ["src/pages/gestion/index.astro", _page24],
    ["src/pages/gestion-api/pedidos/[id]/estado.ts", _page25],
    ["src/pages/gestion-api/pedidos/[id]/notas.ts", _page26],
    ["src/pages/gestion-api/productos/crear.ts", _page27],
    ["src/pages/gestion-api/productos/importar.ts", _page28],
    ["src/pages/gestion-api/productos/[id].ts", _page29],
    ["src/pages/gestion-api/upload.ts", _page30],
    ["src/pages/gestion-api/usuarios/[id]/estado.ts", _page31],
    ["src/pages/gestion-api/usuarios/[id]/grupo.ts", _page32],
    ["src/pages/login.astro", _page33],
    ["src/pages/marca/[slug].astro", _page34],
    ["src/pages/marcas.astro", _page35],
    ["src/pages/pago/ko.astro", _page36],
    ["src/pages/pago/ok.astro", _page37],
    ["src/pages/politica-cookies.astro", _page38],
    ["src/pages/politica-privacidad.astro", _page39],
    ["src/pages/products-api.ts", _page40],
    ["src/pages/registro.astro", _page41],
    ["src/pages/search/suggest.ts", _page42],
    ["src/pages/sitemap-dynamic.xml.ts", _page43],
    ["src/pages/index.astro", _page44]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/dist/client/",
    "server": "file:///C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
