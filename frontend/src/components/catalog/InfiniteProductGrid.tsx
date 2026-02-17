import { useEffect, useMemo, useRef, useState } from "react";

interface ProductListItem {
  id: string | number;
  sku: string;
  nombre: string;
  slug: string;
  extracto: string | null;
  formato: string | null;
  imageUrl: string;
  price: number | null;
}

interface Props {
  apiUrl: string;
  initialItems: ProductListItem[];
  initialPage: number;
  initialHasMore: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function InfiniteProductGrid({
  apiUrl,
  initialItems,
  initialPage,
  initialHasMore,
}: Props) {
  const [items, setItems] = useState<ProductListItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const ids = useMemo(() => new Set(items.map((i) => `${i.id}`)), [items]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading) return;
        setLoading(true);
        setError("");
        try {
          const nextPage = page + 1;
          const joiner = apiUrl.includes("?") ? "&" : "?";
          const res = await fetch(`${apiUrl}${joiner}page=${nextPage}`, {
            credentials: "same-origin",
          });
          const payload = await res.json();
          if (!res.ok) throw new Error(payload.error || "Error cargando más productos");

          const incoming = (payload.items || []).filter(
            (item: ProductListItem) => !ids.has(`${item.id}`)
          );
          setItems((prev) => [...prev, ...incoming]);
          setPage(nextPage);
          setHasMore(Boolean(payload.meta?.hasMore));
        } catch (err: any) {
          setError(err.message || "No se pudieron cargar más productos");
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [apiUrl, page, hasMore, loading, ids]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <svg className="w-16 h-16 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm">No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((product) => (
          <article
            key={`${product.id}`}
            className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-card transition-shadow"
          >
            <a href={`/catalogo/${product.slug}`} className="block">
              <div className="aspect-square bg-white border-b border-border overflow-hidden p-4 flex items-center justify-center">
                <img
                  src={product.imageUrl}
                  alt={product.nombre}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-text-muted mb-1">{product.sku}</p>
                <h3 className="text-sm font-semibold text-navy line-clamp-2 mb-2">
                  {product.nombre}
                </h3>
                {product.extracto && (
                  <p className="text-xs text-text-muted line-clamp-2 mb-3">{product.extracto}</p>
                )}
                {product.formato && (
                  <p className="text-xs text-text-muted mb-2">{product.formato}</p>
                )}
                {product.price !== null ? (
                  <p className="text-lg font-bold text-action">{formatCurrency(product.price)}</p>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    <span className="text-action">Acceda</span> para ver precios
                  </p>
                )}
              </div>
            </a>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="h-10 mt-4 flex items-center justify-center">
        {loading && (
          <span className="text-sm text-text-muted">Cargando más productos...</span>
        )}
        {!loading && !hasMore && (
          <span className="text-xs text-text-muted">Ha llegado al final del listado</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center mt-2">{error}</p>
      )}
    </>
  );
}
