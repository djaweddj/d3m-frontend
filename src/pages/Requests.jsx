import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, X, GraduationCap, RefreshCw, AlertCircle, BookOpen, DollarSign, Mail, Phone, User, Layers, MessageSquare, Search, ChevronDown } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import { LOCALE_MAP } from "../i18n/translations"; // ⚠️ adjust path // ⚠️ adjust to your actual hook/path
import api from "../api";

const requestsApi = {
  getPending: () => api.get("api/enrollments/requests", { params: { status: "PENDING" } }),
  approve:    (id) => api.post(`api/enrollments/requests/${id}/approve`),
  reject:     (id, comment) => api.post(`api/enrollments/requests/${id}/reject`, null, { params: { comment } }),
};

const statusStyle = (status, t) => {
  switch (status) {
    case "PENDING":   return { bg: "#FEF3C7", color: "#92400E", label: t("requests.status.PENDING") };
    case "ACTIVE":    return { bg: "#E1F5EE", color: "#085041", label: t("requests.status.ACTIVE") };
    case "CANCELLED": return { bg: "#F1F5F9", color: "#475569", label: t("requests.status.CANCELLED") };
    case "REJECTED":  return { bg: "#FEE2E2", color: "#991B1B", label: t("requests.status.REJECTED") };
    default:          return { bg: "#F1F5F9", color: "#64748B", label: status ?? "—" };
  }
};

