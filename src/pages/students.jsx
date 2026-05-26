import { useState } from "react";
import { Search, Plus, CheckCircle, XCircle } from "lucide-react";
import { STUDENTS } from "../data/Mockdata2";
import { useSchool } from "../context/SchoolContext";

export default function Students() {
  const { school } = useSchool();
  const p = school.primaryColor;
  const [search, setSearch] = useState("");

  const filtered = STUDENTS.filter(
    (s) =>
      s.name.includes(search) ||
      s.level.includes(search) ||
      s.subjects.some((sub) => sub.includes(search))
  );

  return (
    <div className="p-5" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            className="w-full pr-9 pl-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            placeholder="بحث عن تلميذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ background: p }}
        >
          <Plus className="w-4 h-4" />
          إضافة تلميذ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "إجمالي التلاميذ", value: STUDENTS.length },
          { label: "المدفوعة", value: STUDENTS.filter((s) => s.paid).length },
          { label: "المعلقة", value: STUDENTS.filter((s) => !s.paid).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="border-b border-gray-100 text-right">
              {["الاسم", "المستوى", "المواد", "رقم الهاتف", "الرسوم", "الحالة"].map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr
                key={s.id}
                className="hover:bg-gray-50 transition"
                style={{ borderBottom: i < filtered.length - 1 ? "0.5px solid #F8FAFC" : "none" }}
              >
                <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.level}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#EFF6FF", color: p }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500" dir="ltr">
                  {s.phone}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {s.fee.toLocaleString("ar-DZ")} دج
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: s.paid ? "#ECFDF5" : "#FEF9C3",
                      color: s.paid ? "#065F46" : "#854D0E",
                    }}
                  >
                    {s.paid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {s.paid ? "مدفوع" : "معلق"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">لا توجد نتائج</p>
        )}
      </div>
    </div>
  );
}