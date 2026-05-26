import { useState } from "react";
import { Check, X, Mail, Phone, GraduationCap } from "lucide-react";

const initialRequests = [
  {
    id: 1,
    name: "أحمد بن علي",
    age: 16,
    level: "1AS",
    subject: "رياضيات",
    phone: "0550123456",
    email: "ahmed@gmail.com",
  },
  {
    id: 2,
    name: "سارة محمد",
    age: 15,
    level: "4AM",
    subject: "فيزياء",
    phone: "0661123456",
    email: "sara@gmail.com",
  },
];

export default function Requests() {
  const [requests, setRequests] = useState(initialRequests);

  const acceptStudent = (student) => {
    // Save to students list
    const existing =
      JSON.parse(localStorage.getItem("students")) || [];

    localStorage.setItem(
      "students",
      JSON.stringify([...existing, student])
    );

    // Remove from requests
    setRequests((prev) =>
      prev.filter((s) => s.id !== student.id)
    );
  };

  const refuseStudent = (id) => {
    setRequests((prev) =>
      prev.filter((s) => s.id !== id)
    );
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 p-6 font-sans"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          طلبات الانضمام
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          الطلاب الذين يريدون الانضمام إلى المدرسة
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-lg font-medium text-slate-500">
            لا توجد طلبات حالياً
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((student) => (
            <div
              key={student.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-xl"
            >
              {/* Top */}
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <GraduationCap className="h-7 w-7" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {student.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {student.level}
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">العمر</span>
                  <span className="font-semibold text-slate-800">
                    {student.age}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">المادة</span>
                  <span className="font-semibold text-slate-800">
                    {student.subject}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                  <Phone className="h-4 w-4 text-blue-500" />
                  {student.phone}
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                  <Mail className="h-4 w-4 text-blue-500" />
                  {student.email}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => acceptStudent(student)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  قبول
                </button>

                <button
                  onClick={() => refuseStudent(student.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-100 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-200"
                >
                  <X className="h-4 w-4" />
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}