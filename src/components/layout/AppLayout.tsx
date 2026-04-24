import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import SofiaAssistant from "@/components/sofia/SofiaAssistant";
import RegistrarFAB from "@/components/shared/RegistrarFAB";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[260px] min-h-screen transition-all duration-300">
        <Outlet />
      </main>
      <SofiaAssistant />
      <RegistrarFAB />
    </div>
  );
}
