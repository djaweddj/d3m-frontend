import { useState, useRef, useEffect } from "react";
import { Upload, School, Sun, Moon, Monitor, Save, Loader2, X } from "lucide-react";
import { useAuth } from "../context/authContext";
import { uploadSchoolLogo } from "../api";
import { toast } from "sonner";

const PRESETS = [
  "#185FA5", "#2563EB", "#7C3AED", "#059669",
  "#DC2626", "#D97706", "#0891B2", "#BE185D",
];

const LS_COLOR_KEY = "school_primary_color";

// Keep these in sync with the backend's FileValidator
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/svg+xml"];



export default function Settings() {
  // useAuth gives: { user, school, updateSchool }
  // school shape matches SchoolDto / SchoolResponseDto:
  //   schoolName, ownerName, email, phone, wilaya, commune,
  //   subscriptionStatus, subscriptionExpiresAt, logoUrl
  const { user, school, updateSchool } = useAuth();

  const [color, setColor] = useState(
    () => localStorage.getItem(LS_COLOR_KEY) ?? school?.primaryColor ?? "#185FA5"
  );
  const [theme, setTheme] = useState("light"); // UI-only, unrelated to logo

  // Logo upload state — driven by the backend, not localStorage
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState(null); // temp blob preview while uploading
  const fileRef = useRef(null);

  // The logo actually persisted on the school (source of truth once upload succeeds)
  const logoUrl = localPreview ?? school?.logoUrl ?? null;

  // Clean up the object URL when it's no longer needed, to avoid leaking memory
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("صيغة الملف غير مدعومة — PNG أو SVG فقط");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("حجم الملف يتجاوز 2 ميغابايت");
      return false;
    }
    return true;
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // reset the input so selecting the same file again still fires onChange
    e.target.value = "";
    if (!file) return;
    if (!validateFile(file)) return;

    // Optimistic local preview while the real upload is in flight
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await uploadSchoolLogo(file, setUploadProgress);
      const updatedLogoUrl = res.data.logoUrl;

      // Backend is now the source of truth — drop the temp blob preview
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      updateSchool?.({ logoUrl: updatedLogoUrl });

      toast.success("تم تحديث شعار المدرسة بنجاح");
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);

      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.error;

      if (status === 413) {
        toast.error("حجم الملف يتجاوز الحد المسموح به");
      } else if (status === 400) {
        toast.error(serverMessage || "الملف غير صالح");
      } else if (status === 401 || status === 403) {
        toast.error("غير مصرح لك برفع الشعار");
      } else {
        toast.error("تعذر رفع الشعار — حاول مرة أخرى");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeLogo = () => {
    // NOTE: this only clears the local UI state. If you want actual deletion
    // on the backend (removing the Cloudinary asset + clearing logoUrl),
    // wire this to a DELETE /schools/logo endpoint instead.
    toast.info("للحذف الفعلي يرجى التواصل مع الدعم");
  };

  const save = () => {
    localStorage.setItem(LS_COLOR_KEY, color);
    toast.success("تم حفظ إعدادات العرض");
  };

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

          <div style={{ marginTop: 14, borderRadius: 10, padding: "10px 14px", background: color, display: "flex", alignItems: "center", gap: 8 }}>
            <School size={16} color="#fff" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{schoolName}</span>
          </div>
        </Card>

        {/* ── Logo upload ── */}
        <Card title="شعار المدرسة" sub="رفع صورة الشعار (PNG أو SVG · حد أقصى 2 ميغابايت)">
          <button
            onClick={() => !uploading && fileRef.current?.click()}
            disabled={uploading}
            style={{
              width: "100%", borderRadius: 12, padding: "1.25rem 0",
              border: "2px dashed #E2E8F0", background: "transparent",
              cursor: uploading ? "not-allowed" : "pointer", textAlign: "center",
              transition: "border-color .15s, background .15s",
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.borderColor = "#185FA5"; e.currentTarget.style.background = "#EBF4FE"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "transparent"; }}
          >
            {uploading ? (
              <>
                <Loader2 size={22} color="#185FA5" style={{ margin: "0 auto 5px", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 11, color: "#185FA5", margin: 0, fontWeight: 600 }}>
                  جاري الرفع... {uploadProgress}%
                </p>
              </>
            ) : (
              <>
                <Upload size={22} color="#CBD5E1" style={{ margin: "0 auto 5px" }} />
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>اضغط لرفع الشعار</p>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml"
            style={{ display: "none" }}
            onChange={handleFile}
            disabled={uploading}
          />

          {/* Upload progress bar */}
          {uploading && (
            <div style={{ marginTop: 10, height: 4, borderRadius: 4, background: "#E8EEF6", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${uploadProgress}%`,
                background: "#185FA5", transition: "width .2s ease",
              }} />
            </div>
          )}

          {/* Preview */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", border: "1px solid #E8EEF6" }}>
            {logoUrl ? (
              <img src={logoUrl} alt="الشعار" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <School size={18} color="#fff" />
              </div>
            )}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", margin: 0 }}>{schoolName}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>معاينة في الشريط الجانبي</p>
            </div>
            {logoUrl && !uploading && (
              <button
                onClick={removeLogo}
                style={{ marginRight: "auto", fontSize: 10, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
              >
                <X size={11} />
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
          الشعار محفوظ مباشرة عند الرفع — بيانات المدرسة الأخرى لا يمكن تعديلها من هنا
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}