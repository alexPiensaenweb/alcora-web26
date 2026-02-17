import { useStore } from "@nanostores/react";
import { $cartCount } from "../../stores/cart";

export default function CartIcon() {
  const count = useStore($cartCount);

  return (
    <a
      href="/carrito"
      className="relative flex items-center gap-1 text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-action)] transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-action)] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </a>
  );
}
