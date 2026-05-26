import { useState, useRef } from "react";
import { Upload, School, Sun, Moon, Monitor, Save } from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import { toast } from "sonner";

const PRESETS = [
  "#2563EB", "#7C3AED", "#059669", "#DC2626",
  "#D97706", "#0891B2", "#BE185D", "#1E293B",
];

export default function Settings() {
  const { school, updateSchool } = useSchool();
  const [name, setName] = useState(school.name);
  const [color, setColor] = useState(school.primaryColor);
  const [previewLogo, setPreviewLogo] = useState(school.logoUrl);
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
    updateSchool({ logoUrl: url });
    toast.success("تم رفع الشعار");
  };

  const save = () => {
    updateSchool({ name, primaryColor: color, logoUrl: previewLogo });
    toast.success("تم حفظ الإعدادات");
  };

  return (
    <div className="p-5" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {/* Color picker */}
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
                onClick={() => { setColor(c); updateSchool({ primaryColor: c }); }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[12px] text-gray-500">لون مخصص:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); updateSchool({ primaryColor: e.target.value }); }}
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
            <span className="text-white text-sm font-bold">{name || school.name}</span>
          </div>
        </div>

        {/* Logo upload */}
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
              <p className="text-[13px] font-bold text-slate-800">{name || school.name}</p>
              <p className="text-[11px] text-gray-400">معاينة في الشريط الجانبي</p>
            </div>
          </div>
        </div>

        {/* School name */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-slate-800 mb-1">اسم المدرسة</p>
          <p className="text-[12px] text-gray-400 mb-3">
            يظهر في الشريط الجانبي ورسائل التسجيل
          </p>
          <input
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            style={{ fontFamily: "'Cairo', sans-serif" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المدرسة"
          />
        </div>

        {/* Theme mode */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-slate-800 mb-1">نمط العرض</p>
          <p className="text-[12px] text-gray-400 mb-3">
            اختر نمط واجهة لوحة التحكم
          </p>
          <div className="space-y-2">
            {[
              { label: "فاتح", icon: Sun },
              { label: "داكن", icon: Moon },
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

      {/* Save button */}
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