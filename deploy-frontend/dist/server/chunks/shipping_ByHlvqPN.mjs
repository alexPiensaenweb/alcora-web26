const SHIPPING_COST = 15;
const FREE_SHIPPING_THRESHOLD = 500;
function calculateShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export { FREE_SHIPPING_THRESHOLD as F, calculateShipping as c };
