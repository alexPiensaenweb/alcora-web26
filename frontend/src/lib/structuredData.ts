/**
 * Centralized JSON-LD structured data builder functions.
 * Provides typed builders for Product, Article, and BreadcrumbList schemas.
 */

import type { Producto, ArticuloBlog, Categoria } from "./types";

// ─── Input Interfaces ───

export interface ProductSchemaInput {
  product: Producto;
  siteUrl: string;
  finalPrice: number | null;
  isProfessional: boolean;
  marcaNombre: string | null;
  marcaUrl: string | null;
  categoria: Categoria | null;
  schemaImages: string[];
  plainDescription: string;
}

export interface ArticleSchemaInput {
  article: ArticuloBlog;
  siteUrl: string;
  imageUrl: string | null;
}

// ─── Builder Functions ───

/**
 * Build Product JSON-LD schema (schema.org/Product).
 * Includes conditional Offer with price (when logged in) or availability-only (when anonymous).
 * Non-professional users get priceSpecification with valueAddedTaxIncluded=true.
 */
export function buildProductSchema(input: ProductSchemaInput): Record<string, unknown> {
  const {
    product,
    siteUrl,
    finalPrice,
    isProfessional,
    marcaNombre,
    marcaUrl,
    categoria,
    schemaImages,
    plainDescription,
  } = input;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: product.extracto || plainDescription.slice(0, 500) || `${product.nombre} - producto profesional de salud ambiental`,
    sku: product.sku,
    mpn: product.sku,
    url: `${siteUrl}/catalogo/${product.slug}`,
    ...(schemaImages.length === 1 ? { image: schemaImages[0] } : {}),
    ...(schemaImages.length > 1 ? { image: schemaImages } : {}),
    ...(marcaNombre ? { brand: { "@type": "Brand", name: marcaNombre, ...(marcaUrl ? { url: marcaUrl } : {}) } } : {}),
    ...(categoria ? { category: categoria.nombre } : {}),
    ...(finalPrice !== null ? {
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: finalPrice.toString(),
        priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: `${siteUrl}/catalogo/${product.slug}`,
        seller: {
          "@type": "Organization",
          name: "Alcora Salud Ambiental",
          url: siteUrl,
        },
        ...(!isProfessional ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: finalPrice.toString(),
            priceCurrency: "EUR",
            valueAddedTaxIncluded: true,
          },
        } : {}),
      },
    } : {
      offers: {
        "@type": "Offer",
        availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: `${siteUrl}/catalogo/${product.slug}`,
        seller: {
          "@type": "Organization",
          name: "Alcora Salud Ambiental",
          url: siteUrl,
        },
      },
    }),
  };

  // Additional properties: formato, unidad_venta, fichas
  const additionalProperties: Record<string, unknown>[] = [];
  if (product.formato) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Formato",
      value: product.formato,
    });
  }
  if (product.unidad_venta) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Unidad de venta",
      value: product.unidad_venta,
    });
  }
  if (product.ficha_tecnica) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Ficha tecnica",
      value: "Disponible (PDF)",
    });
  }
  if (product.ficha_seguridad) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Ficha de seguridad",
      value: "Disponible (PDF)",
    });
  }
  if (additionalProperties.length > 0) {
    productSchema.additionalProperty = additionalProperties;
  }

  return productSchema;
}

/**
 * Build Article JSON-LD schema (schema.org/Article).
 * For blog posts following Google's Article structured data spec.
 */
export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const { article, siteUrl, imageUrl } = input;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.titulo,
    description: article.meta_description || article.extracto || "",
    datePublished: article.fecha_publicacion || article.date_created,
    ...(article.date_updated ? { dateModified: article.date_updated } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    author: {
      "@type": "Organization",
      name: "Alcora Salud Ambiental",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Alcora Salud Ambiental",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo-alcora.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${article.slug}`,
    },
  };

  return schema;
}

/**
 * Build BreadcrumbList JSON-LD schema (schema.org/BreadcrumbList).
 * Generic breadcrumb builder accepting an array of {name, url} items.
 * Position is indexed from 1.
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
