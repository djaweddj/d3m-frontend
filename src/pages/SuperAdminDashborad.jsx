import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import api from "../api";

// ══════════════════════════════════════════════════════════════════
//  DESIGN TOKENS — "the ledger"
//  Warm paper + ink + a single working accent per meaning.
//  No cool grays, no SaaS-blue defaults.
// ══════════════════════════════════════════════════════════════════
const T = {
  paper:     "#F6F4EF",
  paperRaised: "#FFFFFF",
  ink:       "#1B1A17",
  inkSoft:   "#6B6858",
  inkFaint:  "#9A9686",
  line:      "#E4E0D3",
  lineStrong:"#CFC9B6",

  signal:    "#1E5F4A", // approve / paid / active — ledger green
  signalBg:  "#E7EFE9",
  flag:      "#A13D2E", // reject / suspend / overdue — clay red
  flagBg:    "#F3E7E3",
  amber:     "#9C6B14", // pending / trial
  amberBg:   "#F3EADA",
  slate:     "#5B5748", // neutral / expired / cancelled
  slateBg:   "#EAE7DC",

  serif: "Georgia, 'Iowan Old Style', ui-serif, serif",
  sans:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

// ══════════════════════════════════════════════════════════════════
//  STATUS → STAMP (signature element)
//  Rendered like a registrar's rubber stamp: slight rotation,
//  monospace tracking, colored ink. Used everywhere status appears.
// ══════════════════════════════════════════════════════════════════
const STATUS_MAP = {
  PENDING:    { c: T.amber,  bg: T.amberBg, label: "Pending"    },
  APPROVED:   { c: T.signal, bg: T.signalBg,label: "Approved"   },
  REJECTED:   { c: T.slate,  bg: T.slateBg, label: "Rejected"   },
  ACTIVE:     { c: T.signal, bg: T.signalBg,label: "Active"     },
  TRIAL:      { c: T.amber,  bg: T.amberBg, label: "Trial"      },
  SUSPENDED:  { c: T.flag,   bg: T.flagBg,  label: "Suspended"  },
  EXPIRED:    { c: T.flag,   bg: T.flagBg,  label: "Expired"    },
  PAID:       { c: T.signal, bg: T.signalBg,label: "Paid"       },
  OVERDUE:    { c: T.flag,   bg: T.flagBg,  label: "Overdue"    },
  CANCELLED:  { c: T.slate,  bg: T.slateBg, label: "Cancelled"  },
  BASIC:      { c: T.slate,  bg: T.slateBg, label: "Basic"      },
  PRO:        { c: T.signal, bg: T.signalBg,label: "Pro"        },
  ENTERPRISE: { c: T.amber,  bg: T.amberBg, label: "Enterprise" },
};

const Stamp = ({ status, size = "md" }) => {
  const s = STATUS_MAP[status?.toUpperCase()] || { c: T.inkSoft, bg: T.slateBg, label: status ?? "—" };
  const small = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontFamily: T.sans,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: small ? "3px 8px" : "4px 10px",
      borderRadius: 4,
      color: s.c,
      background: s.bg,
      border: `1px solid ${s.c}30`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ══════════════════════════════════════════════════════════════════
const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: T.paperRaised,
      border: `1px solid ${T.line}`,
      borderRadius: 10,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ children, right }) => (
  <div style={{
    display: "flex", alignItems: "baseline", justifyContent: "space-between",
    marginBottom: 12, gap: 10, flexWrap: "wrap",
  }}>
    <span style={{
      fontFamily: T.sans, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkSoft,
    }}>{children}</span>
    {right}
  </div>
);

const BTN = {
  primary:    { bg: T.ink,      color: T.paper,  border: T.ink   },
  approve:    { bg: T.signal,   color: "#fff",   border: T.signal},
  reject:     { bg: "transparent", color: T.flag, border: T.flag },
  pay:        { bg: T.signal,   color: "#fff",   border: T.signal},
  suspend:    { bg: "transparent", color: T.flag, border: T.flag },
  reactivate: { bg: T.signal,   color: "#fff",   border: T.signal},
  ghost:      { bg: "transparent", color: T.ink,  border: T.lineStrong },
  danger:     { bg: T.flag,     color: "#fff",   border: T.flag  },
};

