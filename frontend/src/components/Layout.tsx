import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Factory,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import type { Modulo } from "../lib/types";

interface NavItem {
  to: string;
  label: string;
  modulo: Modulo;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { to: "/dashboard", label: "Dashboard", modulo: "dashboard", icon: LayoutDashboard },
      { to: "/pedidos", label: "Pedidos", modulo: "pedidos", icon: ClipboardList },
      { to: "/producao", label: "Produção", modulo: "producao", icon: Factory },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { to: "/clientes", label: "Clientes", modulo: "clientes", icon: Users },
      { to: "/produtos", label: "Produtos", modulo: "produtos", icon: Package },
    ],
  },
  {
    label: "Administração",
    items: [{ to: "/admin", label: "Configurações", modulo: "admin", icon: Settings }],
  },
];

export function Layout() {
  const { usuario, logout, temPermissao } = useAuth();

  return (
    <div className="flex min-h-screen bg-canvas text-text-primary">
      <aside className="flex w-64 flex-col border-r border-border-subtle bg-surface">
        <div className="px-5 py-6">
          <p className="text-base font-bold leading-tight text-text-primary">EL-PACK</p>
          <p className="text-xs text-text-secondary">Gestão de Pedidos</p>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          {NAV_GROUPS.map((group) => {
            const itemsVisiveis = group.items.filter((item) => temPermissao(item.modulo, "read"));
            if (itemsVisiveis.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {itemsVisiveis.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive ? "bg-brand-500 text-white" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                        )
                      }
                    >
                      <item.icon size={18} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border-subtle px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white">
              {usuario?.nome?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{usuario?.nome}</p>
              <p className="truncate text-xs text-text-secondary">{usuario?.perfil}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Sair"
              className="rounded-md p-2 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-canvas p-8">
        <Outlet />
      </main>
    </div>
  );
}
