# B2B Smoke Test Checklist

Manual regression checklist for verifying all critical B2B flows remain functional.
Run this checklist after any infrastructure or security changes that may affect B2B behavior.

---

## Prerequisites

- [ ] Dev server running (`docker-compose up` + `npm run dev` in `frontend/`)
- [ ] Directus accessible at configured URL
- [ ] Active B2B user account with known credentials (email/password)
- [ ] At least one product with B2B pricing configured in Directus

---

## 1. Authentication

- [ ] Navigate to `/login`
- [ ] Enter valid B2B credentials (email + password)
- [ ] Click "Iniciar sesion"
- [ ] Verify redirect to `/catalogo`
- [ ] Verify user name appears in header (top-right area)
- [ ] Verify no console errors related to auth

## 2. Catalog (Logged In)

- [ ] Products load on `/catalogo` with prices visible
- [ ] Scroll down -- infinite scroll loads more products
- [ ] Click a product card -- navigate to product detail page
- [ ] Verify product detail shows tarifa price (user-specific or group discount)
- [ ] Verify "Anadir al carrito" button is visible and enabled

## 3. Cart Operations

- [ ] From product detail, click "Anadir al carrito"
- [ ] Verify cart badge in header shows correct count (e.g., "1")
- [ ] Navigate to `/carrito`
- [ ] Verify product appears with correct name, price, quantity
- [ ] Change quantity using +/- controls -- verify subtotal updates
- [ ] Click remove (X) on an item -- verify item disappears and badge updates
- [ ] Add a product again for checkout testing

## 4. Checkout - Confirmar Pedido (sin pago)

- [ ] Navigate to `/checkout`
- [ ] Verify delivery address is pre-filled from user profile
- [ ] Verify billing address is pre-filled from user profile
- [ ] Verify order summary shows correct items and totals
- [ ] Select "Transferencia bancaria" as payment method
- [ ] Click "Confirmar pedido"
- [ ] Verify success page displays with pedido ID
- [ ] Navigate to `/cuenta/pedidos`
- [ ] Verify the new order appears in the list with correct status

## 5. Checkout - Solicitar Presupuesto

- [ ] Add items to cart (if cart is empty)
- [ ] Click "Solicitar presupuesto" button
- [ ] Verify presupuesto confirmation/success message
- [ ] Verify presupuesto appears in user account area (if applicable)

## 6. Logout and Cart Clearing

- [ ] With items in the cart, note the cart badge count
- [ ] Click "Cerrar sesion" in the user menu
- [ ] Verify redirect to `/login`
- [ ] Verify cart badge shows 0 (or is hidden)
- [ ] Open browser DevTools > Application > Local Storage
- [ ] Verify `alcora-cart` key is either absent or contains `[]`

## 7. Prices Hidden for Anonymous Users

- [ ] Open an incognito/private browser window
- [ ] Navigate to `/catalogo`
- [ ] Verify products load but prices are NOT visible
- [ ] Click on a product to view detail
- [ ] Verify product detail does NOT show any price
- [ ] Verify a prompt to log in or register is shown (or prices are simply absent)

---

## Results

| Section | Pass/Fail | Notes |
|---------|-----------|-------|
| 1. Authentication | | |
| 2. Catalog | | |
| 3. Cart Operations | | |
| 4. Checkout Pedido | | |
| 5. Presupuesto | | |
| 6. Logout + Cart Clear | | |
| 7. Prices Hidden | | |

**Tested by:** _______________
**Date:** _______________
**Environment:** _______________
