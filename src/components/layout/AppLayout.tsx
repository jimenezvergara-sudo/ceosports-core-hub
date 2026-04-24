import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AppSidebar from "./AppSidebar";
import SofiaAssistant from "@/components/sofia/SofiaAssistant";
import RegistrarFAB from "@/components/shared/RegistrarFAB";
import GlobalSearch from "@/components/shared/GlobalSearch";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main className="md:ml-[260px] min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-4 gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted text-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <GlobalSearch />
        </header>
        <Outlet />
      </main>
      <SofiaAssistant />
      <RegistrarFAB />
    </div>
  );
}
