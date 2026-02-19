import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $isLoggedIn, setUser, logout } from "../../stores/auth";
import type { DirectusUser } from "../../lib/types";

interface Props {
  user: DirectusUser;
}

export default function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUser(user);
  }, [user]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-navy hover:text-action transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="hidden sm:inline max-w-[120px] truncate">
          {user.first_name || user.email}
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-50 py-1">
            <div className="px-4 py-2 border-b border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-navy)]">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
              {user.grupo_cliente && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-bg-accent)] text-[var(--color-action)] text-xs rounded-full capitalize">
                  {user.grupo_cliente}
                </span>
              )}
            </div>
            {user.isAdmin ? (
              <a href="/gestion" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-action)] hover:bg-[var(--color-bg-accent)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel de gestión
              </a>
            ) : (
              <>
                <a href="/cuenta" className="block px-4 py-2 text-sm text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors">
                  Mi Cuenta
                </a>
                <a href="/cuenta/pedidos" className="block px-4 py-2 text-sm text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors">
                  Mis Pedidos
                </a>
              </>
            )}
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
