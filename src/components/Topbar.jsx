import { Bell, Settings } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLocation } from "react-router";

const PAGE_TITLES = {
  "/dashboard": "لوحة التحكم",
  "/students": "تلاميذنا",
  "/teachers": "أساتذتنا",
  "/schedule": "جدول الحصص",
  "/settings": "تخصيص المدرسة",
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "لوحة التحكم";

  const school = user?.school;
  const primaryColor = school?.primaryColor ?? "#2563EB";

  return (
    <header
      className="flex items-center justify-between px-5 border-b border-gray-100 bg-white flex-shrink-0"
      style={{ height: 56 }}
      dir="rtl"
    >
      <h1
        className="text-base font-bold text-slate-800"
        style={{ fontFamily: "'Tajawal', sans-serif" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {school && (
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{
              backgroundColor: primaryColor + "1A", // 10% opacity
              color: primaryColor,
              borderColor: primaryColor + "40",     // 25% opacity
            }}
          >
            السنة الدراسية {school.academicYear}
          </span>
        )}
        <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
          <Bell className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}