const Btn = ({ children, variant = "ghost", onClick, disabled, loading, size = "md", full }) => {
  const s = BTN[variant] || BTN.ghost;
  const pad = size === "sm" ? "7px 12px" : size === "lg" ? "13px 22px" : "9px 16px";
  const fs  = size === "sm" ? 12 : size === "lg" ? 14 : 13;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: pad, fontSize: fs, fontWeight: 600,
        fontFamily: T.sans,
        border: `1.5px solid ${s.border}`,
        borderRadius: 7, cursor: disabled || loading ? "not-allowed" : "pointer",
        background: s.bg, color: s.color,
        opacity: disabled || loading ? 0.5 : 1,
        whiteSpace: "nowrap",
        width: full ? "100%" : undefined,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        minHeight: 38, // touch target
        transition: "opacity .15s, transform .08s",
      }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = "scale(.97)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {loading ? <Spinner size={13} /> : children}
    </button>
  );
};

const Spinner = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
  </svg>
);

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
      position: "fixed", bottom: "calc(64px + env(safe-area-inset-bottom) + 12px)", left: 16, right: 16, zIndex: 999,
      maxWidth: 380, margin: "0 auto",
      background: T.ink, color: T.paper,
      borderRadius: 9, padding: "12px 16px",
      fontFamily: T.sans, fontSize: 13, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
      animation: "toastIn .25s ease",
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <span style={{ color: ok ? "#7FD4A8" : "#E89B8F", fontSize: 15 }}>{ok ? "✓" : "✕"}</span>
      {toast.msg}
    </div>
  );
};

// Bottom sheet on mobile, centered modal on desktop
const Modal = ({ open, onClose, title, subtitle, children, wide }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(27,26,23,.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={onClose}
      className="sa-modal-overlay"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="sa-modal-panel"
        style={{
          background: T.paper,
          borderRadius: "16px 16px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          width: "100%",
          maxWidth: wide ? 680 : 460,
          maxHeight: "86vh",
          overflowY: "auto",
          animation: "sheetIn .22s cubic-bezier(.2,.8,.3,1)",
        }}
      >
        <style>{`
          @keyframes sheetIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
          .sa-modal-panel { border: 1px solid ${T.line}; }
          @media (min-width: 720px) {
            .sa-modal-overlay { align-items: center; }
            .sa-modal-panel { border-radius: 14px; }
          }
        `}</style>
        <div style={{
          width: 36, height: 4, borderRadius: 99, background: T.lineStrong,
          margin: "0 auto 16px", display: "block",
        }} className="sa-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.serif, fontSize: 18, color: T.ink, wordBreak: "break-word" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, fontSize: 22, lineHeight: 1, padding: 4, flexShrink: 0 }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const DR = ({ label, value }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
    padding: "10px 0", borderBottom: `1px solid ${T.line}`,
  }}>
    <span style={{ fontSize: 12, color: T.inkSoft, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, textAlign: "right" }}>{value ?? "—"}</span>
  </div>
);

const StatCard = ({ label, value, sub, color = T.ink }) => (
  <Card style={{ padding: "14px 16px", borderLeft: `3px solid ${color}` }}>
    <div style={{ fontFamily: T.sans, fontSize: 10, color: T.inkSoft, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
    <div style={{ fontFamily: T.serif, fontSize: 26, color: T.ink, lineHeight: 1 }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 5 }}>{sub}</div>}
  </Card>
);

const Avatar = ({ name = "", color = T.ink, size = 36 }) => {
  const ini = name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: `${color}14`, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: T.serif, fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {ini}
    </div>
  );
};

const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{
      width: "100%", padding: "11px 12px", fontSize: 13,
      border: `1px solid ${T.line}`, borderRadius: 8,
      fontFamily: T.sans, color: T.ink, background: T.paperRaised,
      resize: "vertical", boxSizing: "border-box", outline: "none",
    }}
  />
);

const NumberInput = ({ value, onChange, placeholder }) => (
  <input
    type="number" inputMode="decimal" value={value} onChange={onChange} placeholder={placeholder}
    style={{
      width: "100%", padding: "11px 12px", fontSize: 13,
      border: `1px solid ${T.line}`, borderRadius: 8,
      fontFamily: T.sans, color: T.ink, background: T.paperRaised,
      boxSizing: "border-box", outline: "none",
    }}
  />
);

const Divider = ({ my = 16 }) => (
  <div style={{ height: 1, background: T.line, margin: `${my}px 0` }} />
);

const Pagination = ({ page, total, onChange }) => (
  total <= 1 ? null :
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 18 }}>
    <Btn onClick={() => onChange(page - 1)} disabled={page === 0} size="sm">←</Btn>
    <span style={{ fontSize: 12, color: T.inkSoft, fontFamily: T.sans }}>Page {page + 1} of {total}</span>
    <Btn onClick={() => onChange(page + 1)} disabled={page >= total - 1} size="sm">→</Btn>
  </div>
);