function Spinner({ size = 18, color = "#185FA5" }) {
  return (
    <>
      <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", animation: "spin 1s linear infinite", flexShrink: 0 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

function RejectModal({ enrollment, onClose, onConfirm, t, dir }) {
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
      <div dir={dir} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 360, border: "1.5px solid #E2E8F0", overflow: "hidden", fontFamily: "'Cairo',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{t("requests.rejectModal.title")}</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} color="#64748B" />
          </button>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
            {t("requests.rejectModal.commentLabel")}
          </label>
          <textarea
            style={{ width: "100%", padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", color: "#0F172A", background: "#FAFCFF", outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
            placeholder={t("requests.rejectModal.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "1rem 1.25rem", borderTop: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {t("requests.rejectModal.cancel")}
          </button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 9, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? <Spinner size={13} color="#fff" /> : <X size={13} />}
            {loading ? t("requests.rejectModal.confirming") : t("requests.rejectModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, dir }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", borderRadius: 9, padding: "8px 12px", flexWrap: "wrap", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={12} color="#94A3B8" /> {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", direction: dir || "rtl", textAlign: "left" }}>{value}</span>
    </div>
  );
}

/* ---------- Expandable list-style request row ---------- */
function RequestRow({ enrollment, onApprove, onReject, approving, rejecting, t, lang, dir }) {
  const [expanded, setExpanded] = useState(false);

  const name = enrollment.studentFullName ?? t("requests.studentFallback");
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const st = statusStyle(enrollment.status, t);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString(LOCALE_MAP[lang] ?? "en-US", { year: "numeric", month: "long", day: "numeric" }) : null;

  const requestedDate = formatDate(enrollment.createdAt);
  const reviewedDate  = formatDate(enrollment.reviewedAt);

  const moduleLabel = enrollment.moduleName ?? (enrollment.moduleId ? `#${enrollment.moduleId}` : null);
  const contactNumber = enrollment.parentPhone ?? enrollment.studentPhone;

  const toggle = () => setExpanded((v) => !v);

  return (
    <div
      className="req-row"
      style={{
        background: "#fff",
        borderRadius: 14,
        border: expanded ? "1.5px solid #B5D4F4" : "1.5px solid #E8EEF6",
        boxShadow: expanded ? "0 4px 20px rgba(24,95,165,.08)" : "none",
        transition: "border-color .15s, box-shadow .15s",
        overflow: "hidden",
      }}
    >
      {/* ---- Summary bar (always visible, essential data only) ---- */}
      <button
        onClick={toggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0.85rem 1rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: dir === "rtl" ? "right" : "left",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "#EBF4FE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#185FA5",
            flexShrink: 0,
            border: "1.5px solid #B5D4F4",
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>{name}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2.5px 9px", borderRadius: 20, background: st.bg, color: st.color, flexShrink: 0 }}>
              {st.label}
            </span>
          </div>
          <div className="req-row-meta" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "#64748B", flexWrap: "wrap" }}>
            {moduleLabel && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen size={11} color="#94A3B8" /> {moduleLabel}
              </span>
            )}
            {contactNumber && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, direction: "ltr" }}>
                <Phone size={11} color="#94A3B8" /> {contactNumber}
              </span>
            )}
          </div>
        </div>

        {enrollment.status === "PENDING" && !expanded && (
          <div className="req-row-quick-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onApprove(enrollment.id)}
              disabled={approving}
              title={t("requests.approve")}
              style={{ width: 30, height: 30, borderRadius: 9, background: "#059669", border: "none", color: "#fff", cursor: approving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: approving ? .7 : 1, flexShrink: 0 }}
            >
              {approving ? <Spinner size={12} color="#fff" /> : <Check size={14} />}
            </button>
            <button
              onClick={() => onReject(enrollment)}
              title={t("requests.reject")}
              style={{ width: 30, height: 30, borderRadius: 9, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <ChevronDown
          size={16}
          color="#94A3B8"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .18s" }}
        />
      </button>

      {/* ---- Expanded detail panel ---- */}
      {expanded && (
        <div style={{ padding: "0 1rem 1.1rem", display: "flex", flexDirection: "column", gap: 14, borderTop: "1.5px solid #F1F5F9", marginTop: 2, paddingTop: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: ".02em" }}>{t("requests.sectionStudentInfo")}</div>
            <InfoRow icon={Mail} label={t("requests.fields.email")} value={enrollment.studentEmail} dir="ltr" />
            <InfoRow icon={Layers} label={t("requests.fields.level")} value={enrollment.studentLevel} />
          </div>

          {(enrollment.parentName || enrollment.parentPhone) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: ".02em" }}>{t("requests.sectionParentInfo")}</div>
              <InfoRow icon={User} label={t("requests.fields.parentName")} value={enrollment.parentName} />
              <InfoRow icon={Phone} label={t("requests.fields.parentPhone")} value={enrollment.parentPhone} dir="ltr" />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: ".02em" }}>{t("requests.sectionRequestDetails")}</div>
            <InfoRow icon={BookOpen} label={t("requests.fields.module")} value={moduleLabel} />
            <InfoRow icon={GraduationCap} label={t("requests.fields.subject")} value={enrollment.subjectName} />
            <InfoRow icon={Layers} label={t("requests.fields.moduleLevel")} value={enrollment.level} />
            <InfoRow icon={DollarSign} label={t("requests.fields.monthlyPrice")} value={enrollment.monthlyPrice != null ? `${enrollment.monthlyPrice} ${t("requests.currency")}` : null} />
          </div>

          {enrollment.reviewComment && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "8px 12px" }}>
              <MessageSquare size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>{enrollment.reviewComment}</span>
            </div>
          )}

          {(requestedDate || reviewedDate) && (
            <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 10, color: "#94A3B8", flexWrap: "wrap" }}>
              {requestedDate && <span>{t("requests.requestedDate")} {requestedDate}</span>}
              {reviewedDate && <span>{t("requests.reviewedDate")} {reviewedDate}</span>}
            </div>
          )}

          {enrollment.status === "PENDING" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => onApprove(enrollment.id)}
                disabled={approving}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, background: "#059669", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: approving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: approving ? .7 : 1 }}
              >
                {approving ? <Spinner size={13} color="#fff" /> : <Check size={14} />}
                {t("requests.approve")}
              </button>
              <button
                onClick={() => onReject(enrollment)}
                disabled={rejecting}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: rejecting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                <X size={14} />
                {t("requests.reject")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Requests() {
  const { school } = useAuth();
  const { t, lang, dir } = useLanguage(); // ⚠️ adjust to your actual hook

  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [filter,    setFilter]    = useState("PENDING");
  const [search,    setSearch]    = useState("");

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
        setError(t("requests.errors.noEndpoint"));
      } else {
        setError(err?.response?.data?.message || t("requests.errors.generic"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        prev.map((r) => r.id === id ? { ...r, status: "REJECTED", reviewComment: comment || r.reviewComment } : r)
      );
    } catch {}
  };

  const statusFiltered = filter === "PENDING"
    ? requests.filter((r) => r.status === "PENDING")
    : requests;

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter((r) =>
      (r.studentFullName ?? "").toLowerCase().includes(q)
    );
  }, [statusFiltered, search]);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div dir={dir} className="req-page" style={{ padding: "1.25rem", fontFamily: "'Cairo',sans-serif", background: "#F8FAFC", minHeight: "100vh", boxSizing: "border-box" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}

        .req-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; flex-wrap:wrap; gap:12px; }
        .req-controls { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .req-search-wrap { position:relative; display:flex; align-items:center; }
        .req-search-input { padding:7px 12px 7px 32px; border-radius:9px; border:1.5px solid #E2E8F0; font-size:12px; font-family:inherit; color:#0F172A; background:#fff; outline:none; width:200px; box-sizing:border-box; }
        .req-search-input:focus { border-color:#185FA5; }
        [dir="rtl"] .req-search-input { padding:7px 32px 7px 12px; }
        .req-search-icon { position:absolute; left:10px; pointer-events:none; }
        [dir="rtl"] .req-search-icon { left:auto; right:10px; }

        .req-list { display:flex; flex-direction:column; gap:10px; }

        @media (max-width: 640px) {
          .req-page { padding:0.75rem !important; }
          .req-header { flex-direction:column; align-items:stretch; gap:10px; }
          .req-controls { width:100%; }
          .req-search-wrap { width:100%; order:-1; }
          .req-search-input { width:100%; }
          .req-filter-btns { display:flex; gap:8px; width:100%; }
          .req-filter-btns button { flex:1; }
          .req-refresh-btn { flex-shrink:0; }
          .req-row-quick-actions { display:none !important; }
          .req-row-meta { gap:8px !important; }
        }
      `}</style>

      <div className="req-header">
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("requests.title")}</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, margin: 0 }}>
            {loading ? "..." : t("requests.countPending", { count: pendingCount })}
          </p>
        </div>
        <div className="req-controls">
          <div className="req-search-wrap">
            <Search size={13} color="#94A3B8" className="req-search-icon" />
            <input
              className="req-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("requests.searchPlaceholder", "Search by student name...")}
            />
          </div>
          <div className="req-filter-btns">
            {[
              { key: "PENDING", label: t("requests.filters.pending") },
              { key: "ALL",     label: t("requests.filters.all") },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${filter === key ? "#185FA5" : "#E2E8F0"}`, background: filter === key ? "#EBF4FE" : "#fff", color: filter === key ? "#185FA5" : "#64748B", whiteSpace: "nowrap" }}
              >
                {label}
                {key === "PENDING" && pendingCount > 0 && (
                  <span style={{ marginInlineStart: 5, fontSize: 10, background: "#185FA5", color: "#fff", borderRadius: 20, padding: "1px 6px" }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button className="req-refresh-btn" onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "2rem", background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6" }}>
          <AlertCircle size={36} color="#E2A84B" />
          <p style={{ color: "#64748B", fontSize: 13, textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-line" }}>{error}</p>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "1.5px solid #185FA5", background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={13} /> {t("requests.retry")}
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "2px dashed #E2E8F0", padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{search.trim() ? "🔍" : "✅"}</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: 0 }}>
            {search.trim()
              ? t("requests.emptySearch", "No requests match that name")
              : filter === "PENDING" ? t("requests.emptyPending") : t("requests.emptyAll")}
          </p>
        </div>
      ) : (
        <div className="req-list">
          {displayed.map((enr) => (
            <RequestRow
              key={enr.id}
              enrollment={enr}
              onApprove={handleApprove}
              onReject={(e) => setRejectTarget(e)}
              approving={approving === enr.id}
              rejecting={false}
              t={t}
              lang={lang}
              dir={dir}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          enrollment={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          t={t}
          dir={dir}
        />
      )}
    </div>
  );
}