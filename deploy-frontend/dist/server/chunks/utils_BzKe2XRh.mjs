function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}
function estadoLabel(estado) {
  const labels = {
    solicitado: "Solicitado",
    presupuesto_solicitado: "Presupuesto solicitado",
    aprobado_pendiente_pago: "Aprobado - Pendiente de pago",
    pagado: "Pagado",
    enviado: "Enviado",
    cancelado: "Cancelado"
  };
  return labels[estado] || estado;
}
function estadoColor(estado) {
  const colors = {
    solicitado: "bg-yellow-100 text-yellow-800",
    presupuesto_solicitado: "bg-amber-100 text-amber-800",
    aprobado_pendiente_pago: "bg-blue-100 text-blue-800",
    pagado: "bg-green-100 text-green-800",
    enviado: "bg-green-200 text-green-900",
    cancelado: "bg-red-100 text-red-800"
  };
  return colors[estado] || "bg-gray-100 text-gray-800";
}
const SMALL_WORDS = /* @__PURE__ */ new Set([
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
  "a"
]);
function formatCategoryName(name) {
  const clean = name.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.toLowerCase().split(" ").map((word, index) => {
    if (word === "epis") return "EPIs";
    if (SMALL_WORDS.has(word) && index > 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  return words.join(" ");
}

export { formatDate as a, estadoLabel as b, estadoColor as e, formatCategoryName as f };
