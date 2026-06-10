import { useState, useRef } from "react";
import { Upload, School, Sun, Moon, Monitor, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const PRESETS = [
  "#2563EB", "#7C3AED", "#059669", "#DC2626",
  "#D97706", "#0891B2", "#BE185D", "#1E293B",
];

const LS_COLOR_KEY = "school_primary_color";
const LS_LOGO_KEY  = "school_logo_url";

export default function Settings() {
  const { user } = useAuth();
  const school = user?.school;

  const [color, setColor]           = useState(() => localStorage.getItem(LS_COLOR_KEY) ?? "#2563EB");
  const [previewLogo, setPreviewLogo] = useState(() => localStorage.getItem(LS_LOGO_KEY) ?? null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الملف يتجاوز 2 ميغابايت");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewLogo(url);
    toast.success("تم رفع الشعار");
  };

  const save = () => {
    localStorage.setItem(LS_COLOR_KEY, color);
    if (previewLogo) localStorage.setItem(LS_LOGO_KEY, previewLogo);
    toast.success("تم حفظ الإعدادات محلياً");
  };

  return (
    <div className="p-5" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >

        {/* ── School info (from API) ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-slate-800 mb-1">معلومات المدرسة</p>
          <p className="text-[12px] text-gray-400 mb-3">البيانات المسجلة على المنصة</p>

          <div className="space-y-2.5">
            {[
              { label: "اسم المدرسة",   value: school?.schoolName },
              { label: "البريد الإلكتروني", value: school?.email },
              { label: "الولاية",        value: school?.wilaya },
              { label: "حالة الاشتراك",  value: school?.subscriptionStatus },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">{label}</span>
                <span className="text-[13px] font-semibold text-slate-700">
                  {value ?? "—"}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-300 mt-4">
            لتعديل هذه البيانات، تواصل مع الدعم
          </p>
        </div>

        {/* ── Color picker (localStorage) ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-slate-800 mb-1">لون المدرسة الرئيسي</p>
          <p className="text-[12px] text-gray-400 mb-3">
            يُطبَّق على الشريط الجانبي والأزرار وعناصر التمييز
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((c) => (
              <button
                key={c}
                className="w-7 h-7 rounded-full border-2 transition"
                style={{
                  background: c,
                  borderColor: color === c ? "#1E293B" : "transparent",
                  outline: color === c ? "2px solid #fff" : "none",
                  outlineOffset: "1px",
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500">لون مخصص:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <span className="text-[11px] font-mono text-gray-400">{color}</span>
          </div>

          {/* Live preview */}
          <div
            className="mt-4 rounded-lg p-3 flex items-center gap-2"
            style={{ background: color }}
          >
            <School className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">
              {school?.schoolName ?? "اسم المدرسة"}
            </span>
          </div>
        </div>

        {/* ── Logo upload (localStorage) ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-slate-800 mb-1">شعار المدرسة</p>
          <p className="text-[12px] text-gray-400 mb-3">رفع صورة الشعار (PNG أو SVG)</p>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <Upload className="w-6 h-6 mx-auto text-gray-300 group-hover:text-blue-400 mb-1" />
            <p className="text-[12px] text-gray-400 group-hover:text-blue-500">اضغط لرفع الشعار</p>
            <p className="text-[10px] text-gray-300 mt-0.5">PNG · SVG · max 2MB</p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml"
            className="hidden"
            onChange={handleFile}
          />

          <p className="text-[12px] text-gray-400 mt-3 mb-1.5">معاينة:</p>
          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-gray-100">
            {previewLogo ? (
              <img src={previewLogo} alt="الشعار" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: color }}
              >
                <School className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-[13px] font-bold text-slate-800">
                {school?.schoolName ?? "اسم المدرسة"}
              </p>
              <p className="text-[11px] text-gray-400">معاينة في الشريط الجانبي</p>
            </div>
          </div>
        </div>

        {/* ── Theme mode (UI only) ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-slate-800 mb-1">نمط العرض</p>
          <p className="text-[12px] text-gray-400 mb-3">
            اختر نمط واجهة لوحة التحكم
          </p>
          <div className="space-y-2">
            {[
              { label: "فاتح",               icon: Sun },
              { label: "داكن",               icon: Moon },
              { label: "تلقائي (حسب الجهاز)", icon: Monitor },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 text-[13px] text-slate-700 hover:bg-gray-50 hover:border-gray-200 transition text-right"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      <div className="mt-5 flex justify-start">
        <button
          onClick={save}
          className="flex items-center gap-2 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition"
          style={{ background: color }}
        >
          <Save className="w-4 h-4" />
          حفظ جميع التغييرات
        </button>
      </div>
    </div>
  );
}