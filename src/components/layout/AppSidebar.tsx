import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  FolderKanban,
  FileText,
  ShieldCheck,
  Building2,
  ShoppingCart,
  Receipt,
  Truck,
  BookOpen,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  RefreshCw,
  Crown,
  Wallet,
  Briefcase,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useIsSuperAdmin } from "@/hooks/use-super-admin";
import { useRecordatoriosBadge } from "@/hooks/use-deportistas";
import ceoIsotipo from "@/assets/ceo-isotipo.png";

type NavItem = { to: string; icon: any; label: string };
type NavGroup = { id: string; label: string; icon: any; items: NavItem[] };

const ALL_GROUPS: NavGroup[] = [
  {
    id: "finanzas",
    label: "Finanzas",
    icon: Wallet,
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/transacciones", icon: ArrowLeftRight, label: "Transacciones" },
      { to: "/cuotas", icon: Receipt, label: "Cuotas" },
      { to: "/compras", icon: ShoppingCart, label: "Compras" },
    ],
  },
  {
    id: "personas",
    label: "Personas",
    icon: Users,
    items: [
      { to: "/personas", icon: Users, label: "Personas" },
      { to: "/staff", icon: ShieldCheck, label: "Staff" },
      { to: "/deportistas", icon: Dumbbell, label: "Deportistas" },
    ],
  },
  {
    id: "gestion",
    label: "Gestión",
    icon: Briefcase,
    items: [
      { to: "/proyectos", icon: FolderKanban, label: "Proyectos" },
      { to: "/documentos", icon: FileText, label: "Documentos" },
      { to: "/proveedores", icon: Truck, label: "Proveedores" },
      { to: "/asambleas", icon: BookOpen, label: "Asambleas" },
    ],
  },
  {
    id: "club",
    label: "Club",
    icon: Settings,
    items: [{ to: "/organizacion", icon: Building2, label: "Organización" }],
  },
];

const STAFF_ALLOWED = new Set([
  "/", "/personas", "/staff", "/deportistas",
  "/proyectos", "/documentos", "/asambleas", "/organizacion",
]);

const STORAGE_KEY = "sidebar_groups_open";

interface AppSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { clubActual, clubs, signOut, rolSistema } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const { count: recordatoriosCount } = useRecordatoriosBadge();

  const role = (rolSistema || "viewer").toLowerCase();
  const isAdmin = role === "admin" || role === "owner";
  const isStaff = role === "staff" || role === "coach";

  const groups: NavGroup[] = (() => {
    if (isAdmin) return ALL_GROUPS;
    if (isStaff) {
      return ALL_GROUPS
        .map((g) => ({ ...g, items: g.items.filter((i) => STAFF_ALLOWED.has(i.to)) }))
        .filter((g) => g.items.length > 0);
    }
    return [
      {
        id: "finanzas",
        label: "Inicio",
        icon: LayoutDashboard,
        items: [{ to: "/", icon: LayoutDashboard, label: "Dashboard" }],
      },
    ];
  })();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { finanzas: true, personas: true, gestion: true, club: true };
  });

  useEffect(() => {
    const activeGroup = groups.find((g) => g.items.some((i) => i.to === location.pathname));
    if (activeGroup && !openGroups[activeGroup.id]) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.id]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Cerrar drawer móvil al cambiar de ruta
  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
    } catch {}
  }, [openGroups]);

  const toggleGroup = (id: string) => setOpenGroups((p) => ({ ...p, [id]: !p[id] }));

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.to;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
          collapsed && "md:justify-center",
          isActive
            ? "bg-sidebar-accent text-white"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  };

  // En móvil ignoramos collapsed: siempre se ve completo dentro del drawer
  const showLabels = mobileOpen || !collapsed;

  return (
    <>
      {/* Overlay móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: collapsed && !mobileOpen ? 72 : 260,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col bg-sidebar border-r border-sidebar-border",
          // Móvil: visible solo si mobileOpen, slide desde la izquierda
          "transition-transform md:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <img src={ceoIsotipo} alt="CEO Sports" className="w-9 h-9 shrink-0 object-contain" />
          {showLabels && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden min-w-0 flex-1">
              <h1 className="text-white font-bold text-sm leading-tight tracking-tight truncate">{clubActual?.nombre || "CEO Sports"}</h1>
              <p className="text-sidebar-foreground text-[10px] leading-tight tracking-wide uppercase truncate">{clubActual?.deporte || "Gestión Deportiva"}</p>
            </motion.div>
          )}
          {/* Cerrar en móvil */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-2 overflow-y-auto">
          {groups.map((group) => {
            const isOpen = !showLabels ? true : !!openGroups[group.id];
            const hasActive = group.items.some((i) => i.to === location.pathname);
            return (
              <div key={group.id}>
                {showLabels && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-semibold transition-colors",
                      hasActive ? "text-white" : "text-sidebar-foreground/70 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <group.icon className="w-3.5 h-3.5" />
                      {group.label}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !isOpen && "-rotate-90")} />
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className={cn("space-y-0.5", showLabels && "pl-1 pt-0.5")}>
                        {group.items.map(renderItem)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {isSuperAdmin && (
            <>
              <div className="h-px bg-sidebar-border my-2" />
              <NavLink
                to="/super-admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  !showLabels && "justify-center",
                  location.pathname === "/super-admin"
                    ? "bg-warning/20 text-warning-foreground"
                    : "text-warning-foreground/80 hover:bg-warning/10"
                )}
              >
                <Crown className="w-5 h-5 shrink-0" />
                {showLabels && <span>Super Admin</span>}
              </NavLink>
            </>
          )}
        </nav>

        <div className="px-2 pb-2 space-y-1">
          {clubs.length > 1 && (
            <button
              onClick={() => { localStorage.removeItem("club_id"); window.location.reload(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              {showLabels && <span>Cambiar club</span>}
            </button>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {showLabels && <span>Cerrar sesión</span>}
          </button>
          {/* Toggle colapsar solo en desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-colors items-center justify-center"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
