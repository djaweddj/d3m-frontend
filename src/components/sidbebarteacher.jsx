

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  UserCircle2,
  Building2,
  LogOut,
  Bell,
  Search,
  GraduationCap,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react";

export default function Sidebarteacher({ active = "dashboard", onChange }) {
  const navigate = useNavigate();
  const menuItems = [
    {
      id: "dashboard",
      title: "لوحة التحكم",
      icon: LayoutDashboard,
      color: "from-blue-500 to-cyan-500",
    },
    
    {
      id: "students",
      title: "تلاميذي",
      icon: Users,
      color: "from-violet-500 to-purple-500",
    },
    {
      id: "profile",
      title: "بروفايل شخصي",
      icon: UserCircle2,
      color: "from-emerald-500 to-green-500",
    },
    {
      id: "schools",
      title: "مدارس التي اعمل لديها",
      icon: Building2,
      color: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <aside className="w-80 border-l border-slate-200 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/40 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200">
            <GraduationCap className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              لوحة الأستاذ
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Teacher Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="بحث سريع..."
            className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-5 space-y-4 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => {
                onChange?.(item.id);

                if (item.id === "students") {
                  navigate("/mystudent");
                }
                if (item.id === "dashboard") {
                  navigate("/teacherdashboard");
                }
                 if (item.id === "profile") {
                  navigate("/teacherprofile");
                }

              }}
              className={`group w-full rounded-3xl border p-4 shadow-sm transition-all duration-300 text-right ${
                isActive
                  ? "border-blue-200 bg-blue-50/80 shadow-lg"
                  : "border-slate-100 bg-white hover:shadow-xl hover:border-blue-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      اضغط لعرض الصفحة
                    </p>
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-blue-50 transition">
                  <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Card */}
      <div className="p-5">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-2xl shadow-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold opacity-90">
                حساب الأستاذ
              </p>
              <h3 className="text-lg font-bold mt-1">
                مرحباً بك 👋
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Bell className="h-5 w-5" />
            </div>
          </div>

          <button className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-white/15 hover:bg-white/20 transition py-3 text-sm font-semibold backdrop-blur-sm border border-white/10">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </aside>
  );
}



