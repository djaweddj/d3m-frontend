import { Outlet } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { StudentProvider } from "./StudentContext";
import StudentSidebar from "./StudentSidebar";
import StudentTabBar from "./StudentTabBar";
import StudentTopbar from "./StudentTopbar";

export default function StudentLayout() {
  const { dir } = useLanguage();
  return (
    <StudentProvider>
      <div dir={dir} className="flex h-screen overflow-hidden bg-canvas">
        <StudentSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <StudentTopbar />
          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 sm:px-8 md:pb-8">
            <Outlet />
          </main>
        </div>
        <StudentTabBar />
      </div>
    </StudentProvider>
  );
}
