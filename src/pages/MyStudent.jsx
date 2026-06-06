import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Users,
  ChevronLeft,
  Search,
  UserCircle2,
} from "lucide-react";

const levelsData = [
  {
    level: "البكالوريا",
    groups: [
      {
        name: "المجموعة A",
        students: [
          "أحمد بوعلام",
          "سارة بن علي",
          "محمد أمين",
          "نور الهدى",
        ],
      },
      {
        name: "المجموعة B",
        students: [
          "يوسف حمدي",
          "ريان قادري",
          "إسلام بوزيد",
        ],
      },
      {
        name: "المجموعة C",
        students: [
          "عبد الرحمن",
          "إياد كمال",
          "إلياس تواتي",
        ],
      },
    ],
  },
  {
    level: "السنة الثانية ثانوي",
    groups: [
      {
        name: "المجموعة A",
        students: [
          "خالد بوشارب",
          "أنس زروقي",
          "أمين بن يوسف",
        ],
      },
      {
        name: "المجموعة B",
        students: [
          "إبراهيم لعربي",
          "رامي مسعود",
          "سيف الدين",
        ],
      },
    ],
  },
];

export default function MyStudents() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");

  return (
    <div
      dir="rtl"
      className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-100px] top-[-100px] h-[350px] w-[350px] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="absolute bottom-[-100px] left-[-100px] h-[320px] w-[320px] rounded-full bg-violet-100/50 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            👨‍🎓 إدارة التلاميذ
          </span>

          <h1 className="mb-4 text-5xl font-extrabold leading-tight text-slate-900">
            تلاميذي
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-slate-500">
            اختر المستوى الدراسي ثم المجموعة لعرض جميع التلاميذ المسجلين.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-10 max-w-md"
        >
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="ابحث عن تلميذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pr-12 pl-4 text-sm shadow-sm outline-none backdrop-blur-sm transition focus:border-blue-400 focus:bg-white"
          />
        </motion.div>

        {/* Levels */}
        <div className="space-y-10">
          {levelsData.map((levelItem, levelIndex) => (
            <motion.div
              key={levelItem.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: levelIndex * 0.1 }}
            >
              {/* Level Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200">
                  <GraduationCap className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {levelItem.level}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {levelItem.groups.length} مجموعات
                  </p>
                </div>
              </div>

              {/* Groups */}
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {levelItem.groups.map((group) => (
                  <motion.button
                    key={group.name}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => setSelectedGroup(group)}
                    className="group rounded-3xl border border-slate-100 bg-white/80 p-6 text-right shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-100 hover:shadow-2xl"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
                        <Users className="h-6 w-6" />
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition group-hover:bg-blue-50">
                        <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                      </div>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-slate-900 transition group-hover:text-blue-600">
                      {group.name}
                    </h3>

                    <p className="mb-5 text-sm text-slate-500">
                      عدد التلاميذ: {group.students.length}
                    </p>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{
                          width: `${group.students.length * 20}%`,
                        }}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">
                    {selectedGroup.name}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    قائمة التلاميذ المسجلين
                  </p>
                </div>

                <button
                  onClick={() => setSelectedGroup(null)}
                  className="h-11 w-11 rounded-2xl bg-slate-100 text-lg font-bold transition hover:bg-red-50 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              {/* Students */}
              <div className="grid gap-4 md:grid-cols-2">
                {selectedGroup.students
                  .filter((student) =>
                    student.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((student, index) => (
                    <motion.div
                      key={student}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-md"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 font-bold text-white shadow-lg shadow-blue-200">
                        {student
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {student}
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                          <UserCircle2 className="h-4 w-4" />
                          تلميذ مسجل
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}