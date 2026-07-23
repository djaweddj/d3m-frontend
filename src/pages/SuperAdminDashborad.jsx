import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import api from "../api";

// ══════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════
const T = {
  // Blues
  blue900: "#042C53", blue800: "#0C447C", blue600: "#185FA5",
  blue400: "#378ADD", blue200: "#85B7EB", blue100: "#B5D4F4", blue50: "#E6F1FB",
  // Greens
  green800: "#27500A", green600: "#3B6D11", green400: "#639922",
  green100: "#C0DD97", green50: "#EAF3DE",
  // Ambers
  amber800: "#633806", amber600: "#854F0B", amber400: "#BA7517",
  amber100: "#FAC775", amber50: "#FAEEDA",
  // Reds
  red800: "#791F1F", red600: "#A32D2D", red400: "#E24B4A",
  red100: "#F7C1C1", red50: "#FCEBEB",
  // Grays
  gray800: "#444441", gray600: "#5F5E5A", gray400: "#888780",
  gray200: "#B4B2A9", gray100: "#D3D1C7", gray50: "#F1EFE8",
  // Surfaces
  white:  "#ffffff",
  bg:     "#f7f7f5",
  border: "#e4e4e1",
  borderStrong: "#c8c8c4",
  // Text
  text:    "#18180f",
  textSub: "#4a4a46",
  textMuted: "#7a7a75",
};

// ══════════════════════════════════════════════════════════════════
//  SHARED PRIMITIVES
// ══════════════════════════════════════════════════════════════════

// Status pill
const STATUS_MAP = {
  PENDING:   { bg: T.amber50, text: T.amber800, border: T.amber100, label: "Pending"    },
  APPROVED:  { bg: T.green50, text: T.green800, border: T.green100, label: "Approved"   },
  REJECTED:  { bg: T.gray50,  text: T.gray800,  border: T.gray100,  label: "Rejected"   },
  ACTIVE:    { bg: T.green50, text: T.green800, border: T.green100, label: "Active"     },
  TRIAL:     { bg: T.blue50,  text: T.blue800,  border: T.blue100,  label: "Trial"      },
  SUSPENDED: { bg: T.red50,   text: T.red800,   border: T.red100,   label: "Suspended"  },
  EXPIRED:   { bg: T.red50,   text: T.red800,   border: T.red100,   label: "Expired"    },
  PAID:      { bg: T.green50, text: T.green800, border: T.green100, label: "Paid"       },
  OVERDUE:   { bg: T.red50,   text: T.red800,   border: T.red100,   label: "Overdue"    },
  CANCELLED: { bg: T.gray50,  text: T.gray800,  border: T.gray100,  label: "Cancelled"  },
  BASIC:     { bg: T.gray50,  text: T.gray800,  border: T.gray100,  label: "Basic"      },
  PRO:       { bg: T.blue50,  text: T.blue800,  border: T.blue100,  label: "Pro"        },
  ENTERPRISE:{ bg: T.amber50, text: T.amber800, border: T.amber100, label: "Enterprise" },
};

const Pill = ({ status, small }) => {
  const s = STATUS_MAP[status?.toUpperCase()] || {
    bg: T.gray50, text: T.gray600, border: T.gray100, label: status ?? "—",
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: small ? "2px 8px" : "3px 10px",
      borderRadius: 99, fontSize: small ? 10 : 11, fontWeight: 500,
      background: s.bg, color: s.text,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
};

// Card
const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: T.white,
      border: `0.5px solid ${T.border}`,
      borderRadius: 12,
      ...style,
    }}
  >
    {children}
  </div>
);

// Section header inside a card
const SH = ({ title, right }) => (
  <div style={{
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  }}>
    <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{title}</span>
    {right}
  </div>
);

// Table helpers
const Th = ({ children, align = "left", width }) => (
  <th style={{
    textAlign: align, padding: "8px 12px",
    fontSize: 10, fontWeight: 500, color: T.textMuted,
    borderBottom: `0.5px solid ${T.border}`,
    textTransform: "uppercase", letterSpacing: "0.05em",
    whiteSpace: "nowrap", width,
  }}>
    {children}
  </th>
);
const Td = ({ children, align = "left", muted, mono, colSpan }) => (
  <td style={{
    padding: "10px 12px", fontSize: 12,
    color: muted ? T.textMuted : T.text,
    textAlign: align, verticalAlign: "middle",
    borderBottom: `0.5px solid ${T.border}`,
    fontVariantNumeric: mono ? "tabular-nums" : "normal",
    colSpan,
  }}
    colSpan={colSpan}
  >
    {children}
  </td>
);
const EmptyRow = ({ cols, msg = "No data" }) => (
  <tr>
    <td colSpan={cols} style={{
      textAlign: "center", padding: "40px 0",
      fontSize: 12, color: T.textMuted,
    }}>
      {msg}
    </td>
  </tr>
);

