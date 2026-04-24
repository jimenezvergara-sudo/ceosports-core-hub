import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import SofiaAssistant from "@/components/sofia/SofiaAssistant";
import RegistrarFAB from "@/components/shared/RegistrarFAB";
import GlobalSearch from "@/components/shared/GlobalSearch";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[260px] min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-end px-4 gap-2">
          <GlobalSearch />
        </header>
        <Outlet />
      </main>
      <SofiaAssistant />
      <RegistrarFAB />
    </div>
  );
}
