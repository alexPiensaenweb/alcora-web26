function resolveDiscount(tarifas, productoId, categoriaId) {
  const productTarifa = tarifas.find(
    (t) => t.producto === productoId
  );
  if (productTarifa) return productTarifa.descuento_porcentaje;
  if (categoriaId) {
    const catTarifa = tarifas.find(
      (t) => t.categoria === categoriaId && t.producto === null
    );
    if (catTarifa) return catTarifa.descuento_porcentaje;
  }
  const globalTarifa = tarifas.find(
    (t) => t.producto === null && t.categoria === null
  );
  if (globalTarifa) return globalTarifa.descuento_porcentaje;
  return 0;
}
function calculatePrice(precioBase, descuentoPorcentaje) {
  const discount = Math.max(0, Math.min(100, descuentoPorcentaje));
  return Math.round(precioBase * (1 - discount / 100) * 100) / 100;
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}

export { calculatePrice as c, formatCurrency as f, resolveDiscount as r };
