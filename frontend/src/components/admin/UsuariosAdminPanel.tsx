import { useState } from "react";

interface Usuario {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  last_access: string | null;
  grupo_cliente: string | null;
  razon_social: string | null;
  cif_nif: string | null;
  telefono: string | null;
  tipo_negocio: string | null;
  ciudad: string | null;
  provincia: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  suspended: "Pendiente",
  invited: "Invitado",
  draft: "Borrador",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-orange-100 text-orange-800",
  invited: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-700",
};

const GRUPOS: Record<string, string> = {
  distribuidor: "Distribuidor",
  empresa: "Empresa",
  hospital: "Hospital/Clínica",
  particular: "Particular",
};

const FILTER_TABS = [
  { value: "", label: "Todos" },
  { value: "suspended", label: "Pendientes" },
  { value: "active", label: "Activos" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

interface Props {
  usuariosInitial: Usuario[];
  estadoFilterInitial: string;
  emailFilterInitial: string;
  total: number;
  page: number;
  totalPages: number;
}

export default function UsuariosAdminPanel({
  usuariosInitial,
  estadoFilterInitial,
  emailFilterInitial,
  total,
  page,
  totalPages,
}: Props) {
  const [usuarios, setUsuarios] = useState(usuariosInitial);
  const [estadoFilter, setEstadoFilter] = useState(estadoFilterInitial);
  const [emailFilter, setEmailFilter] = useState(emailFilterInitial);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: "activate" | "suspend";
    userName: string;
  } | null>(null);

  function showMsg(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  function goToFilter(status: string) {
    const params = new URLSearchParams();
    if (status) params.set("estado", status);
    if (emailFilter) params.set("email", emailFilter);
    window.location.href = `/gestion/usuarios?${params.toString()}`;
  }

  function goToSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (estadoFilter) params.set("estado", estadoFilter);
    if (emailFilter) params.set("email", emailFilter);
    window.location.href = `/gestion/usuarios?${params.toString()}`;
  }

  async function cambiarEstado(userId: string, nuevoStatus: string, sendEmail: boolean = false) {
    setLoadingId(userId);
    setConfirmAction(null);
    try {
      const res = await fetch(`/gestion-api/usuarios/${userId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevoStatus, sendEmail }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error");
      }
      const data = await res.json();

      // Actualizar en lista
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nuevoStatus } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, status: nuevoStatus } : null);
      }

      if (nuevoStatus === "active") {
        showMsg("ok", data.emailSent
          ? "Usuario activado y email de notificación enviado"
          : "Usuario activado"
        );
      } else if (nuevoStatus === "suspended") {
        showMsg("ok", "Usuario suspendido");
      } else {
        showMsg("ok", "Estado actualizado");
      }
    } catch (err: any) {
      showMsg("err", err.message || "Error al cambiar estado");
    } finally {
      setLoadingId(null);
    }
  }

  async function cambiarGrupo(userId: string, nuevoGrupo: string) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/gestion-api/usuarios/${userId}/grupo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupo_cliente: nuevoGrupo }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error");
      }
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, grupo_cliente: nuevoGrupo } : u))
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, grupo_cliente: nuevoGrupo } : null);
      }
      showMsg("ok", "Grupo actualizado");
    } catch (err: any) {
      showMsg("err", err.message || "Error al cambiar grupo");
    } finally {
      setLoadingId(null);
    }
  }

  const nombreUsuario = (u: Usuario) =>
    u.razon_social || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;

  // Count pending users in current list
  const pendingCount = usuarios.filter((u) => u.status === "suspended").length;

  return (
    <div className="space-y-5">
      {/* Feedback */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          msg.type === "ok"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <span className="material-icons text-base">{msg.type === "ok" ? "check_circle" : "error"}</span>
          {msg.text}
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            {confirmAction.action === "activate" ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-icons text-green-600">how_to_reg</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy">Activar usuario</h3>
                </div>
                <p className="text-sm text-text-muted mb-1">
                  Se activará la cuenta de <strong className="text-navy">{confirmAction.userName}</strong>.
                </p>
                <p className="text-sm text-text-muted mb-6">
                  Se enviará un email notificándole que su cuenta está activa y puede acceder a la tienda.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-light transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => cambiarEstado(confirmAction.userId, "active", true)}
                    disabled={loadingId === confirmAction.userId}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-icons text-base">mail</span>
                    {loadingId === confirmAction.userId ? "Activando..." : "Activar y notificar"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="material-icons text-orange-600">person_off</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy">Suspender usuario</h3>
                </div>
                <p className="text-sm text-text-muted mb-6">
                  Se suspenderá la cuenta de <strong className="text-navy">{confirmAction.userName}</strong>.
                  El usuario no podrá acceder a la tienda hasta que vuelva a ser activado.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-light transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => cambiarEstado(confirmAction.userId, "suspended")}
                    disabled={loadingId === confirmAction.userId}
                    className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loadingId === confirmAction.userId ? "Suspendiendo..." : "Suspender"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((f) => (
            <button
              key={f.value}
              onClick={() => goToFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                estadoFilter === f.value
                  ? "bg-action text-white border-action"
                  : "bg-white text-navy border-border hover:border-action"
              }`}
            >
              {f.label}
              {f.value === "suspended" && pendingCount > 0 && estadoFilter !== "suspended" && (
                <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <form onSubmit={goToSearch} className="flex gap-2">
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-action w-56"
          />
          <button type="submit" className="px-3 py-1.5 bg-action text-white text-sm rounded-lg hover:bg-action-hover transition-colors">
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* User list */}
        <div className="flex-1 bg-white border border-border rounded-xl overflow-hidden">
          {usuarios.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-light text-xs text-text-muted uppercase tracking-wide border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold">Usuario</th>
                      <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Empresa / CIF</th>
                      <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Estado</th>
                      <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Grupo</th>
                      <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Últ. acceso</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usuarios.map((u) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-bg-light transition-colors cursor-pointer ${
                          selectedUser?.id === u.id ? "bg-bg-accent" : ""
                        }`}
                        onClick={() => setSelectedUser(u)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-navy">{nombreUsuario(u)}</div>
                          <div className="text-xs text-text-muted">{u.email}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-navy">{u.razon_social || "—"}</div>
                          <div className="text-xs text-text-muted">{u.cif_nif || ""}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[u.status] || u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-text-muted text-xs capitalize">
                          {GRUPOS[u.grupo_cliente || ""] || u.grupo_cliente || "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-text-muted text-xs whitespace-nowrap">
                          {u.last_access ? formatDate(u.last_access) : "Nunca"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.status === "suspended" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ userId: u.id, action: "activate", userName: nombreUsuario(u) });
                              }}
                              disabled={loadingId === u.id}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium inline-flex items-center gap-1.5"
                            >
                              <span className="material-icons text-sm">mail</span>
                              {loadingId === u.id ? "..." : "Activar y notificar"}
                            </button>
                          )}
                          {u.status === "active" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ userId: u.id, action: "suspend", userName: nombreUsuario(u) });
                              }}
                              disabled={loadingId === u.id}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
                            >
                              {loadingId === u.id ? "..." : "Suspender"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-light">
                  <p className="text-xs text-text-muted">Página {page} de {totalPages} · {total} usuarios</p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a href={`/gestion/usuarios?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page - 1}`}
                         data-astro-reload
                         className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors">
                        ← Anterior
                      </a>
                    )}
                    {page < totalPages && (
                      <a href={`/gestion/usuarios?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page + 1}`}
                         data-astro-reload
                         className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors">
                        Siguiente →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-text-muted">
              <span className="material-icons text-4xl opacity-30 mb-3 block">group</span>
              <p>No hay usuarios con este filtro</p>
            </div>
          )}
        </div>

        {/* User detail panel */}
        {selectedUser && (
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white border border-border rounded-xl sticky top-4">
              {/* Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-navy">Detalle usuario</h3>
                  <button onClick={() => setSelectedUser(null)} className="text-text-muted hover:text-navy">
                    <span className="material-icons text-lg">close</span>
                  </button>
                </div>
                <p className="font-semibold text-navy text-base">{nombreUsuario(selectedUser)}</p>
                <a href={`mailto:${selectedUser.email}`} className="text-action hover:underline text-xs">{selectedUser.email}</a>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedUser.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[selectedUser.status] || selectedUser.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 border-b border-border space-y-2 text-sm">
                {selectedUser.razon_social && (
                  <div className="flex justify-between">
                    <span className="text-text-muted text-xs">Empresa</span>
                    <span className="font-medium text-right">{selectedUser.razon_social}</span>
                  </div>
                )}
                {selectedUser.cif_nif && (
                  <div className="flex justify-between">
                    <span className="text-text-muted text-xs">CIF/NIF</span>
                    <span className="font-medium">{selectedUser.cif_nif}</span>
                  </div>
                )}
                {selectedUser.telefono && (
                  <div className="flex justify-between">
                    <span className="text-text-muted text-xs">Teléfono</span>
                    <a href={`tel:${selectedUser.telefono}`} className="text-navy hover:text-action">{selectedUser.telefono}</a>
                  </div>
                )}
                {selectedUser.tipo_negocio && (
                  <div className="flex justify-between">
                    <span className="text-text-muted text-xs">Tipo negocio</span>
                    <span>{selectedUser.tipo_negocio}</span>
                  </div>
                )}
                {(selectedUser.ciudad || selectedUser.provincia) && (
                  <div className="flex justify-between">
                    <span className="text-text-muted text-xs">Ubicación</span>
                    <span>{[selectedUser.ciudad, selectedUser.provincia].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs">Últ. acceso</span>
                  <span>{selectedUser.last_access ? formatDate(selectedUser.last_access) : "Nunca"}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 space-y-4">
                {/* Grupo cliente */}
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Grupo cliente</p>
                  <select
                    value={selectedUser.grupo_cliente || ""}
                    onChange={(e) => cambiarGrupo(selectedUser.id, e.target.value)}
                    disabled={loadingId === selectedUser.id}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action disabled:opacity-50"
                  >
                    <option value="">Sin grupo</option>
                    {Object.entries(GRUPOS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Estado actions */}
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Estado de cuenta</p>
                  {selectedUser.status === "suspended" && (
                    <button
                      onClick={() => setConfirmAction({ userId: selectedUser.id, action: "activate", userName: nombreUsuario(selectedUser) })}
                      disabled={loadingId === selectedUser.id}
                      className="w-full px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-icons text-base">mail</span>
                      Activar y enviar email
                    </button>
                  )}
                  {selectedUser.status === "active" && (
                    <button
                      onClick={() => setConfirmAction({ userId: selectedUser.id, action: "suspend", userName: nombreUsuario(selectedUser) })}
                      disabled={loadingId === selectedUser.id}
                      className="w-full px-3 py-2.5 bg-white text-orange-700 border border-orange-300 rounded-lg text-sm font-medium hover:bg-orange-50 disabled:opacity-50 transition-colors"
                    >
                      Suspender cuenta
                    </button>
                  )}
                </div>

                {loadingId === selectedUser.id && (
                  <p className="text-xs text-text-muted text-center">Guardando...</p>
                )}

                {/* Ver pedidos */}
                <div className="pt-2 border-t border-border">
                  <a
                    href={`/gestion/pedidos?email=${encodeURIComponent(selectedUser.email)}`}
                    data-astro-reload
                    className="flex items-center gap-2 text-sm text-action hover:underline"
                  >
                    <span className="material-icons text-base">shopping_bag</span>
                    Ver pedidos de este usuario
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
