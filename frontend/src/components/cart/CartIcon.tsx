import { useStore } from "@nanostores/react";
import { $cartCount } from "../../stores/cart";

export default function CartIcon() {
  const count = useStore($cartCount);

  return (
    <a
      href="/carrito"
      className="relative flex items-center gap-1 text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-action)] transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
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