const fmt     = n  => n != null ? Number(n).toLocaleString("fr-DZ") + " DZD" : "—";
const fmtDate = d  => d ? new Date(d).toLocaleDateString("fr-DZ", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDT   = d  => d ? new Date(d).toLocaleString("fr-DZ",    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const subColor = s => ({
  ACTIVE: T.signal, TRIAL: T.amber, SUSPENDED: T.flag, EXPIRED: T.flag,
})[s?.toUpperCase()] || T.slate;

const PageHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <h1 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, color: T.ink, margin: 0 }}>{title}</h1>
    {subtitle && <p style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft, margin: "5px 0 0" }}>{subtitle}</p>}
  </div>
);

const PageLoader = () => (
  <div style={{ textAlign: "center", padding: "80px 0" }}>
    <Spinner size={26} color={T.ink} />
    <div style={{ marginTop: 12, fontSize: 12, color: T.inkSoft, fontFamily: T.sans }}>Loading…</div>
  </div>
);

const PageError = ({ msg }) => (
  <div style={{ textAlign: "center", padding: "80px 0" }}>
    <div style={{ fontSize: 30, marginBottom: 10 }}>⚠</div>
    <div style={{ fontSize: 13, color: T.flag, fontFamily: T.sans }}>{msg}</div>
  </div>
);

// Responsive row: table on desktop, stacked card on mobile — driven by CSS, not JS,
// so it works without a resize listener.
const RTable = ({ head, children }) => (
  <div>
    <table className="sa-rtable" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{head}</tr></thead>
      <tbody>{children}</tbody>
    </table>
    <style>{`
      @media (max-width: 680px) {
        table.sa-rtable thead { display: none; }
        table.sa-rtable, table.sa-rtable tbody, table.sa-rtable tr, table.sa-rtable td {
          display: block; width: 100%; box-sizing: border-box;
        }
        table.sa-rtable tr {
          border: 1px solid ${T.line}; border-radius: 10px; margin-bottom: 10px;
          padding: 10px 12px; background: ${T.paperRaised};
        }
        table.sa-rtable td {
          border-bottom: none !important; padding: 5px 0 !important;
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
        }
        table.sa-rtable td[data-label]::before {
          content: attr(data-label);
          font-family: ${T.sans}; font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; color: ${T.inkFaint};
          flex-shrink: 0;
        }
        table.sa-rtable td[data-label=""]::before { content: none; }
      }
    `}</style>
  </div>
);

const Th = ({ children, align = "left", width }) => (
  <th style={{
    textAlign: align, padding: "8px 12px",
    fontFamily: T.sans, fontSize: 10, fontWeight: 700, color: T.inkFaint,
    borderBottom: `1px solid ${T.line}`,
    textTransform: "uppercase", letterSpacing: "0.06em",
    whiteSpace: "nowrap", width,
  }}>{children}</th>
);
const Td = ({ children, align = "left", muted, mono, label = "" }) => (
  <td data-label={label} style={{
    padding: "10px 12px", fontSize: 12.5, fontFamily: T.sans,
    color: muted ? T.inkSoft : T.ink,
    textAlign: align, verticalAlign: "middle",
    borderBottom: `1px solid ${T.line}`,
    fontVariantNumeric: mono ? "tabular-nums" : "normal",
  }}>{children}</td>
);
const EmptyRow = ({ msg = "Nothing here" }) => (
  <tr><td style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: T.inkFaint, fontFamily: T.sans, display: "block", border: "none" }}>{msg}</td></tr>
);

