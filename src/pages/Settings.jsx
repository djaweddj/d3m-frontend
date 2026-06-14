import { useState, useRef } from "react";
import { Upload, School, Sun, Moon, Monitor, Save } from "lucide-react";
import { useAuth } from "../context/authContext";
import { toast } from "sonner";

const PRESETS = [
  "#185FA5", "#2563EB", "#7C3AED", "#059669",
  "#DC2626", "#D97706", "#0891B2", "#BE185D",
];

const LS_COLOR_KEY = "school_primary_color";
const LS_LOGO_KEY  = "school_logo_url";

export default function Settings() {
  // useAuth gives: { user, school, logout }
  // school shape matches SchoolDto / SchoolResponseDto:
  //   schoolName, ownerName, email, phone, wilaya, commune,
  //   subscriptionStatus, subscriptionExpiresAt
  const { user, school } = useAuth();

  // Color + logo are UI-only preferences stored in localStorage
  // (backend has no endpoint for these yet)
  const [color, setColor] = useState(
    () => localStorage.getItem(LS_COLOR_KEY) ?? school?.primaryColor ?? "#185FA5"
  );
  const [previewLogo, setPreviewLogo] = useState(
    () => localStorage.getItem(LS_LOGO_KEY) ?? school?.logoUrl ?? null
  );
  const [theme,    setTheme]    = useState("light"); // UI-only
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
    toast.success("تم رفع الشعار مؤقتاً — احفظ لتثبيته");
  };

  const save = () => {
    localStorage.setItem(LS_COLOR_KEY, color);
    if (previewLogo) localStorage.setItem(LS_LOGO_KEY, previewLogo);
    toast.success("تم حفظ إعدادات العرض");
  };

  // Card shell
  const Card = ({ title, sub, children }) => (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EEF6", padding: "1.1rem" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 3px" }}>{title}</p>
      {sub && <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 14px" }}>{sub}</p>}
      {children}
    </div>
  );

  const schoolName = school?.schoolName ?? user?.fullName ?? "المدرسة";

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Page title */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>إعدادات المدرسة</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3, margin: 0 }}>
          معلومات المدرسة وتخصيص واجهة لوحة التحكم
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>

        {/* ── School info (read-only, from backend via useAuth) ── */}
        <Card title="معلومات المدرسة" sub="البيانات المسجلة على المنصة">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "اسم المدرسة",        value: school?.schoolName },
              { label: "المالك",             value: school?.ownerName ?? user?.fullName },
              { label: "البريد الإلكتروني",  value: school?.email ?? user?.email },
              { label: "الهاتف",             value: school?.phone },
              { label: "الولاية",            value: school?.wilaya },
              { label: "البلدية",            value: school?.commune },
              { label: "حالة الاشتراك",      value: school?.subscriptionStatus, highlight: true },
              { label: "انتهاء الاشتراك",    value: school?.subscriptionExpiresAt },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: highlight ? "#085041" : "#0F172A",
                  background: highlight ? "#E1F5EE" : "transparent",
                  padding: highlight ? "2px 8px" : 0,
                  borderRadius: highlight ? 20 : 0,
                  border: highlight ? "1px solid #5DCAA5" : "none",
                }}>
                  {value ?? "—"}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 14, marginBottom: 0 }}>
            لتعديل هذه البيانات، تواصل مع إدارة المنصة
          </p>
        </Card>

        {/* ── Primary color ── */}
        <Card title="لون المدرسة الرئيسي" sub="يُطبَّق على الشريط الجانبي والأزرار">
          {/* Preset swatches */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: c, cursor: "pointer",
                  border: `2px solid ${color === c ? "#1E293B" : "transparent"}`,
                  outline: color === c ? "2px solid #fff" : "none",
                  outlineOffset: 1,
                  transition: "border-color .15s",
                }}
              />
            ))}
          </div>

          {/* Custom color */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 11, color: "#64748B" }}>مخصص:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 36, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", cursor: "pointer", padding: 2 }}
            />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94A3B8" }}>{color}</span>
          </div>

          {/* Live preview */}
          <div style={{ marginTop: 14, borderRadius: 10, padding: "10px 14px", background: color, display: "flex", alignItems: "center", gap: 8 }}>
            <School size={16} color="#fff" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{schoolName}</span>
          </div>
        </Card>

        {/* ── Logo upload ── */}
        <Card title="شعار المدرسة" sub="رفع صورة الشعار (PNG أو SVG · max 2MB)">
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", borderRadius: 12, padding: "1.25rem 0",
              border: "2px dashed #E2E8F0", background: "transparent",
              cursor: "pointer", textAlign: "center", transition: "border-color .15s, background .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#185FA5"; e.currentTarget.style.background = "#EBF4FE"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "transparent"; }}
          >
            <Upload size={22} color="#CBD5E1" style={{ margin: "0 auto 5px" }} />
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>اضغط لرفع الشعار</p>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/svg+xml" style={{ display: "none" }} onChange={handleFile} />

          {/* Preview */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", border: "1px solid #E8EEF6" }}>
            {previewLogo ? (
              <img src={previewLogo} alt="الشعار" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <School size={18} color="#fff" />
              </div>
            )}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", margin: 0 }}>{schoolName}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>معاينة في الشريط الجانبي</p>
            </div>
            {previewLogo && (
              <button
                onClick={() => { setPreviewLogo(null); localStorage.removeItem(LS_LOGO_KEY); }}
                style={{ marginRight: "auto", fontSize: 10, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}
              >
                حذف
              </button>
            )}
          </div>
        </Card>

        {/* ── Theme mode ── */}
        <Card title="نمط العرض" sub="اختر نمط واجهة لوحة التحكم">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { key: "light",  label: "فاتح",               icon: Sun },
              { key: "dark",   label: "داكن",               icon: Moon },
              { key: "auto",   label: "تلقائي (حسب الجهاز)", icon: Monitor },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 9, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, textAlign: "right",
                  border: `1.5px solid ${theme === key ? color : "#E2E8F0"}`,
                  background: theme === key ? color + "12" : "#fff",
                  color: theme === key ? color : "#64748B",
                  fontWeight: theme === key ? 600 : 400,
                  transition: "all .15s",
                }}
              >
                <Icon size={15} />
                {label}
                {theme === key && (
                  <span style={{ marginRight: "auto", fontSize: 10, background: color, color: "#fff", borderRadius: 20, padding: "1px 8px" }}>
                    محدد
                  </span>
                )}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 10, marginBottom: 0 }}>
            الوضع الداكن قيد التطوير
          </p>
        </Card>
      </div>

      {/* Save */}
      <div style={{ marginTop: "1.25rem" }}>
        <button
          onClick={save}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 22px", borderRadius: 10, border: "none",
            background: color, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Save size={15} />
          حفظ إعدادات العرض
        </button>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
          بيانات المدرسة لا يمكن تعديلها من هنا — تواصل مع الدعم
        </p>
      </div>
    </div>
  );
}