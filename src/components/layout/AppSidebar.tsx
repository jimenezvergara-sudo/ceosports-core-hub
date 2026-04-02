import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import ceoIsotipo from "@/assets/ceo-isotipo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/personas", icon: Users, label: "Personas" },
  { to: "/transacciones", icon: ArrowLeftRight, label: "Transacciones" },
  { to: "/proyectos", icon: FolderKanban, label: "Proyectos" },
  { to: "/documentos", icon: FileText, label: "Documentos" },
  { to: "/staff", icon: ShieldCheck, label: "Staff" },
  { to: "/organizacion", icon: Building2, label: "Organización" },
  { to: "/compras", icon: ShoppingCart, label: "Compras" },
  { to: "/proveedores", icon: Truck, label: "Proveedores" },
  { to: "/cuotas", icon: Receipt, label: "Cuotas" },
  { to: "/asambleas", icon: BookOpen, label: "Asambleas" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { clubActual, clubs, setClubActual, signOut } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen z-30 flex flex-col bg-sidebar border-r border-sidebar-border"
    >
      {/* Club header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img src={ceoIsotipo} alt="CEO Sports" className="w-9 h-9 shrink-0 object-contain" />
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight tracking-tight truncate">{clubActual?.nombre || "CEO Sports"}</h1>
            <p className="text-sidebar-foreground text-[10px] leading-tight tracking-wide uppercase truncate">{clubActual?.deporte || "Gestión Deportiva"}</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-2 pb-2 space-y-1">
        {clubs.length > 1 && (
          <button
            onClick={() => { localStorage.removeItem("club_id"); window.location.reload(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cambiar club</span>}
          </button>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-colors text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