// ══════════════════════════════════════════════════════════════════
//  OVERVIEW
//  GET /api/platform/dashboard
// ══════════════════════════════════════════════════════════════════
function OverviewPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get("/api/platform/dashboard")
      .then(r => setData(r.data))
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (err) return <PageError msg="Could not load the dashboard." />;

  const stats = [
    { label: "Total schools", value: data?.totalSchools, color: T.ink },
    { label: "Active",        value: data?.activeSchools, color: T.signal },
    { label: "Trial",         value: data?.trialSchools, color: T.amber },
    { label: "Suspended",     value: data?.suspendedSchools, color: T.flag },
    { label: "Expired",       value: data?.expiredSchools, color: T.flag },
    { label: "Pending requests", value: data?.pendingRequests, color: T.amber, sub: "Awaiting review" },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle="Platform health at a glance" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }} className="sa-revenue-grid">
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
            Revenue — current year
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 26, color: T.signal }}>{fmt(data?.currentYearRevenue)}</div>
        </Card>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontFamily: T.sans, fontSize: 10, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
            All-time revenue
          </div>
          <div style={{ fontFamily: T.serif, fontSize: 26, color: T.ink }}>{fmt(data?.allTimeRevenue)}</div>
        </Card>
      </div>
      <style>{`@media (max-width: 560px){ .sa-revenue-grid { grid-template-columns: 1fr; } }`}</style>

      <Card style={{ padding: "16px", marginBottom: 14 }}>
        <SectionLabel
          right={data?.pendingRequests > 0 && <Btn size="sm" onClick={() => onNavigate("requests")}>Review all →</Btn>}
        >
          Pending school requests ({data?.pendingRequests ?? 0})
        </SectionLabel>
        {!data?.pendingSchoolRequests?.length ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: T.inkFaint, fontFamily: T.sans }}>All clear ✓</div>
        ) : (
          <RTable head={<><Th>School</Th><Th>Owner</Th><Th>Location</Th><Th>Submitted</Th><Th>Status</Th></>}>
            {data.pendingSchoolRequests.slice(0, 5).map(r => (
              <tr key={r.id}>
                <Td label="School">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.schoolName}</div>
                    <div style={{ fontSize: 10, color: T.inkFaint }}>{r.email}</div>
                  </div>
                </Td>
                <Td label="Owner" muted>{r.ownerFullName}</Td>
                <Td label="Location" muted>{[r.wilaya, r.commune].filter(Boolean).join(", ")}</Td>
                <Td label="Submitted" muted>{fmtDate(r.createdAt)}</Td>
                <Td label="Status"><Stamp status={r.status} size="sm" /></Td>
              </tr>
            ))}
          </RTable>
        )}
      </Card>

      <Card style={{ padding: "16px" }}>
        <SectionLabel right={<Btn size="sm" onClick={() => onNavigate("schools")}>Manage →</Btn>}>
          Recent subscription invoices
        </SectionLabel>
        {!data?.recentInvoices?.length ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: T.inkFaint, fontFamily: T.sans }}>No invoices yet</div>
        ) : (
          <RTable head={<><Th>School</Th><Th>Year</Th><Th>Plan</Th><Th align="right">Amount</Th><Th>Due</Th><Th>Status</Th></>}>
            {data.recentInvoices.slice(0, 6).map(inv => (
              <tr key={inv.id}>
                <Td label="School"><span style={{ fontWeight: 600 }}>{inv.schoolName}</span></Td>
                <Td label="Year" muted>{inv.academicYear}</Td>
                <Td label="Plan"><Stamp status={inv.plan} size="sm" /></Td>
                <Td label="Amount" align="right" mono>{fmt(inv.amount)}</Td>
                <Td label="Due" muted>{fmtDate(inv.dueDate)}</Td>
                <Td label="Status"><Stamp status={inv.status} size="sm" /></Td>
              </tr>
            ))}
          </RTable>
        )}
      </Card>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SCHOOL REQUESTS
