import { Outlet } from "react-router";
import Sidebar from "../components/sidebar";
import Topbar from "../components/Topbar";
import { SchoolProvider } from "../context/SchoolContext";

export default function DashboardLayout() {
  return (
    <SchoolProvider>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SchoolProvider>
  );
}