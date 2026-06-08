import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Building2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";

const STATUS_LABELS = {
  ACTIVE: { label: "نشط", color: "#0F6E56", bg: "#e6f4f1" },
  TRIAL: { label: "تجريبي", color: "#BA7517", bg: "#fdf3e3" },
  EXPIRED: { label: "منتهي", color: "#b91c1c", bg: "#fef2f2" },
  SUSPENDED: { label: "موقوف", color: "#6b7280", bg: "#f3f4f6" },
};

function Badge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: "#185FA5", bg: "#eff6ff" };
  return (
    <span
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}22` }}
      className="rounded-full px-3 py-1 text-xs font-semibold"
    >
      {s.label}
    </span>
  );
}

export default function BrowseSchools() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
     api
    .get("/api/schools")
    .then((res) => {
      console.log("DATA:", res.data);
      const data = Array.isArray(res.data) ? res.data : res.data.content ?? res.data.data ?? [];
      setSchools(data);})
      .catch((err) => {
        console.error(err);
        setError("تعذّر تحميل بيانات المدارس. تحقق من الاتصال بالخادم.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = schools.filter(
    (s) =>
      s.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
      s.wilaya?.toLowerCase().includes(search.toLowerCase()) ||
      s.commune?.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans"
    >
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-l from-blue-700 via-blue-600 to-sky-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-cyan-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 text-4xl font-extrabold text-white md:text-5xl"
          >
            اكتشف أفضل مدارس الدعم
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-blue-100 md:text-base"
          >
            ابحث عن مدارس الدعم حسب المدينة أو الولاية وقارن بين الأسعار بسهولة.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="mx-auto max-w-2xl"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المدرسة أو الولاية أو البلدية..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schools */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        {/* Top */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">المدارس المتوفرة</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "جارٍ التحميل..." : `وجدنا ${filtered.length} مدرسة`}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">لا توجد نتائج مطابقة</p>
            <p className="mt-2 text-sm text-slate-400">
              جرّب البحث باسم آخر أو ولاية مختلفة
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((school, index) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-2xl"
              >
                {/* Image placeholder */}
                <div
                  className="relative flex h-44 items-center justify-center overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #185FA5 0%, #0ea5e9 100%)",
                  }}
                >
                  <Building2 className="h-16 w-16 text-white/30" />
                  <div className="absolute right-4 top-4">
                    <Badge status={school.subscriptionStatus} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-1 text-xl font-bold text-slate-900">
                    {school.schoolName}
                  </h3>

                  <p className="mb-1 text-xs text-slate-400">
                    المالك: {school.ownerName}
                  </p>

                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {school.wilaya} - {school.commune}
                  </div>

                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>📧 {school.email}</span>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
                    <span>📞 {school.phone}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">السعر السنوي</p>
                      <p className="text-lg font-extrabold text-blue-600">
                        {school.yearlyPrice?.toLocaleString()} دج
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/schools/${school.id}`)}
                      className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}