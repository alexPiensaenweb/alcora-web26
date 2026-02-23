/**
 * Zod schemas for API request validation
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
  turnstileToken: z.string().min(1, "Token de seguridad requerido"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener mayúscula")
    .regex(/[a-z]/, "Debe tener minúscula")
    .regex(/[0-9]/, "Debe tener número"),
  first_name: z.string().min(1, "Nombre requerido").max(100),
  last_name: z.string().min(1, "Apellidos requeridos").max(100),
  tipo_usuario: z.enum(["particular", "empresa"]).default("empresa"),
  // B2B fields (optional here, validated conditionally in endpoint)
  razon_social: z.string().max(200).optional(),
  cif_nif: z
    .string()
    .regex(/^[A-Za-z]\d{7,8}[A-Za-z0-9]?$|^\d{8}[A-Za-z]$/, "CIF/NIF inválido")
    .optional(),
  telefono: z.string().max(20).optional(),
  cargo: z.string().max(100).optional(),
  tipo_negocio: z.string().max(100).optional(),
  numero_roesb: z.string().max(50).optional(),
  direccion_facturacion: z.string().max(500).optional(),
  ciudad: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  codigo_postal: z.string().regex(/^\d{5}$/, "Código postal inválido").optional(),
  acepta_proteccion_datos: z.literal(true, {
    errorMap: () => ({ message: "Debe aceptar la política de protección de datos" }),
  }),
  acepta_comunicaciones: z.boolean().optional(),
  turnstileToken: z.string().min(1, "Token de seguridad requerido"),
});

export const profileUpdateSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  direccion_facturacion: z.string().max(500).optional(),
  direccion_envio: z.string().max(500).optional(),
});

export const pedidoSubmitSchema = z.object({
  items: z
    .array(
      z.object({
        productoId: z.string(),
        cantidad: z.number().int().min(1).max(10000),
      })
    )
    .min(1, "Carrito vacío")
    .max(100, "Máximo 100 productos"),
  direccion_envio: z.string().max(500).optional(),
  direccion_facturacion: z.string().max(500).optional(),
  metodo_pago: z.enum(["transferencia", "pendiente", "tarjeta", "bizum"]),
  notas_cliente: z.string().max(1000).optional(),
});

export const productoCreateSchema = z.object({
  sku: z.string().min(1, "SKU requerido").max(50),
  nombre: z.string().min(1, "Nombre requerido").max(200),
  slug: z.string().max(200).optional(),
  precio_base: z.number().positive("Precio debe ser positivo"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  stock: z.number().int().min(-1).default(-1),
  extracto: z.string().max(500).optional(),
  descripcion: z.string().optional(),
  formato: z.string().max(100).optional(),
  unidad_venta: z.string().max(50).optional(),
  marca: z.number().optional(),
  categoria: z.number().optional(),
  marca_id: z.number().optional(),
  imagen_principal: z.string().optional(),
  ficha_tecnica: z.string().optional(),
  ficha_seguridad: z.string().optional(),
});

export const usuarioEstadoSchema = z.object({
  status: z.enum(["active", "suspended", "invited", "draft"]),
  sendEmail: z.boolean().optional(),
});

export const usuarioGrupoSchema = z.object({
  grupo_cliente: z.enum(["distribuidor", "empresa", "hospital", "particular", ""]),
});

export const pedidoEstadoSchema = z.object({
  estado: z.enum([
    "solicitado",
    "presupuesto_solicitado",
    "aprobado_pendiente_pago",
    "pagado",
    "enviado",
    "cancelado",
  ]),
});

export const pedidoNotasSchema = z.object({
  notas: z.string().max(2000).optional(),
});

/**
 * Validates and parses input against a schema
 * Returns null if valid, error message if invalid
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  const message = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "Datos inválidos";
  return { valid: false, error: message };
}