//  GET  /api/school-requests/pending?page=&size=10
//  POST /api/school-requests/{id}/approve
//  POST /api/school-requests/{id}/reject?comment=
// ══════════════════════════════════════════════════════════════════
function RequestsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState({});
  const [detail, setDetail] = useState(null);
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
      .catch((e) => {
        if (e?.response?.status === 429) {
          show("Too many requests — please wait a moment and try again", "error");
        } else {
          show("Couldn't load requests", "error");
        }
      })
      .finally(() => setLoading(false));
  }, [show]);

  // Load once on mount only — do NOT put `load` in deps here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(0); }, []);

  const approve = async (req) => {
    setBusy(b => ({ ...b, [req.id]: "approve" }));
    try {
      await api.post(`/api/school-requests/${req.id}/approve`);
      show(`"${req.schoolName}" approved — account created ✓`);
      load(page);
    } catch (e) {
      show(e?.response?.data?.message || "Couldn't approve", "error");
    } finally { setBusy(b => ({ ...b, [req.id]: null })); }
  };

  const openReject = (req) => { setRejectTarget(req); setRejectComment(""); };

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
    } catch { show("Couldn't reject", "error"); }
    finally { setBusy(b => ({ ...b, [rejectTarget.id]: null })); }
  };

  return (
    <>
      <ToastUI toast={toast} />
      <PageHeader title="School requests" subtitle="Review incoming registration requests" />

      <Card style={{ padding: 16 }}>
        {loading ? <PageLoader /> : !rows.length ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12.5, color: T.inkFaint, fontFamily: T.sans }}>No pending requests ✓</div>
        ) : (
          <RTable head={<><Th>School</Th><Th>Owner</Th><Th>Contact</Th><Th>Location</Th><Th>Submitted</Th><Th>Actions</Th></>}>
            {rows.map(r => (
              <tr key={r.id}>
                <Td label="">
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={r.schoolName} size={32} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.schoolName}</div>
                      <div style={{ fontSize: 10, color: T.inkFaint }}>{r.email}</div>
                    </div>
                  </div>
                </Td>
                <Td label="Owner" muted>{r.ownerFullName}</Td>
                <Td label="Phone" muted>{r.phone}</Td>
                <Td label="Location" muted>{[r.wilaya, r.commune].filter(Boolean).join(", ")}</Td>
                <Td label="Submitted" muted>{fmtDate(r.createdAt)}</Td>
                <Td label="">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Btn size="sm" onClick={() => setDetail(r)}>View</Btn>
                    <Btn variant="approve" size="sm" onClick={() => approve(r)} loading={busy[r.id] === "approve"} disabled={!!busy[r.id]}>Approve</Btn>
                    <Btn variant="reject" size="sm" onClick={() => openReject(r)} loading={busy[r.id] === "reject"} disabled={!!busy[r.id]}>Reject</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </RTable>
        )}
        <Pagination page={page} total={totalPages} onChange={p => load(p)} />
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.schoolName} subtitle={detail?.email}>
        {detail && (
          <>
            <DR label="Owner" value={detail.ownerFullName} />
            <DR label="Phone" value={detail.phone} />
            <DR label="Email" value={detail.email} />
            <DR label="Wilaya" value={detail.wilaya} />
            <DR label="Commune" value={detail.commune} />
            <DR label="Address" value={detail.address} />
            <DR label="Submitted" value={fmtDT(detail.createdAt)} />
            <DR label="Status" value={<Stamp status={detail.status} />} />
            <Divider />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Btn onClick={() => setDetail(null)}>Close</Btn>
              <Btn variant="approve" onClick={() => { setDetail(null); approve(detail); }}>Approve</Btn>
              <Btn variant="reject" onClick={() => { setDetail(null); openReject(detail); }}>Reject</Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title={`Reject "${rejectTarget?.schoolName}"`} subtitle="Saved with the request record.">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: T.inkSoft, display: "block", marginBottom: 6, fontFamily: T.sans }}>Reason (optional)</label>
          <Textarea value={rejectComment} onChange={e => setRejectComment(e.target.value)} placeholder="e.g. Incomplete documents, invalid information…" rows={3} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setRejectTarget(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={confirmReject} loading={rejectTarget && busy[rejectTarget.id] === "reject"}>Confirm rejection</Btn>
        </div>
      </Modal>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ENROLLED SCHOOLS
//  GET  /api/schools/all?page=&size=
//  GET  /api/schools/{id}
//  GET  /api/platform/invoices/school/{id}
//  POST /api/platform/invoices/{id}/pay
//  POST /api/platform/invoices/{id}/price?amount=
//  POST /api/schools/{id}/suspend?comment=
//  POST /api/schools/{id}/reactivate?comment=
// ══════════════════════════════════════════════════════════════════
function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  const [actionBusy, setActionBusy] = useState({});
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendComment, setSuspendComment] = useState("");
  const [priceModal, setPriceModal] = useState(null); // invoice being repriced
  const [priceValue, setPriceValue] = useState("");

  const { toast, show } = useToast();

  const load = useCallback((p = 0) => {
    setLoading(true);
    api.get(`/api/schools/all?page=${p}&size=12`)
      .then(r => {
        const d = r.data;
        if (d.content) {
          setSchools(d.content);
          setTotalPages(d.totalPages ?? 1);
          setPage(d.number ?? 0);
        } else {
          setSchools(Array.isArray(d) ? d : []);
          setTotalPages(1);
        }
      })
      .catch((e) => {
        if (e?.response?.status === 429) {
          show("Too many requests — please wait a moment and try again", "error");
        } else {
          show("Couldn't load schools", "error");
        }
      })
      .finally(() => setLoading(false));
  }, [show]);

  // Load once on mount only — do NOT put `load` in deps here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(0); }, []);

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
    } catch { show("Couldn't update invoice", "error"); }
    finally { setActionBusy(b => ({ ...b, [`i${invoiceId}`]: false })); }
  };

  const openPriceModal = (inv) => { setPriceModal(inv); setPriceValue(inv.amount ?? ""); };

  const confirmPrice = async () => {
    if (!priceModal) return;
    const amount = Number(priceValue);
    if (!priceValue || isNaN(amount) || amount <= 0) {
      show("Enter a valid amount", "error");
      return;
    }
    setActionBusy(b => ({ ...b, [`ip${priceModal.id}`]: true }));
    try {
      const r = await api.post(`/api/platform/invoices/${priceModal.id}/price`, null, { params: { amount } });
      setInvoices(prev => prev.map(inv => inv.id === priceModal.id ? r.data : inv));
      show("Invoice amount updated ✓");
      setPriceModal(null);
    } catch (e) {
      show(e?.response?.data?.message || "Couldn't update price", "error");
    } finally { setActionBusy(b => ({ ...b, [`ip${priceModal.id}`]: false })); }
  };

  const confirmSuspendAction = async () => {
    if (!suspendModal) return;
    const { school, action } = suspendModal;
    const key = `s${school.id}`;
    setActionBusy(b => ({ ...b, [key]: action }));
    try {
      await api.post(`/api/schools/${school.id}/${action}`, null, {
        params: suspendComment.trim() ? { comment: suspendComment.trim() } : {},
      });
      show(action === "suspend"
        ? `"${school.schoolName}" suspended — admin access disabled`
        : `"${school.schoolName}" reactivated ✓`);
      setSuspendModal(null);
      await refreshSelected(school.id);
    } catch { show(`Couldn't ${action} school`, "error"); }
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
      <PageHeader title="Enrolled schools" subtitle="Tap a school to view details, invoices, and manage its subscription" />

      <div style={{ marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or wilaya…"
          style={{
            width: "100%", maxWidth: 320, padding: "10px 12px", fontSize: 13,
            border: `1px solid ${T.line}`, borderRadius: 8, boxSizing: "border-box",
            fontFamily: T.sans, color: T.ink, outline: "none", background: T.paperRaised,
          }}
        />
      </div>

      {loading ? <PageLoader /> : !filtered.length ? (
        <div style={{ textAlign: "center", padding: "64px 0", fontSize: 13, color: T.inkFaint, fontFamily: T.sans }}>
          {search ? `No schools matching "${search}"` : "No enrolled schools yet"}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
            {filtered.map(s => {
              const color = subColor(s.subscriptionStatus);
              return (
                <Card key={s.id} onClick={() => openSchool(s)} style={{ padding: "15px 16px", cursor: "pointer", borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Avatar name={s.schoolName} color={color} size={34} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.schoolName}</div>
                      <div style={{ fontSize: 10, color: T.inkFaint }}>{s.wilaya}</div>
                    </div>
                  </div>
                  <Stamp status={s.subscriptionStatus} size="sm" />
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.inkFaint, fontFamily: T.sans }}>
                    <span>{s.totalStudents ?? "—"} students</span>
                    <span>exp. {fmtDate(s.subscriptionExpiresAt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination page={page} total={totalPages} onChange={p => load(p)} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.schoolName} subtitle={[selected?.wilaya, selected?.email].filter(Boolean).join(" · ")} wide>
        {selected && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }} className="sa-school-detail">
            <style>{`@media (max-width: 640px){ .sa-school-detail { grid-template-columns: 1fr; gap: 24px 0; } }`}</style>
            <div>
              <SectionLabel>School details</SectionLabel>
              <DR label="Owner" value={selected.ownerName} />
              <DR label="Phone" value={selected.phone} />
              <DR label="Email" value={selected.email} />
              <DR label="Location" value={[selected.wilaya, selected.commune].filter(Boolean).join(", ")} />
              <DR label="Address" value={selected.address} />
              <DR label="Status" value={<Stamp status={selected.subscriptionStatus} />} />
              <DR label="Expires" value={fmtDate(selected.subscriptionExpiresAt)} />
           
            
              <DR label="Created" value={fmtDate(selected.createdAt)} />

              <Divider my={14} />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedSt !== "SUSPENDED" && selectedSt !== "EXPIRED" && (
                  <Btn variant="suspend" onClick={() => { setSuspendModal({ school: selected, action: "suspend" }); setSuspendComment(""); }} loading={actionBusy[`s${selected.id}`] === "suspend"} size="sm">Suspend</Btn>
                )}
                {selectedSt === "SUSPENDED" && (
                  <Btn variant="reactivate" onClick={() => { setSuspendModal({ school: selected, action: "reactivate" }); setSuspendComment(""); }} loading={actionBusy[`s${selected.id}`] === "reactivate"} size="sm">Reactivate</Btn>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>Subscription invoices</SectionLabel>
              {invLoading ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}><Spinner size={20} color={T.ink} /></div>
              ) : !invoices.length ? (
                <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: T.inkFaint, fontFamily: T.sans }}>No invoices yet</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                  {invoices.map(inv => {
                    const editable = !["PAID", "CANCELLED"].includes(inv.status?.toUpperCase());
                    return (
                      <div key={inv.id} style={{ border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{inv.academicYear}</div>
                            <div style={{ fontSize: 10, color: T.inkFaint }}>{inv.period}</div>
                          </div>
                          <Stamp status={inv.status} size="sm" />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 8 }}>
                          <span style={{ color: T.inkSoft }}>Due {fmtDate(inv.dueDate)}</span>
                          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Stamp status={inv.plan} size="sm" />
                          <div style={{ flex: 1 }} />
                          {inv.status?.toUpperCase() !== "PAID" ? (
                            <>
                              {editable && (
                                <Btn size="sm" onClick={() => openPriceModal(inv)}>Edit price</Btn>
                              )}
                              <Btn variant="pay" size="sm" onClick={() => markPaid(inv.id)} loading={actionBusy[`i${inv.id}`]}>Mark paid</Btn>
                            </>
                          ) : (
                            <span style={{ fontSize: 10, color: T.inkFaint, fontFamily: T.sans }}>Paid {fmtDate(inv.paidAt)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!suspendModal} onClose={() => setSuspendModal(null)}
        title={suspendModal?.action === "suspend" ? `Suspend "${suspendModal?.school?.schoolName}"` : `Reactivate "${suspendModal?.school?.schoolName}"`}
        subtitle={suspendModal?.action === "suspend" ? "Disables the school admin's login immediately." : "Restores the school admin's access."}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: T.inkSoft, display: "block", marginBottom: 6, fontFamily: T.sans }}>Note (optional)</label>
          <Textarea value={suspendComment} onChange={e => setSuspendComment(e.target.value)} placeholder="Internal note…" rows={3} />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setSuspendModal(null)}>Cancel</Btn>
          <Btn variant={suspendModal?.action === "suspend" ? "danger" : "approve"} onClick={confirmSuspendAction} loading={suspendModal && actionBusy[`s${suspendModal?.school?.id}`]}>
            {suspendModal?.action === "suspend" ? "Confirm suspension" : "Confirm reactivation"}
          </Btn>
        </div>
      </Modal>

      <Modal open={!!priceModal} onClose={() => setPriceModal(null)} title="Edit invoice amount" subtitle={priceModal ? `${priceModal.academicYear} · ${priceModal.period}` : ""}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: T.inkSoft, display: "block", marginBottom: 6, fontFamily: T.sans }}>Amount (DZD)</label>
          <NumberInput value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="0" />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={() => setPriceModal(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={confirmPrice} loading={priceModal && actionBusy[`ip${priceModal.id}`]}>Save amount</Btn>
        </div>
      </Modal>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  NAV
// ══════════════════════════════════════════════════════════════════
const NAV = [
  { key: "overview", label: "Overview" },
  { key: "requests",  label: "Requests", badge: true },
  { key: "schools",   label: "Schools"  },
];

const NavIcon = ({ k, active }) => {
  const color = active ? T.ink : T.inkFaint;
  const stroke = { stroke: color, strokeWidth: 1.6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (k === "overview") return (
    <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5" {...stroke} /><rect x="14" y="3" width="7" height="5" rx="1.5" {...stroke} /><rect x="14" y="12" width="7" height="9" rx="1.5" {...stroke} /><rect x="3" y="16" width="7" height="5" rx="1.5" {...stroke} /></svg>
  );
  if (k === "requests") return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1.4.9L12 18.5l-4.6 2.4A1 1 0 0 1 6 20V4a1 1 0 0 1 1-1Z" {...stroke} /><path d="M9 8h6M9 11.5h6" {...stroke} /></svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 21V9l8-5 8 5v12" {...stroke} /><path d="M9 21v-7h6v7" {...stroke} /></svg>
  );
};

// ══════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [pendingCount, setPendingCount] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const routerNavigate = useNavigate();

  useEffect(() => {
    api.get("/api/platform/dashboard")
      .then(r => setPendingCount(r.data?.pendingRequests ?? 0))
      .catch(() => {});
  }, []);

  const refreshBadge = () => {
    api.get("/api/platform/dashboard")
      .then(r => setPendingCount(r.data?.pendingRequests ?? 0))
      .catch(() => {});
  };

  const navigate = (key) => {
    setActivePage(key);
    setMobileMenuOpen(false);
    if (key === "overview" || key === "requests") refreshBadge();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally {
      setLoggingOut(false);
      routerNavigate("/login");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: T.sans }} className="sa-root">
      <style>{`
        .sa-root { display: flex; }
        .sa-sidebar { display: none; }
        .sa-topbar { display: flex; }
        .sa-bottomnav { display: flex; }
        .sa-main { flex: 1; min-width: 0; }
        @media (min-width: 860px) {
          .sa-root { display: flex; }
          .sa-sidebar { display: flex; }
          .sa-topbar { display: none; }
          .sa-bottomnav { display: none; }
          .sa-main { padding: 32px 36px !important; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="sa-sidebar" style={{
        width: 216, minWidth: 216, flexDirection: "column",
        background: T.paperRaised, borderRight: `1px solid ${T.line}`,
      }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink }}>ScPlatform</div>
          <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>Super Admin</div>
        </div>
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {NAV.map(n => {
            const active = activePage === n.key;
            return (
              <button key={n.key} onClick={() => navigate(n.key)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 10px", border: "none", borderRadius: 7, cursor: "pointer",
                marginBottom: 2, textAlign: "left", fontSize: 13, fontFamily: T.sans,
                background: active ? T.paper : "transparent",
                color: active ? T.ink : T.inkSoft,
                fontWeight: active ? 700 : 500,
                borderLeft: active ? `3px solid ${T.ink}` : "3px solid transparent",
              }}>
                <NavIcon k={n.key} active={active} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge && pendingCount > 0 && (
                  <span style={{ background: T.amber, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, minWidth: 18, textAlign: "center" }}>{pendingCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 10, color: T.inkFaint }}>Signed in as</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, margin: "2px 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.fullName || user?.email || "Super Admin"}
          </div>
          <button onClick={handleLogout} disabled={loggingOut} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%",
            padding: "8px 10px", border: `1px solid ${T.line}`, borderRadius: 7, background: "transparent",
            color: T.flag, fontFamily: T.sans, fontSize: 12, fontWeight: 600,
            cursor: loggingOut ? "not-allowed" : "pointer", opacity: loggingOut ? 0.6 : 1,
          }}>
            {loggingOut ? <Spinner size={12} color={T.flag} /> : null} Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sa-topbar" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", paddingTop: "calc(12px + env(safe-area-inset-top))",
        background: T.paperRaised, borderBottom: `1px solid ${T.line}`,
      }}>
        <div style={{ fontFamily: T.serif, fontSize: 16, color: T.ink }}>ScPlatform</div>
        <button onClick={() => setMobileMenuOpen(true)} style={{
          background: "none", border: "none", cursor: "pointer", padding: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} aria-label="Account menu">
          <Avatar name={user?.fullName || user?.email || "SA"} size={30} />
        </button>
      </header>

      {/* Mobile account sheet */}
      <Modal open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Account">
        <div style={{ fontSize: 10, color: T.inkFaint, marginBottom: 3 }}>Signed in as</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 18 }}>{user?.fullName || user?.email || "Super Admin"}</div>
        <Btn full variant="danger" onClick={handleLogout} loading={loggingOut}>Log out</Btn>
      </Modal>

      {/* Mobile bottom nav */}
      <nav className="sa-bottomnav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: T.paperRaised, borderTop: `1px solid ${T.line}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {NAV.map(n => {
          const active = activePage === n.key;
          return (
            <button key={n.key} onClick={() => navigate(n.key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "9px 4px 8px", border: "none", background: "transparent", cursor: "pointer",
              position: "relative",
            }}>
              <NavIcon k={n.key} active={active} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.ink : T.inkFaint, fontFamily: T.sans }}>{n.label}</span>
              {n.badge && pendingCount > 0 && (
                <span style={{ position: "absolute", top: 4, right: "28%", background: T.amber, color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 99, minWidth: 15, textAlign: "center" }}>{pendingCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <main className="sa-main" style={{ padding: "76px 16px 88px" }}>
        {activePage === "overview" && <OverviewPage onNavigate={navigate} />}
        {activePage === "requests" && <RequestsPage />}
        {activePage === "schools"  && <SchoolsPage />}
      </main>
    </div>
  );
}