// Button variants
const BTN = {
  primary:    { bg: T.blue600,  color: T.white,    border: T.blue600  },
  approve:    { bg: T.green50,  color: T.green800, border: T.green100 },
  reject:     { bg: T.red50,    color: T.red800,   border: T.red100   },
  pay:        { bg: T.blue50,   color: T.blue800,  border: T.blue100  },
  suspend:    { bg: T.red50,    color: T.red800,   border: T.red100   },
  reactivate: { bg: T.green50,  color: T.green800, border: T.green100 },
  ghost:      { bg: "transparent", color: T.textSub, border: T.border },
  danger:     { bg: T.red600,   color: T.white,    border: T.red600   },
};

const Btn = ({ children, variant = "ghost", onClick, disabled, loading, size = "md", full }) => {
  const s = BTN[variant] || BTN.ghost;
  const pad = size === "sm" ? "4px 10px" : size === "lg" ? "10px 20px" : "6px 14px";
  const fs  = size === "sm" ? 11 : size === "lg" ? 14 : 12;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: pad, fontSize: fs, fontWeight: 500,
        border: `0.5px solid ${s.border}`,
        borderRadius: 7, cursor: disabled || loading ? "not-allowed" : "pointer",
        background: s.bg, color: s.color,
        opacity: disabled || loading ? 0.55 : 1,
        fontFamily: "inherit", whiteSpace: "nowrap",
        transition: "opacity .15s, transform .1s",
        width: full ? "100%" : undefined,
        display: "inline-flex", alignItems: "center", gap: 5,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = ".82"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = "scale(.97)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {loading ? <Spinner size={12} /> : children}
    </button>
  );
};

// Spinner
const Spinner = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
  </svg>
);

// Toast
const useToast = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((msg, type = "success") => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
};

const ToastUI = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: ok ? T.green50 : T.red50,
      color: ok ? T.green800 : T.red800,
      border: `1px solid ${ok ? T.green100 : T.red100}`,
      borderRadius: 10, padding: "11px 18px",
      fontSize: 12, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      animation: "toastIn .25s ease",
      maxWidth: 340,
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <span style={{ fontSize: 15 }}>{ok ? "✓" : "✕"}</span>
      {toast.msg}
    </div>
  );
};

// Modal — fixed viewport overlay using a faux-viewport div
const Modal = ({ open, onClose, title, subtitle, children, wide }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(15,15,10,.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.white,
          border: `0.5px solid ${T.border}`,
          borderRadius: 14,
          padding: "24px 26px",
          width: wide ? 660 : 460,
          maxWidth: "96vw",
          maxHeight: "88vh",
          overflowY: "auto",
          animation: "modalIn .2s ease",
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 20, lineHeight: 1, padding: 2 }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Detail row inside modal
const DR = ({ label, value }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0", borderBottom: `0.5px solid ${T.border}`,
  }}>
    <span style={{ fontSize: 12, color: T.textMuted }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{value ?? "—"}</span>
  </div>
);

// Stat card
const StatCard = ({ label, value, sub, color = T.blue600, icon }) => (
  <Card style={{ padding: "16px 18px", borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: 18, marginBottom: 8, color }}>{icon}</div>
    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 500, color: T.text, lineHeight: 1.1 }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
  </Card>
);

// Initials avatar
const Avatar = ({ name = "", color = T.blue600, size = 36 }) => {
  const ini = name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: `${color}18`, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {ini}
    </div>
  );
};

// Textarea field
const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{
      width: "100%", padding: "10px 12px", fontSize: 12,
      border: `0.5px solid ${T.border}`, borderRadius: 8,
      fontFamily: "inherit", color: T.text, background: T.white,
      resize: "vertical", boxSizing: "border-box", outline: "none",
    }}
  />
);

// Divider
const Divider = ({ my = 16 }) => (
  <div style={{ height: "0.5px", background: T.border, margin: `${my}px 0` }} />
);

