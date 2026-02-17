// ─── Directus Collections Types ───

export interface DirectusUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: "active" | "suspended" | "invited" | "draft";
  role: string;
  grupo_cliente: "distribuidor" | "empresa" | "hospital" | "particular" | null;
  razon_social: string | null;
  cif_nif: string | null;
  telefono: string | null;
  direccion_facturacion: string | null;
  direccion_envio: string | null;
}

export interface Categoria {
  id: number;
  status: "published" | "draft" | "archived";
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
  parent: number | Categoria | null;
  sort: number | null;
  subcategorias?: Categoria[];
  productos?: Producto[];
}

export interface Producto {
  id: string;
  status: "published" | "draft" | "archived";
  sku: string;
  nombre: string;
  slug: string;
  extracto: string | null;
  descripcion: string | null;
  precio_base: number;
  stock: number;
  imagen_principal: string | null;
  galeria: { directus_files_id: string }[] | null;
  ficha_tecnica: string | null;
  ficha_seguridad: string | null;
  categoria: number | Categoria | null;
  formato: string | null;
  unidad_venta: string | null;
}

export interface TarifaEspecial {
  id: number;
  grupo_cliente: "distribuidor" | "empresa" | "hospital" | "particular";
  descuento_porcentaje: number;
  producto: string | null;
  categoria: number | null;
}

export type EstadoPedido =
  | "solicitado"
  | "aprobado_pendiente_pago"
  | "pagado"
  | "enviado"
  | "cancelado";

export interface Pedido {
  id: number;
  estado: EstadoPedido;
  user_created: string | DirectusUser;
  date_created: string;
  notas_cliente: string | null;
  notas_admin: string | null;
  subtotal: number;
  costo_envio: number;
  total: number;
  metodo_pago: "transferencia" | "tarjeta" | null;
  referencia_pago: string | null;
  direccion_envio: string | null;
  direccion_facturacion: string | null;
  items: PedidoItem[];
}

export interface PedidoItem {
  id: number;
  pedido: number;
  producto: string | Producto | null;
  nombre_producto: string;
  sku: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// ─── Frontend Types ───

export interface CartItem {
  productoId: string;
  nombre: string;
  sku: string;
  slug: string;
  imagen: string | null;
  cantidad: number;
  precioUnitario: number;
  formato: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}
