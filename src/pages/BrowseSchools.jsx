import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { mockSchools } from "../data/mockData";

function Badge({ children }) {
  return (
    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}

export default function BrowseSchools() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = mockSchools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      s.subjects.some((x) =>
        x.toLowerCase().includes(search.toLowerCase())
      )
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
            ابحث عن مدارس الدعم حسب المدينة أو المادة الدراسية
            وقارن بين التقييمات والأسعار بسهولة.
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
                placeholder="ابحث باسم المدرسة أو المادة أو المدينة..."
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
            <h2 className="text-2xl font-bold text-slate-900">
              المدارس المتوفرة
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              وجدنا {filtered.length} مدرسة
            </p>
          </div>
        </div>

        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-500">
              لا توجد نتائج مطابقة
            </p>

            <p className="mt-2 text-sm text-slate-400">
              جرّب البحث باسم آخر أو مدينة مختلفة
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
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={school.image}
                    alt={school.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-md">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {school.rating}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-2 text-xl font-bold text-slate-900">
                    {school.name}
                  </h3>

                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {school.location}
                  </div>

                  {/* Subjects */}
                  <div className="mb-5 flex flex-wrap gap-2">
                    {school.subjects.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        السعر الشهري
                      </p>

                      <p className="text-lg font-extrabold text-blue-600">
                        {school.price} دج
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/schools/${school.id}`)
                      }
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