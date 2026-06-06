import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Sidebarteacher from "../components/sidbebarteacher";

export default function TeacherDashboard() {
  const stats = [
    { number: "12", title: "قسم نشط", emoji: "📚" },
    { number: "320+", title: "تلميذ", emoji: "👨‍🎓" },
    { number: "4", title: "مدارس", emoji: "🏫" },
  ];

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen overflow-hidden bg-[#fafafa] text-slate-900"
    >
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="absolute bottom-[-120px] left-[-120px] h-[380px] w-[380px] rounded-full bg-violet-100/50 blur-3xl" />
      </div>

      {/* Sidebar */}
   

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[32px] border border-slate-200 bg-white/80 p-10 shadow-xl shadow-slate-100 backdrop-blur-xl"
        >
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            ✨ لوحة تحكم حديثة
          </span>

          {/* Title */}
          <h1 className="mb-5 text-5xl font-extrabold leading-tight text-slate-900">
            مرحباً بك في
            <span className="text-blue-600"> لوحة الأستاذ </span>
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-2xl text-lg leading-8 text-slate-500">
            يمكنك إدارة الأقسام، متابعة التلاميذ، تعديل بروفايلك الشخصي،
            واستعراض المدارس التي تعمل لديها بسهولة.
          </p>

          {/* Stats Cards */}
          <div className="grid gap-5 md:grid-cols-3">
            {stats.map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6 transition-all hover:bg-white hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{item.emoji}</span>

                  <span className="text-3xl font-extrabold text-blue-600">
                    {item.number}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  {item.title}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}