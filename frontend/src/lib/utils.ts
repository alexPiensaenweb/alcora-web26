/**
 * Utility functions
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function estadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    solicitado: "Solicitado",
    aprobado_pendiente_pago: "Aprobado - Pendiente de pago",
    pagado: "Pagado",
    enviado: "Enviado",
    cancelado: "Cancelado",
  };
  return labels[estado] || estado;
}

export function estadoColor(estado: string): string {
  const colors: Record<string, string> = {
    solicitado: "bg-yellow-100 text-yellow-800",
    aprobado_pendiente_pago: "bg-blue-100 text-blue-800",
    pagado: "bg-green-100 text-green-800",
    enviado: "bg-green-200 text-green-900",
    cancelado: "bg-red-100 text-red-800",
  };
  return colors[estado] || "bg-gray-100 text-gray-800";
}

const SMALL_WORDS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
  "o",
  "en",
  "para",
  "por",
  "con",
  "sin",
  "a",
]);

export function formatCategoryName(name: string): string {
  const clean = name.replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const words = clean
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (word === "epis") return "EPIs";
      if (SMALL_WORDS.has(word) && index > 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });

  return words.join(" ");
}
