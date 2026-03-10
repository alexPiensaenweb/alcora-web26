import { useEffect, useRef, useState } from "react";

interface ArticleListItem {
  slug: string;
  titulo: string;
  extracto: string | null;
  imageUrl: string;
  categoria_blog: string | null;
  fecha_publicacion: string;
}

interface Props {
  apiUrl: string;
  initialItems: ArticleListItem[];
  initialPage: number;
  initialHasMore: boolean;
}

const categoryLabels: Record<string, string> = {
  guia: "Guia",
  consejo: "Consejo",
  producto: "Producto",
  noticia: "Noticia",
};

function formatArticleDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function InfiniteArticleGrid({
  apiUrl,
  initialItems,
  initialPage,
  initialHasMore,
}: Props) {
  const [items, setItems] = useState<ArticleListItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
          if (!res.ok) throw new Error(payload.error || "Error cargando mas articulos");

          const incoming = (payload.items || []) as ArticleListItem[];
          setItems((prev) => [...prev, ...incoming]);
          setPage(nextPage);
          setHasMore(Boolean(payload.meta?.hasMore));
        } catch (err: any) {
          setError(err.message || "No se pudieron cargar mas articulos");
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [apiUrl, page, hasMore, loading]);

  if (items.length === 0 && !hasMore) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <article
            key={item.slug}
            className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-card transition-shadow group"
          >
            <a href={`/blog/${item.slug}`} className="block">
              {/* Image */}
              <div className="aspect-[16/9] bg-bg-light overflow-hidden">
                {item.imageUrl && item.imageUrl !== "/placeholder.svg" ? (
                  <img
                    src={item.imageUrl}
                    alt={item.titulo}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Category badge + date */}
                <div className="flex items-center gap-2 mb-2">
                  {item.categoria_blog && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-action bg-bg-accent px-2 py-0.5 rounded">
                      {categoryLabels[item.categoria_blog] || item.categoria_blog}
                    </span>
                  )}
                  <time className="text-xs text-text-muted">
                    {formatArticleDate(item.fecha_publicacion)}
                  </time>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-navy line-clamp-2 mb-2 group-hover:text-action transition-colors">
                  {item.titulo}
                </h3>

                {/* Excerpt */}
                {item.extracto && (
                  <p className="text-xs text-text-muted line-clamp-3">{item.extracto}</p>
                )}
              </div>
            </a>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="h-10 mt-4 flex items-center justify-center">
        {loading && (
          <span className="text-sm text-text-muted">Cargando mas articulos...</span>
        )}
        {!loading && !hasMore && items.length > 0 && (
          <span className="text-xs text-text-muted">Ha llegado al final del listado</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center mt-2">{error}</p>
      )}
    </>
  );
}
