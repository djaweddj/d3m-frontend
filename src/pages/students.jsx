import { useState, useEffect, useCallback } from "react";
import { Search, Users, CheckCircle, XCircle, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
// GET /api/modules  → List<CourseModuleResponseDto>  (admin's school modules)
// GET /api/students/by-module/{moduleId}  → List<StudentResponseDto>
// GET /api/invoices/school/revenue?period=yyyy-MM  → SchoolRevenueDto (has invoices[])

const schoolApi = {
  getModules:  ()         => api.get("/modules"),
  getStudents: (moduleId) => api.get(`/students/by-module/${moduleId}`),
  getRevenue:  (period)   => api.get("/invoices/school/revenue", { params: { period } }),
};

function todayYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Palette ───────────────────────────────────────────────
const LEVEL_COLORS = [
  { color: "#3B82F6", light: "#EFF6FF" },
  { color: "#8B5CF6", light: "#F5F3FF" },
  { color: "#059669", light: "#ECFDF5" },
  { color: "#D97706", light: "#FFFBEB" },
  { color: "#DC2626", light: "#FEF2F2" },
];
const levelColor = (i) => LEVEL_COLORS[i % LEVEL_COLORS.length];

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

// ── Sub-components ────────────────────────────────────────
function LoadingBlock() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid #185FA5", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
      <AlertCircle size={32} color="#E2A84B" />
      <p style={{ color: "#64748B", fontSize: 13 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// ── Module accordion ──────────────────────────────────────
function ModuleSection({ module, students, invoiceMap, color, light }) {
  const [open, setOpen] = useState(true);

  const paid   = students.filter((s) => {
    const inv = invoiceMap[s.id];
    return inv && inv.status === "PAID";
  }).length;
  const unpaid = students.length - paid;

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${color}28`, borderRight: `3px solid ${color}`, marginBottom: 10 }}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "right" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: light, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
            {module.level?.slice(0, 3) ?? "—"}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {module.subjectName ?? module.name}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: "#64748B" }}>👨‍🏫 {module.teacherName ?? "—"}</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>·</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>
                <Users size={10} style={{ verticalAlign: "middle" }} /> {students.length} تلميذ
              </span>
              {unpaid > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                  {unpaid} معلق
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: light, color }}>
            {module.level}
          </span>
          {open ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
        </div>
      </button>

      {/* Students list */}
      {open && (
        <div style={{ background: "#fff", borderTop: "1px solid #F8FAFC" }}>
          {students.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              لا يوجد تلاميذ في هذه الوحدة
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 140px 100px 80px", gap: 8, padding: "8px 16px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                {["", "", "الاسم", "البريد الإلكتروني", "ولي الأمر", "الدفع"].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>
                ))}
              </div>

              {students.map((s, i) => {
                const inv    = invoiceMap[s.id];
                const isPaid = inv?.status === "PAID";
                return (
                  <div
                    key={s.id}
                    style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 140px 100px 80px", gap: 8, padding: "10px 16px", alignItems: "center", borderBottom: i < students.length - 1 ? "1px solid #F8FAFC" : "none" }}
                  >
                    <span style={{ fontSize: 11, color: "#CBD5E1", fontFamily: "monospace", textAlign: "center" }}>{i + 1}</span>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                      {initials(s.fullName)}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{s.fullName}</p>
                      {s.level && <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, marginTop: 1 }}>{s.level}</p>}
                    </div>
                    <span style={{ fontSize: 11, color: "#64748B", direction: "ltr", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.email || "—"}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{s.parentPhone || "—"}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4, background: isPaid ? "#ECFDF5" : "#FEF9C3", color: isPaid ? "#065F46" : "#854D0E" }}>
                      {isPaid
                        ? <><CheckCircle size={10} /> مدفوع</>
                        : <><XCircle size={10} /> معلق</>}
                    </span>
                  </div>
                );
              })}

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8" }}>
                <span>مدفوع: <strong style={{ color: "#0F172A" }}>{paid}</strong></span>
                <span>معلق: <strong style={{ color: "#BA7517" }}>{unpaid}</strong></span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Level tab ─────────────────────────────────────────────
function LevelTab({ levelKey, count, color, light, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
        border: active ? `1.5px solid ${color}` : "1.5px solid #E2E8F0",
        background: active ? color : "#fff",
        color: active ? "#fff" : "#64748B",
        boxShadow: active ? `0 4px 14px ${color}40` : "none",
        transition: "all .15s", fontFamily: "inherit",
      }}
    >
      {levelKey}
      <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 20, background: active ? "rgba(255,255,255,.25)" : light, color: active ? "#fff" : color }}>
        {count}
      </span>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Students() {
  const { school } = useAuth();
  const schoolId = school?.id;

  const [modules,      setModules]     = useState([]);
  const [studentMap,   setStudentMap]  = useState({}); // moduleId → StudentResponseDto[]
  const [invoiceMap,   setInvoiceMap]  = useState({}); // studentId → StudentInvoiceResponseDto
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState(null);
  const [activeLevel,  setActiveLevel] = useState(null);
  const [search,       setSearch]      = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get all modules for this school
      const modRes = await schoolApi.getModules();
      const mods   = modRes.data?.content ?? modRes.data ?? [];
      setModules(mods);

      if (mods.length === 0) { setLoading(false); return; }

      // 2. Fetch students for every module in parallel
      const studentResults = await Promise.all(
        mods.map((m) => schoolApi.getStudents(m.id).then((r) => ({ moduleId: m.id, students: r.data?.content ?? r.data ?? [] })))
      );
      const sMap = {};
      studentResults.forEach(({ moduleId, students }) => { sMap[moduleId] = students; });
      setStudentMap(sMap);

      // 3. Fetch current month revenue (has invoices[] with student payment status)
      const revRes   = await schoolApi.getRevenue(todayYearMonth());
      const invoices = revRes.data?.invoices ?? [];
      const iMap     = {};
      // key by studentName since StudentInvoiceResponseDto has studentName not studentId
      // We'll match by name later; store by name as key
      invoices.forEach((inv) => {
        if (inv.studentName) iMap[inv.studentName] = inv;
      });
      setInvoiceMap(iMap);

      // Set default active level
      const levels = [...new Set(mods.map((m) => m.level).filter(Boolean))];
      if (levels.length > 0) setActiveLevel(levels[0]);
    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif" }} dir="rtl"><LoadingBlock /></div>;
  if (error)   return <div style={{ padding: "1.5rem", fontFamily: "'Cairo',sans-serif" }} dir="rtl"><ErrorBlock message={error} onRetry={load} /></div>;

  // Group modules by level
  const byLevel = {};
  modules.forEach((m, i) => {
    const lvl = m.level || "غير محدد";
    if (!byLevel[lvl]) byLevel[lvl] = { modules: [], colorIdx: Object.keys(byLevel).length };
    byLevel[lvl].modules.push({ ...m, _idx: i });
  });

  const levels = Object.keys(byLevel);
  const active = activeLevel ?? levels[0];
  const { colorIdx } = byLevel[active] ?? { colorIdx: 0 };
  const { color, light } = levelColor(colorIdx);

  // All students in active level for stats
  const activeMods     = (byLevel[active]?.modules ?? []);
  const allStudents    = activeMods.flatMap((m) => studentMap[m.id] ?? []);
  const uniqueStudents = [...new Map(allStudents.map((s) => [s.id, s])).values()];

  // Search filter
  const filtered = search.trim()
    ? uniqueStudents.filter((s) => s.fullName?.includes(search) || s.email?.includes(search))
    : null; // null = show per-module breakdown

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>التلاميذ</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {uniqueStudents.length} تلميذ في المستوى الحالي
          </p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      {/* Level tabs */}
      {levels.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.25rem" }}>
          {levels.map((lvl, i) => {
            const c = levelColor(byLevel[lvl].colorIdx);
            const count = (byLevel[lvl].modules ?? []).flatMap((m) => studentMap[m.id] ?? []).length;
            return (
              <LevelTab key={lvl} levelKey={lvl} count={count} color={c.color} light={c.light}
                active={active === lvl} onClick={() => { setActiveLevel(lvl); setSearch(""); }} />
            );
          })}
        </div>
      )}

      {/* Stats + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "تلميذ",   value: uniqueStudents.length },
            { label: "مدفوع",   value: uniqueStudents.filter((s) => invoiceMap[s.fullName]?.status === "PAID").length },
            { label: "وحدات",   value: activeMods.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 9, border: "1px solid #E2E8F0", padding: "6px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{value}</span>
              <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: 240 }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
          <input
            style={{ width: "100%", paddingRight: 32, paddingLeft: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 9, border: `1.5px solid ${search ? color : "#E2E8F0"}`, fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#fff", outline: "none", boxSizing: "border-box" }}
            placeholder="بحث عن تلميذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {levels.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "3rem", fontSize: 13 }}>لا توجد وحدات دراسية مسجلة</div>
      ) : filtered !== null ? (
        // Flat search results
        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E8EEF6", overflow: "hidden" }}>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", color: "#94A3B8", padding: "2rem", fontSize: 13 }}>لا توجد نتائج</div>
            : filtered.map((s, i) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "28px 36px 1fr 140px 100px", gap: 8, padding: "10px 16px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                <span style={{ fontSize: 11, color: "#CBD5E1", textAlign: "center" }}>{i + 1}</span>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  {initials(s.fullName)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{s.fullName}</p>
                  <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{s.level}</p>
                </div>
                <span style={{ fontSize: 11, color: "#64748B", direction: "ltr", textAlign: "right" }}>{s.email || "—"}</span>
                <span style={{ fontSize: 11, color: "#64748B" }}>{s.parentPhone || "—"}</span>
              </div>
            ))
          }
        </div>
      ) : (
        // Per-module breakdown
        activeMods.map((m) => {
          const c = levelColor(m._idx);
          return (
            <ModuleSection
              key={m.id}
              module={m}
              students={studentMap[m.id] ?? []}
              invoiceMap={invoiceMap}
              color={c.color}
              light={c.light}
            />
          );
        })
      )}
    </div>
  );
}