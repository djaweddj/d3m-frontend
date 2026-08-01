import { Outlet } from "react-router";
import Sidebar from "../components/sidebar";
import Topbar from "../components/Topbar";
import { SchoolProvider } from "../context/SchoolContext";

export default function DashboardLayout() {
  return (
    <SchoolProvider>
    <div
      className="flex h-screen bg-gray-50 overflow-hidden"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
    </SchoolProvider>
  );
}