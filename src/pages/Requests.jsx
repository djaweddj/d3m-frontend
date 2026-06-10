import { useState, useEffect, useCallback } from "react";
import { Check, X, GraduationCap, RefreshCw, AlertCircle, BookOpen, DollarSign } from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ── API ───────────────────────────────────────────────────
// The enrollment controller has no "get pending requests" endpoint for admin.
// The closest is GET /api/enrollments/mine (student-facing).
// For admin, we use GET /api/modules to see modules, then infer pending
// enrollments from enrollments data.
//
// EnrollmentResponseDto has status field (PENDING | ACTIVE | CANCELLED | REJECTED)
// We need a way to get all enrollments for the school.
// Based on the controller: there's no admin "get all" endpoint visible.
// Best approach: fetch all modules → for each, get students by module —
// but that only returns active students.
//
// REAL approach: We'll call the approve/reject endpoints which exist,
// and for listing we'll use what's available.
// Since there's no admin-facing "get pending requests" endpoint in the provided code,
// we'll show a note and use a polling/manual approach.
// The page will be ready to consume the data once you add that endpoint.
//
// For now: attempt GET /api/enrollments/pending (most likely endpoint name),
// fall back gracefully with a clear message if 404/403.

const requestsApi = {
  // Try the most likely endpoint — add it to backend if missing
  getPending: ()     => api.get("/enrollments/pending"),
  approve:    (id)   => api.post(`/enrollments/requests/${id}/approve`),
  reject:     (id, comment) => api.post(`/enrollments/requests/${id}/reject`, null, { params: { comment } }),
};

// ── Status badge ──────────────────────────────────────────
const statusStyle = (status) => {
  switch (status) {
    case "PENDING":   return { bg: "#FEF3C7", color: "#92400E", label: "قيد الانتظار" };
    case "ACTIVE":    return { bg: "#E1F5EE", color: "#085041", label: "نشط" };
    case "CANCELLED": return { bg: "#F1F5F9", color: "#475569", label: "ملغى" };
    case "REJECTED":  return { bg: "#FEE2E2", color: "#991B1B", label: "مرفوض" };
    default:          return { bg: "#F1F5F9", color: "#64748B", label: status ?? "—" };
  }
};

function Spinner({ size = 18 }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid #185FA5", borderTopColor: "transparent", animation: "spin 1s linear infinite", flexShrink: 0 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ── Reject modal ──────────────────────────────────────────
function RejectModal({ enrollment, onClose, onConfirm }) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(enrollment.id, comment);
    setLoading(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}
    >
      <div dir="rtl" style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 360, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>رفض الطلب</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} color="#64748B" />
          </button>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
            سبب الرفض (اختياري)
          </label>
          <textarea
            style={{ width: "100%", padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#FAFCFF", outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
            placeholder="أدخل سبب الرفض..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? <Spinner size={13} /> : <X size={13} />}
            {loading ? "جارٍ الرفض..." : "رفض الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────
// EnrollmentResponseDto: { id, student{StudentProfile}, subjectName, teacherName, moduleName, ModuleId, status, startDate, endDate, monthlyPrice, createdAt }
function RequestCard({ enrollment, onApprove, onReject, approving, rejecting }) {
  const student = enrollment.student;
  const name    = student?.user?.fullName ?? student?.fullName ?? "طالب";
  const email   = student?.user?.email   ?? student?.email    ?? "";
  const level   = student?.level         ?? "";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const st = statusStyle(enrollment.status);

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8EEF6", padding: "1.25rem", display: "flex", flexDirection: "column", gap: 14, transition: "box-shadow .2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.07)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Top */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EBF4FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#185FA5", flexShrink: 0, border: "2px solid #B5D4F4" }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{name}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            {level && <span>📚 {level}</span>}
            {email && <span style={{ marginRight: 8, direction: "ltr" }}>{email}</span>}
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, flexShrink: 0 }}>
          {st.label}
        </span>
      </div>

      {/* Module info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {[
          { icon: BookOpen,    label: "الوحدة",     value: enrollment.moduleName  ?? `#${enrollment.ModuleId}` },
          { icon: GraduationCap, label: "المادة",   value: enrollment.subjectName ?? "—" },
          { icon: GraduationCap, label: "الأستاذ",  value: enrollment.teacherName ?? "—" },
          { icon: DollarSign,  label: "الرسوم الشهرية", value: enrollment.monthlyPrice ? `${enrollment.monthlyPrice} دج` : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", borderRadius: 9, padding: "8px 12px" }}>
            <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon size={12} color="#94A3B8" /> {label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Date */}
      {enrollment.createdAt && (
        <div style={{ fontSize: 10, color: "#94A3B8", textAlign: "center" }}>
          تاريخ الطلب: {new Date(enrollment.createdAt).toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      )}

      {/* Actions (only for PENDING) */}
      {enrollment.status === "PENDING" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onApprove(enrollment.id)}
            disabled={approving}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, background: "#059669", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: approving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: approving ? .7 : 1 }}
          >
            {approving ? <Spinner size={13} /> : <Check size={14} />}
            قبول
          </button>
          <button
            onClick={() => onReject(enrollment)}
            disabled={rejecting}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: rejecting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            <X size={14} />
            رفض
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Requests() {
  const { school } = useAuth();

  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [filter,    setFilter]    = useState("PENDING"); // PENDING | ALL

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await requestsApi.getPending();
      const data = res.data?.content ?? res.data ?? [];
      setRequests(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 403) {
        setError("لا يوجد endpoint لعرض الطلبات المعلقة بعد.\nأضف GET /api/enrollments/pending إلى EnrollmentController.");
      } else {
        setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await requestsApi.approve(id);
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "ACTIVE" } : r)
      );
    } catch (err) {
      // Could add toast here
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id, comment) => {
    try {
      await requestsApi.reject(id, comment);
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r)
      );
    } catch {}
  };

  const displayed = filter === "PENDING"
    ? requests.filter((r) => r.status === "PENDING")
    : requests;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div dir="rtl" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>طلبات الانضمام</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {loading ? "..." : `${pendingCount} طلب معلق`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Filter pills */}
          {[
            { key: "PENDING", label: "المعلقة" },
            { key: "ALL",     label: "الكل" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${filter === key ? "#185FA5" : "#E2E8F0"}`, background: filter === key ? "#EBF4FE" : "#fff", color: filter === key ? "#185FA5" : "#64748B" }}
            >
              {label}
              {key === "PENDING" && pendingCount > 0 && (
                <span style={{ marginRight: 5, fontSize: 10, background: "#185FA5", color: "#fff", borderRadius: 20, padding: "1px 6px" }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "2rem", background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6" }}>
          <AlertCircle size={36} color="#E2A84B" />
          <p style={{ color: "#64748B", fontSize: 13, textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-line" }}>{error}</p>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> إعادة المحاولة
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "2px dashed #E2E8F0", padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: 0 }}>
            {filter === "PENDING" ? "لا توجد طلبات معلقة حالياً" : "لا توجد طلبات"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {displayed.map((enr) => (
            <RequestCard
              key={enr.id}
              enrollment={enr}
              onApprove={handleApprove}
              onReject={(e) => setRejectTarget(e)}
              approving={approving === enr.id}
              rejecting={false}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          enrollment={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}