// Pagination
const Pagination = ({ page, total, onChange }) => (
  total <= 1 ? null :
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 16 }}>
    <Btn onClick={() => onChange(page - 1)} disabled={page === 0} size="sm">← Prev</Btn>
    <span style={{ fontSize: 12, color: T.textMuted }}>Page {page + 1} of {total}</span>
    <Btn onClick={() => onChange(page + 1)} disabled={page >= total - 1} size="sm">Next →</Btn>
  </div>
);

// Helpers
const fmt     = n  => n != null ? Number(n).toLocaleString("fr-DZ") + " DZD" : "—";
const fmtDate = d  => d ? new Date(d).toLocaleDateString("fr-DZ", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDT   = d  => d ? new Date(d).toLocaleString("fr-DZ",    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const subColor = s => ({
  ACTIVE: T.green600, TRIAL: T.blue600, SUSPENDED: T.red600, EXPIRED: T.red400,
})[s?.toUpperCase()] || T.gray600;

// ══════════════════════════════════════════════════════════════════
//  PAGE HEADER
// ══════════════════════════════════════════════════════════════════
const PageHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <h1 style={{ fontSize: 18, fontWeight: 500, color: T.text, margin: 0 }}>{title}</h1>
    {subtitle && <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>{subtitle}</p>}
  </div>
);

// ══════════════════════════════════════════════════════════════════
//  OVERVIEW PAGE
//  GET /api/platform/dashboard → PlatformDashboardDto
// ══════════════════════════════════════════════════════════════════
function OverviewPage({ onNavigate }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState(false);

  useEffect(() => {
    api.get("/api/platform/dashboard")
      .then(r => setData(r.data))
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (err) return <PageError msg="Could not load dashboard." />;

  const stats = [
    { label: "Total schools",    value: data?.totalSchools,        color: T.blue600,  icon: "🏫" },
    { label: "Active",           value: data?.activeSchools,       color: T.green600, icon: "✅" },
    { label: "Trial",            value: data?.trialSchools,        color: T.blue400,  icon: "🕐" },
    { label: "Suspended",        value: data?.suspendedSchools,    color: T.red600,   icon: "🔒" },
    { label: "Expired",          value: data?.expiredSchools,      color: T.red400,   icon: "⛔" },
    { label: "Pending requests", value: data?.pendingRequests,     color: T.amber600, icon: "📋", sub: "Awaiting review" },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle="Platform health at a glance" />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Revenue row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
            Revenue — current academic year
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: T.blue600 }}>
            {fmt(data?.currentYearRevenue)}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
            From paid school subscriptions
          </div>
        </Card>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
            All-time platform revenue
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: T.green600 }}>
            {fmt(data?.allTimeRevenue)}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
            Cumulative since launch
          </div>
        </Card>
      </div>

      {/* Pending requests preview */}
      <Card style={{ padding: "18px 20px", marginBottom: 16 }}>
        <SH
          title={`Pending school requests (${data?.pendingRequests ?? 0})`}
          right={
            data?.pendingRequests > 0 &&
            <Btn size="sm" onClick={() => onNavigate("requests")}>Review all →</Btn>
          }
        />
        {!data?.pendingSchoolRequests?.length ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: T.textMuted }}>
            No pending requests — all clear ✓
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>School</Th><Th>Owner</Th><Th>Location</Th><Th>Submitted</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.pendingSchoolRequests.slice(0, 5).map(r => (
                <tr key={r.id}>
                  <Td>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{r.schoolName}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{r.email}</div>
                  </Td>
                  <Td muted>{r.ownerFullName}</Td>
                  <Td muted>{[r.wilaya, r.commune].filter(Boolean).join(", ")}</Td>
                  <Td muted>{fmtDate(r.createdAt)}</Td>
                  <Td><Pill status={r.status} small /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Recent school invoices */}
      <Card style={{ padding: "18px 20px", marginBottom: 16 }}>
        <SH
          title="Recent school subscription invoices"
          right={<Btn size="sm" onClick={() => onNavigate("schools")}>Manage →</Btn>}
        />
        {!data?.recentInvoices?.length ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: T.textMuted }}>
            No invoices generated yet
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>School</Th><Th>Academic year</Th><Th>Plan</Th>
                <Th align="right">Amount</Th><Th>Due</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.slice(0, 6).map(inv => (
                <tr key={inv.id}>
                  <Td><span style={{ fontWeight: 500 }}>{inv.schoolName}</span></Td>
                  <Td muted>{inv.academicYear}</Td>
                  <Td><Pill status={inv.plan} small /></Td>
                  <Td align="right" mono>{fmt(inv.amount)}</Td>
                  <Td muted>{fmtDate(inv.dueDate)}</Td>
                  <Td><Pill status={inv.status} small /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SCHOOL REQUESTS PAGE
//  GET  /api/school-requests/pending?page=&size=10
//  POST /api/school-requests/{id}/approve
//  POST /api/school-requests/{id}/reject?comment=
// ══════════════════════════════════════════════════════════════════
function RequestsPage() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy]         = useState({});
  const [detail, setDetail]     = useState(null); // request to view
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const { toast, show } = useToast();

  const load = useCallback((p = 0) => {
    setLoading(true);
    api.get(`/api/school-requests/pending?page=${p}&size=10`)
      .then(r => {
        setRows(r.data.content ?? []);
        setTotalPages(r.data.totalPages ?? 1);
        setPage(r.data.number ?? 0);
      })
      .catch(() => show("Failed to load requests", "error"))
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => { load(0); }, [load]);

  const approve = async (req) => {
    setBusy(b => ({ ...b, [req.id]: "approve" }));
    try {
      await api.post(`/api/school-requests/${req.id}/approve`);
      show(`"${req.schoolName}" approved — school account created ✓`);
      load(page);
    } catch (e) {
      show(e?.response?.data?.message || "Failed to approve", "error");
    } finally { setBusy(b => ({ ...b, [req.id]: null })); }
  };

  const openReject = (req) => {
    setRejectTarget(req);
    setRejectComment("");
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setBusy(b => ({ ...b, [rejectTarget.id]: "reject" }));
    try {
      await api.post(`/api/school-requests/${rejectTarget.id}/reject`, null, {
        params: rejectComment.trim() ? { comment: rejectComment.trim() } : {},
      });
      show(`"${rejectTarget.schoolName}" rejected`);
      setRejectTarget(null);
      load(page);
    } catch { show("Failed to reject", "error"); }
    finally { setBusy(b => ({ ...b, [rejectTarget.id]: null })); }
  };

  return (
    <>
      <ToastUI toast={toast} />
      <PageHeader
        title="School requests"
        subtitle="Review and respond to incoming registration requests"
      />

      <Card style={{ padding: "18px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>School</Th><Th>Owner</Th><Th>Contact</Th>
              <Th>Location</Th><Th>Submitted</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px 0" }}>
                  <Spinner size={20} color={T.blue600} />
                </td>
              </tr>
            ) : !rows.length ? (
              <EmptyRow cols={6} msg="No pending requests at the moment ✓" />
            ) : rows.map(r => (
              <tr key={r.id}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={r.schoolName} size={32} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{r.schoolName}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{r.email}</div>
                    </div>
                  </div>
                </Td>
                <Td muted>{r.ownerFullName}</Td>
                <Td muted>{r.phone}</Td>
                <Td muted>{[r.wilaya, r.commune].filter(Boolean).join(", ")}</Td>
                <Td muted>{fmtDate(r.createdAt)}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Btn size="sm" onClick={() => setDetail(r)}>View</Btn>
                    <Btn
                      variant="approve" size="sm"
                      onClick={() => approve(r)}
                      loading={busy[r.id] === "approve"}
                      disabled={!!busy[r.id]}
                    >
                      Approve
                    </Btn>
                    <Btn
                      variant="reject" size="sm"
                      onClick={() => openReject(r)}
                      loading={busy[r.id] === "reject"}
                      disabled={!!busy[r.id]}
                    >
                      Reject
                    </Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={totalPages} onChange={p => load(p)} />
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!detail} onClose={() => setDetail(null)}
        title={detail?.schoolName}
        subtitle={detail?.email}
      >
        {detail && (
          <>
            <DR label="Owner"     value={detail.ownerFullName} />
            <DR label="Phone"     value={detail.phone} />
            <DR label="Email"     value={detail.email} />
            <DR label="Wilaya"    value={detail.wilaya} />
            <DR label="Commune"   value={detail.commune} />
            <DR label="Address"   value={detail.address} />
            <DR label="Submitted" value={fmtDT(detail.createdAt)} />
            <DR label="Status"    value={<Pill status={detail.status} />} />
            <Divider />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setDetail(null)}>Close</Btn>
              <Btn variant="approve" onClick={() => { setDetail(null); approve(detail); }}>Approve</Btn>
              <Btn variant="reject"  onClick={() => { setDetail(null); openReject(detail); }}>Reject</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget} onClose={() => setRejectTarget(null)}
        title={`Reject "${rejectTarget?.schoolName}"`}
        subtitle="The comment will be saved with the request record."
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: T.textMuted, display: "block", marginBottom: 6 }}>
            Rejection reason (optional)
          </label>
          <Textarea
            value={rejectComment}
            onChange={e => setRejectComment(e.target.value)}
            placeholder="e.g. Incomplete documents, invalid information…"
            rows={3}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setRejectTarget(null)}>Cancel</Btn>
          <Btn
            variant="danger"
            onClick={confirmReject}
            loading={rejectTarget && busy[rejectTarget.id] === "reject"}
          >
            Confirm rejection
          </Btn>
        </div>
      </Modal>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ENROLLED SCHOOLS PAGE
//  GET  /api/schools?page=&size=                     (paginated)
//  GET  /api/schools/{id}                            (single)
//  GET  /api/platform/invoices/school/{id}           (invoices)
//  POST /api/platform/invoices/{id}/pay              (mark paid)
//  POST /api/schools/{id}/suspend?comment=
//  POST /api/schools/{id}/reactivate?comment=
// ══════════════════════════════════════════════════════════════════
function SchoolsPage() {
  const [schools, setSchools]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]     = useState("");

  const [selected, setSelected] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  const [actionBusy, setActionBusy] = useState({});
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendComment, setSuspendComment] = useState("");

  const { toast, show } = useToast();

  const load = useCallback((p = 0) => {
    setLoading(true);
    api.get(`/api/schools/all?page=${p}&size=12`)
      .then(r => {
        const d = r.data;
        // Handle both Page<> and List<> response
        if (d.content) {
          setSchools(d.content);
          setTotalPages(d.totalPages ?? 1);
          setPage(d.number ?? 0);
        } else {
          setSchools(Array.isArray(d) ? d : []);
          setTotalPages(1);
        }
      })
      .catch(() => show("Failed to load schools", "error"))
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => { load(0); }, [load]);

  const openSchool = async (school) => {
    setSelected(school);
    setInvoices([]);
    setInvLoading(true);
    try {
      const r = await api.get(`/api/platform/invoices/school/${school.id}`);
      setInvoices(r.data ?? []);
    } catch { setInvoices([]); }
    finally { setInvLoading(false); }
  };

  const refreshSelected = async (id) => {
    try {
      const r = await api.get(`/api/schools/${id}`);
      setSelected(r.data);
      setSchools(prev => prev.map(s => s.id === id ? r.data : s));
    } catch {}
  };

  const markPaid = async (invoiceId) => {
    setActionBusy(b => ({ ...b, [`i${invoiceId}`]: true }));
    try {
      const r = await api.post(`/api/platform/invoices/${invoiceId}/pay`);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? r.data : inv));
      show("Invoice marked as paid ✓");
    } catch { show("Failed to update invoice", "error"); }
    finally { setActionBusy(b => ({ ...b, [`i${invoiceId}`]: false })); }
  };

  const confirmSuspendAction = async () => {
    if (!suspendModal) return;
    const { school, action } = suspendModal;
    const key = `s${school.id}`;
    setActionBusy(b => ({ ...b, [key]: action }));
    try {
      await api.post(
        `/api/schools/${school.id}/${action}`,
        null,
        { params: suspendComment.trim() ? { comment: suspendComment.trim() } : {} }
      );
      show(action === "suspend"
        ? `"${school.schoolName}" suspended — admin access disabled`
        : `"${school.schoolName}" reactivated ✓`
      );
      setSuspendModal(null);
      await refreshSelected(school.id);
    } catch { show(`Failed to ${action} school`, "error"); }
    finally { setActionBusy(b => ({ ...b, [key]: null })); }
  };

  const filtered = schools.filter(s =>
    !search || s.schoolName?.toLowerCase().includes(search.toLowerCase()) ||
    s.wilaya?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSt = selected?.subscriptionStatus?.toUpperCase();

  return (
    <>
      <ToastUI toast={toast} />
      <PageHeader
        title="Enrolled schools"
        subtitle="Click a school to view details, invoices, and manage subscription"
      />

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or wilaya…"
          style={{
            width: 280, padding: "8px 12px", fontSize: 12,
            border: `0.5px solid ${T.border}`, borderRadius: 8,
            fontFamily: "inherit", color: T.text, outline: "none",
          }}
        />
      </div>

      {loading ? <PageLoader /> : !filtered.length ? (
        <div style={{ textAlign: "center", padding: "64px 0", fontSize: 13, color: T.textMuted }}>
          {search ? `No schools matching "${search}"` : "No enrolled schools yet"}
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12, marginBottom: 16,
          }}>
            {filtered.map(s => {
              const color = subColor(s.subscriptionStatus);
              return (
                <Card
                  key={s.id}
                  onClick={() => openSchool(s)}
                  style={{
                    padding: "16px 18px", cursor: "pointer",
                    borderLeft: `3px solid ${color}`,
                    transition: "box-shadow .15s, transform .15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 3px 16px rgba(0,0,0,.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Avatar name={s.schoolName} color={color} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.schoolName}
                      </div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{s.wilaya}</div>
                    </div>
                  </div>
                  <Pill status={s.subscriptionStatus} small />
                  <div style={{
                    marginTop: 10, display: "flex",
                    justifyContent: "space-between", fontSize: 10, color: T.textMuted,
                  }}>
                    <span>👥 {s.totalStudents ?? "—"} students</span>
                    <span>exp. {fmtDate(s.subscriptionExpiresAt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination page={page} total={totalPages} onChange={p => load(p)} />
        </>
      )}

      {/* School detail modal */}
      <Modal
        open={!!selected} onClose={() => setSelected(null)}
        title={selected?.schoolName}
        subtitle={[selected?.wilaya, selected?.email].filter(Boolean).join(" · ")}
        wide
      >
        {selected && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
            {/* Left — school info */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                School details
              </div>
              <DR label="Owner"       value={selected.ownerName} />
              <DR label="Phone"       value={selected.phone} />
              <DR label="Email"       value={selected.email} />
              <DR label="Location"    value={[selected.wilaya, selected.commune].filter(Boolean).join(", ")} />
              <DR label="Address"     value={selected.address} />
              <DR label="Status"      value={<Pill status={selected.subscriptionStatus} />} />
              <DR label="Expires"     value={fmtDate(selected.subscriptionExpiresAt)} />
              <DR label="Students"    value={selected.totalStudents ?? "—"} />
              <DR label="Teachers"    value={selected.totalTeachers ?? "—"} />
              <DR label="Month revenue" value={fmt(selected.currentMonthRevenue)} />
              <DR label="Created"     value={fmtDate(selected.createdAt)} />

              <Divider my={14} />

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedSt !== "SUSPENDED" && selectedSt !== "EXPIRED" && (
                  <Btn
                    variant="suspend"
                    onClick={() => { setSuspendModal({ school: selected, action: "suspend" }); setSuspendComment(""); }}
                    loading={actionBusy[`s${selected.id}`] === "suspend"}
                    size="sm"
                  >
                    🔒 Suspend
                  </Btn>
                )}
                {selectedSt === "SUSPENDED" && (
                  <Btn
                    variant="reactivate"
                    onClick={() => { setSuspendModal({ school: selected, action: "reactivate" }); setSuspendComment(""); }}
                    loading={actionBusy[`s${selected.id}`] === "reactivate"}
                    size="sm"
                  >
                    🔓 Reactivate
                  </Btn>
                )}
              </div>
            </div>

            {/* Right — invoices */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                Subscription invoices
              </div>
              {invLoading ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}><Spinner size={20} color={T.blue600} /></div>
              ) : !invoices.length ? (
                <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: T.textMuted }}>
                  No invoices yet
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <Th>Year</Th><Th>Plan</Th>
                        <Th align="right">Amount</Th>
                        <Th>Due</Th><Th>Status</Th><Th></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id}>
                          <Td>
                            <div style={{ fontSize: 11, fontWeight: 500 }}>{inv.academicYear}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{inv.period}</div>
                          </Td>
                          <Td><Pill status={inv.plan} small /></Td>
                          <Td align="right" mono>{fmt(inv.amount)}</Td>
                          <Td muted>{fmtDate(inv.dueDate)}</Td>
                          <Td><Pill status={inv.status} small /></Td>
                          <Td>
                            {inv.status?.toUpperCase() !== "PAID" ? (
                              <Btn
                                variant="pay" size="sm"
                                onClick={() => markPaid(inv.id)}
                                loading={actionBusy[`i${inv.id}`]}
                              >
                                Mark paid
                              </Btn>
                            ) : (
                              <span style={{ fontSize: 10, color: T.textMuted }}>
                                {fmtDate(inv.paidAt)}
                              </span>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Suspend / Reactivate confirm modal */}
      <Modal
        open={!!suspendModal} onClose={() => setSuspendModal(null)}
        title={suspendModal?.action === "suspend"
          ? `Suspend "${suspendModal?.school?.schoolName}"`
          : `Reactivate "${suspendModal?.school?.schoolName}"`}
        subtitle={suspendModal?.action === "suspend"
          ? "This disables the school admin's login immediately."
          : "This restores the school admin's access."}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: T.textMuted, display: "block", marginBottom: 6 }}>
            Reason / note (optional)
          </label>
          <Textarea
            value={suspendComment}
            onChange={e => setSuspendComment(e.target.value)}
            placeholder="Internal note…"
            rows={3}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setSuspendModal(null)}>Cancel</Btn>
          <Btn
            variant={suspendModal?.action === "suspend" ? "danger" : "approve"}
            onClick={confirmSuspendAction}
            loading={suspendModal && actionBusy[`s${suspendModal?.school?.id}`]}
          >
            {suspendModal?.action === "suspend" ? "Confirm suspension" : "Confirm reactivation"}
          </Btn>
        </div>
      </Modal>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  AUDIT LOG PAGE
//  GET /api/platform/audit?page=&size=20 → Page<SuperAdminAction>
//  (if endpoint doesn't exist yet, shows a placeholder)
// ══════════════════════════════════════════════════════════════════
const ACTION_LABELS = {
  APPROVE_SCHOOL_REQUEST: { label: "Approved request",    icon: "✅", color: T.green600  },
  REJECT_SCHOOL_REQUEST:  { label: "Rejected request",    icon: "❌", color: T.red600    },
  SUSPEND_SCHOOL:         { label: "Suspended school",    icon: "🔒", color: T.red600    },
  REACTIVATE_SCHOOL:      { label: "Reactivated school",  icon: "🔓", color: T.green600  },
  UPGRADE_SUBSCRIPTION:   { label: "Upgraded plan",       icon: "⬆️", color: T.blue600   },
  DOWNGRADE_SUBSCRIPTION: { label: "Downgraded plan",     icon: "⬇️", color: T.amber600  },
  MARK_INVOICE_PAID:      { label: "Marked invoice paid", icon: "💰", color: T.blue600   },
  EXPIRE_SCHOOL:          { label: "Expired school",      icon: "⛔", color: T.red400    },
};

function AuditPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [noEndpoint, setNoEndpoint] = useState(false);
  const { toast, show } = useToast();

  const load = useCallback((p = 0) => {
    setLoading(true);
    api.get(`/api/platform/audit?page=${p}&size=20`)
      .then(r => {
        const d = r.data;
        if (d.content) {
          setRows(d.content);
          setTotalPages(d.totalPages ?? 1);
          setPage(d.number ?? 0);
        } else {
          setRows(Array.isArray(d) ? d : []);
        }
      })
      .catch(err => {
        if (err?.response?.status === 404) setNoEndpoint(true);
        else show("Failed to load audit log", "error");
      })
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => { load(0); }, [load]);

  return (
    <>
      <ToastUI toast={toast} />
      <PageHeader title="Audit log" subtitle="All super admin actions, newest first" />

      {noEndpoint ? (
        <Card style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛠️</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 8 }}>
            Audit endpoint not available yet
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 320, margin: "0 auto" }}>
            Add <code style={{ background: T.bg, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
              GET /api/platform/audit
            </code> to your <code style={{ background: T.bg, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
              PlatformController
            </code> returning a paginated list of <code style={{ background: T.bg, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
              SuperAdminAction
            </code>.
          </div>
        </Card>
      ) : loading ? <PageLoader /> : (
        <Card style={{ padding: "18px 20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th width={160}>Action</Th>
                <Th>Target</Th>
                <Th>Comment</Th>
                <Th>Performed at</Th>
              </tr>
            </thead>
            <tbody>
              {!rows.length ? (
                <EmptyRow cols={4} msg="No actions recorded yet" />
              ) : rows.map(r => {
                const meta = ACTION_LABELS[r.actionType] || { label: r.actionType, icon: "•", color: T.gray600 };
                return (
                  <tr key={r.id}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{meta.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div style={{ fontSize: 11, fontWeight: 500 }}>{r.targetEntityType}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>ID: {r.targetEntityId}</div>
                    </Td>
                    <Td muted>{r.comment || "—"}</Td>
                    <Td muted>{fmtDT(r.performedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} total={totalPages} onChange={p => load(p)} />
        </Card>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SHARED LOADING / ERROR
// ══════════════════════════════════════════════════════════════════
const PageLoader = () => (
  <div style={{ textAlign: "center", padding: "80px 0" }}>
    <Spinner size={28} color={T.blue600} />
    <div style={{ marginTop: 12, fontSize: 12, color: T.textMuted }}>Loading…</div>
  </div>
);

const PageError = ({ msg }) => (
  <div style={{ textAlign: "center", padding: "80px 0" }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
    <div style={{ fontSize: 13, color: T.red600 }}>{msg}</div>
  </div>
);

// ══════════════════════════════════════════════════════════════════
//  NAV CONFIG
// ══════════════════════════════════════════════════════════════════
const NAV = [
  { key: "overview",  icon: "📊", label: "Overview"         },
  { key: "requests",  icon: "📋", label: "School requests",  badge: true },
  { key: "schools",   icon: "🏫", label: "Enrolled schools"  },
  { key: "audit",     icon: "🗂️",  label: "Audit log"        },
];

// ══════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [pendingCount, setPendingCount] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const routerNavigate = useNavigate();

  useEffect(() => {
    api.get("/api/platform/dashboard")
      .then(r => setPendingCount(r.data?.pendingRequests ?? 0))
      .catch(() => {});
  }, []);

  // Refresh badge after approving / rejecting on requests page
  const refreshBadge = () => {
    api.get("/api/platform/dashboard")
      .then(r => setPendingCount(r.data?.pendingRequests ?? 0))
      .catch(() => {});
  };

  const navigate = (key) => {
    setActivePage(key);
    if (key === "overview" || key === "requests") refreshBadge();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      routerNavigate("/login");
    }
  };

  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: T.bg, color: T.text,
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 224, minWidth: 224,
        background: T.white,
        borderRight: `0.5px solid ${T.border}`,
        display: "flex", flexDirection: "column",
      }}>
        {/* Brand */}
        <div style={{
          padding: "18px 18px 14px",
          borderBottom: `0.5px solid ${T.border}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: T.blue600,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>
            🏫
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>ScPlatform</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Super Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {NAV.map(n => {
            const active = activePage === n.key;
            return (
              <button
                key={n.key}
                onClick={() => navigate(n.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  width: "100%", padding: "8px 10px",
                  border: "none", borderRadius: 8,
                  cursor: "pointer", fontFamily: "inherit",
                  marginBottom: 2, textAlign: "left",
                  fontSize: 13,
                  background: active ? T.blue50 : "transparent",
                  color: active ? T.blue600 : T.textSub,
                  fontWeight: active ? 500 : 400,
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.bg; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 15 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge && pendingCount > 0 && (
                  <span style={{
                    background: T.blue600, color: T.white,
                    fontSize: 10, fontWeight: 600,
                    padding: "1px 7px", borderRadius: 99,
                    minWidth: 18, textAlign: "center",
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer — user info + logout */}
        <div style={{
          padding: "12px 18px",
          borderTop: `0.5px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 10, color: T.textMuted }}>Signed in as</div>
          <div style={{
            fontSize: 12, fontWeight: 500, color: T.text,
            marginTop: 2, marginBottom: 10,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {user?.fullName || user?.email || "Super Admin"}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              width: "100%", padding: "7px 10px",
              border: `0.5px solid ${T.border}`, borderRadius: 8,
              background: "transparent", color: T.red600,
              fontFamily: "inherit", fontSize: 12, fontWeight: 500,
              cursor: loggingOut ? "not-allowed" : "pointer",
              opacity: loggingOut ? 0.6 : 1,
              transition: "background .1s",
            }}
            onMouseEnter={e => { if (!loggingOut) e.currentTarget.style.background = T.red50; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {loggingOut ? <Spinner size={12} color={T.red600} /> : "🚪"} Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {activePage === "overview" && <OverviewPage onNavigate={navigate} />}
        {activePage === "requests" && <RequestsPage />}
        {activePage === "schools"  && <SchoolsPage />}
        {activePage === "audit"    && <AuditPage />}
      </main>
    </div>
  );
}