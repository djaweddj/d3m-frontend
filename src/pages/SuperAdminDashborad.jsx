import { useState, useEffect, useCallback } from "react";
import api from "../api";

const C = {
  blue: "#185FA5", blueLt: "#E6F1FB", blueMid: "#B5D4F4",
  green: "#3B6D11", greenLt: "#EAF3DE", greenMid: "#C0DD97",
  amber: "#854F0B", amberLt: "#FAEEDA", amberMid: "#FAC775",
  red: "#A32D2D", redLt: "#FCEBEB", redMid: "#F7C1C1",
  gray: "#5F5E5A", grayLt: "#F1EFE8",
  border: "#e2e2e0", bg: "#f7f7f5", white: "#ffffff",
  text: "#1a1a18", textMuted: "#6b6b68",
};

// ── Pill ──────────────────────────────────────────────────────────────────────
const PILL_MAP = {
  PENDING:   { bg: C.amberLt, color: C.amber,  label: "Pending"   },
  APPROVED:  { bg: C.greenLt, color: C.green,  label: "Approved"  },
  REJECTED:  { bg: C.grayLt,  color: C.gray,   label: "Rejected"  },
  ACTIVE:    { bg: C.greenLt, color: C.green,  label: "Active"    },
  EXPIRED:   { bg: C.redLt,   color: C.red,    label: "Expired"   },
  SUSPENDED: { bg: C.redLt,   color: C.red,    label: "Suspended" },
  TRIAL:     { bg: C.amberLt, color: C.amber,  label: "Trial"     },
  PAID:      { bg: C.greenLt, color: C.green,  label: "Paid"      },
  UNPAID:    { bg: C.amberLt, color: C.amber,  label: "Unpaid"    },
  OVERDUE:   { bg: C.redLt,   color: C.red,    label: "Overdue"   },
};
const Pill = ({ status }) => {
  const s = PILL_MAP[status?.toUpperCase()] || { bg: C.grayLt, color: C.gray, label: status ?? "—" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px",
      borderRadius:99, fontSize:11, fontWeight:500, background:s.bg, color:s.color }}>
      {s.label}
    </span>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent }) => (
  <div style={{ background:C.white, border:`0.5px solid ${C.border}`, borderRadius:12,
    padding:"16px 18px", borderTop:`3px solid ${accent||C.blue}` }}>
    <div style={{ fontSize:20, color:accent||C.blue, marginBottom:6 }}>
      <i className={`ti ${icon}`} aria-hidden="true"/>
    </div>
    <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:500, color:C.text }}>
      {value ?? <span style={{opacity:.3}}>—</span>}
    </div>
  </div>
);

// ── SectionCard ───────────────────────────────────────────────────────────────
const SectionCard = ({ children, style }) => (
  <div style={{ background:C.white, border:`0.5px solid ${C.border}`, borderRadius:12,
    padding:"16px 20px", marginBottom:16, ...style }}>{children}</div>
);

const SectionHeader = ({ title, action }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
    <span style={{ fontSize:14, fontWeight:500, color:C.text }}>{title}</span>
    {action}
  </div>
);

// ── Table helpers ─────────────────────────────────────────────────────────────
const Th = ({ children, right }) => (
  <th style={{ textAlign:right?"right":"left", padding:"8px 12px", fontSize:11, fontWeight:500,
    color:C.textMuted, borderBottom:`0.5px solid ${C.border}`, textTransform:"uppercase",
    letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{children}</th>
);
const Td = ({ children, right, muted, bold }) => (
  <td style={{ padding:"10px 12px", fontSize:13, color:muted?C.textMuted:C.text,
    fontWeight:bold?500:400, textAlign:right?"right":"left",
    borderBottom:`0.5px solid ${C.border}`, verticalAlign:"middle" }}>{children}</td>
);
const EmptyRow = ({ cols, message }) => (
  <tr><td colSpan={cols} style={{ textAlign:"center", padding:"32px 0", color:C.textMuted, fontSize:13 }}>{message}</td></tr>
);
const LoadingRow = ({ cols }) => (
  <tr><td colSpan={cols} style={{ textAlign:"center", padding:"32px 0", color:C.textMuted, fontSize:13 }}>
    <i className="ti ti-loader-2" style={{marginRight:6}} aria-hidden="true"/>Loading...
  </td></tr>
);

// ── ActionBtn ─────────────────────────────────────────────────────────────────
const BTN_STYLES = {
  approve:    { bg:C.greenLt,  color:C.green,  border:C.greenMid },
  reject:     { bg:C.redLt,    color:C.red,    border:C.redMid   },
  pay:        { bg:C.blueLt,   color:C.blue,   border:C.blueMid  },
  suspend:    { bg:C.redLt,    color:C.red,    border:C.redMid   },
  reactivate: { bg:C.greenLt,  color:C.green,  border:C.greenMid },
  default:    { bg:C.grayLt,   color:C.gray,   border:C.border   },
};
const ActionBtn = ({ children, variant="default", onClick, disabled, loading, small }) => {
  const s = BTN_STYLES[variant] || BTN_STYLES.default;
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{ padding: small ? "3px 10px" : "5px 13px", borderRadius:6,
        fontSize: small ? 11 : 12, cursor:disabled||loading?"not-allowed":"pointer",
        border:`0.5px solid ${s.border}`, background:s.bg, color:s.color,
        fontFamily:"inherit", opacity:disabled||loading?.6:1, transition:"opacity .15s",
        whiteSpace:"nowrap" }}>
      {loading ? <i className="ti ti-loader-2" aria-hidden="true"/> : children}
    </button>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, subtitle, children, wide }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:12,
        padding:24, width:wide?580:440, maxWidth:"96vw", maxHeight:"85vh",
        overflowY:"auto", border:`0.5px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"start", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:500, color:C.text }}>{title}</div>
            {subtitle && <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
            color:C.textMuted, fontSize:18, lineHeight:1, marginTop:-2 }}>
            <i className="ti ti-x" aria-hidden="true"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"9px 0", borderBottom:`0.5px solid ${C.border}` }}>
    <span style={{ fontSize:13, color:C.textMuted }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{value ?? "—"}</span>
  </div>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type !== "error";
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999,
      background: ok ? C.greenLt : C.redLt,
      color: ok ? C.green : C.red,
      border:`0.5px solid ${ok ? C.greenMid : C.redMid}`,
      borderRadius:8, padding:"10px 18px", fontSize:13, fontWeight:500,
      boxShadow:"0 4px 16px rgba(0,0,0,0.08)", display:"flex", alignItems:"center", gap:8 }}>
      <i className={`ti ${ok?"ti-circle-check":"ti-alert-circle"}`} aria-hidden="true"/>
      {toast.msg}
    </div>
  );
};

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);
  return { toast, show };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt      = n  => n != null ? Number(n).toLocaleString("fr-DZ") + " DZD" : "—";
const fmtDate  = d  => d ? new Date(d).toLocaleDateString("fr-DZ")   : "—";
const fmtDT    = d  => d ? new Date(d).toLocaleString("fr-DZ")        : "—";
const initials = (name="") => name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const subStatusColor = s => ({ ACTIVE:C.green, EXPIRED:C.red, SUSPENDED:C.red, TRIAL:C.amber })[s?.toUpperCase()] || C.gray;

// ════════════════════════════════════════════════════════════════════════════════
// PAGE: Overview
// Endpoint: GET /api/platform/dashboard → PlatformDashboardDto
// ════════════════════════════════════════════════════════════════════════════════
function OverviewPage({ onNavigate }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/api/platform/dashboard")
      .then(r => { setData(r.data); setError(null); })
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign:"center", padding:80, color:C.textMuted }}>
      <i className="ti ti-loader-2" style={{ fontSize:32 }} aria-hidden="true"/>
      <div style={{ marginTop:10 }}>Loading platform data…</div>
    </div>
  );
  if (error) return (
    <div style={{ textAlign:"center", padding:80, color:C.red }}>
      <i className="ti ti-alert-circle" style={{ fontSize:32 }} aria-hidden="true"/>
      <div style={{ marginTop:10 }}>{error}</div>
    </div>
  );

  return (
    <>
      <PageHeader title="Overview" sub="Platform summary at a glance" />

      {/* Main stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
        <StatCard icon="ti-building"      label="Total schools"     value={data?.totalSchools}       accent={C.blue}  />
        <StatCard icon="ti-circle-check"  label="Active schools"    value={data?.activeSchools}      accent={C.green} />
        <StatCard icon="ti-clock"         label="Pending requests"  value={data?.pendingRequests}    accent={C.amber} />
        <StatCard icon="ti-alert-circle"  label="Expired schools"   value={data?.expiredSchools}     accent={C.red}   />
        <StatCard icon="ti-coin"          label="Revenue this year" value={fmt(data?.currentYearRevenue)} accent={C.blue}  />
        <StatCard icon="ti-chart-bar"     label="All-time revenue"  value={fmt(data?.allTimeRevenue)}     accent={C.blue}  />
      </div>

      {/* Secondary status chips */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Suspended", value:data?.suspendedSchools, color:C.red,   bg:C.redLt   },
          { label:"Trial",     value:data?.trialSchools,     color:C.amber, bg:C.amberLt },
        ].map(item => (
          <div key={item.label} style={{ background:item.bg, border:`0.5px solid ${C.border}`,
            borderRadius:8, padding:"10px 18px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22, fontWeight:500, color:item.color }}>{item.value ?? "—"}</span>
            <span style={{ fontSize:12, color:item.color }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Pending requests preview */}
      <SectionCard>
        <SectionHeader
          title="Pending school requests"
          action={<ActionBtn onClick={()=>onNavigate("requests")}>View all →</ActionBtn>}
        />
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr><Th>School</Th><Th>Owner</Th><Th>Wilaya</Th><Th>Submitted</Th><Th>Status</Th></tr></thead>
          <tbody>
            {!data?.pendingSchoolRequests?.length
              ? <EmptyRow cols={5} message="No pending requests"/>
              : data.pendingSchoolRequests.slice(0,5).map(r=>(
                <tr key={r.id}>
                  <Td bold>{r.schoolName}</Td>
                  <Td muted>{r.ownerFullName}</Td>
                  <Td muted>{r.wilaya}</Td>
                  <Td muted>{fmtDT(r.createdAt)}</Td>
                  <Td><Pill status={r.status}/></Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </SectionCard>

      {/* Recent invoices */}
      <SectionCard>
        <SectionHeader title="Recent school invoices" />
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr><Th>School</Th><Th>Period</Th><Th>Academic year</Th><Th>Due date</Th><Th right>Amount</Th><Th>Status</Th></tr></thead>
          <tbody>
            {!data?.recentInvoices?.length
              ? <EmptyRow cols={6} message="No recent invoices"/>
              : data.recentInvoices.slice(0,6).map(inv=>(
                <tr key={inv.id}>
                  <Td bold>{inv.schoolName}</Td>
                  <Td muted>{inv.period}</Td>
                  <Td muted>{inv.academicYear}</Td>
                  <Td muted>{fmtDate(inv.dueDate)}</Td>
                  <Td right>{fmt(inv.amount)}</Td>
                  <Td><Pill status={inv.status}/></Td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </SectionCard>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE: School Requests
// GET  /api/school-requests/pending?page=&size=   → Page<SchoolRequestResponseDto>
// POST /api/school-requests/{id}/approve          → SchoolResponseDto
// POST /api/school-requests/{id}/reject?comment=  → 200
// ════════════════════════════════════════════════════════════════════════════════
function RequestsPage() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal]     = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const { toast, show: showToast } = useToast();

  const load = useCallback((p=0) => {
    setLoading(true);
    api.get(`/api/school-requests/pending?page=${p}&size=10`)
      .then(r => {
        const d = r.data;
        setRequests(d.content ?? []);
        setTotalPages(d.totalPages ?? 1);
        setPage(d.number ?? 0);
      })
      .catch(()=>showToast("Failed to load requests","error"))
      .finally(()=>setLoading(false));
  },[showToast]);

  useEffect(()=>{ load(0); },[load]);

  const setLoading2 = (id,action) => setActionLoading(prev=>({...prev,[id]:action}));
  const clearLoading = id => setActionLoading(prev=>({...prev,[id]:null}));

  const approve = async (id, name) => {
    setLoading2(id,"approve");
    try {
      await api.post(`/api/school-requests/${id}/approve`);
      showToast(`"${name}" approved — school account created`);
      load(page);
    } catch(e) {
      showToast(e?.response?.data?.message || "Failed to approve request","error");
    } finally { clearLoading(id); }
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    const { id, name } = rejectModal;
    setLoading2(id,"reject");
    try {
      await api.post(`/api/school-requests/${id}/reject`, null, {
        params: rejectComment ? { comment: rejectComment } : {},
      });
      showToast(`"${name}" rejected`);
      setRejectModal(null);
      load(page);
    } catch {
      showToast("Failed to reject request","error");
    } finally { clearLoading(id); }
  };

  return (
    <>
      <Toast toast={toast}/>
      <PageHeader title="School requests" sub="Review and respond to pending registration requests"/>

      <SectionCard>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <Th>School</Th><Th>Owner</Th><Th>Phone</Th>
              <Th>Wilaya / Commune</Th><Th>Submitted</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <LoadingRow cols={6}/>
              : !requests.length
              ? <EmptyRow cols={6} message="No pending requests at the moment"/>
              : requests.map(r=>(
                <tr key={r.id}>
                  <Td>
                    <div style={{fontWeight:500}}>{r.schoolName}</div>
                    <div style={{fontSize:11,color:C.textMuted}}>{r.email}</div>
                  </Td>
                  <Td muted>{r.ownerFullName}</Td>
                  <Td muted>{r.phone}</Td>
                  <Td muted>{[r.wilaya, r.commune].filter(Boolean).join(", ")}</Td>
                  <Td muted>{fmtDT(r.createdAt)}</Td>
                  <Td>
                    <div style={{ display:"flex", gap:6 }}>
                      <ActionBtn variant="approve"
                        onClick={()=>approve(r.id, r.schoolName)}
                        loading={actionLoading[r.id]==="approve"}
                        disabled={!!actionLoading[r.id]}>
                        Approve
                      </ActionBtn>
                      <ActionBtn variant="reject"
                        onClick={()=>{ setRejectModal({id:r.id,name:r.schoolName}); setRejectComment(""); }}
                        loading={actionLoading[r.id]==="reject"}
                        disabled={!!actionLoading[r.id]}>
                        Reject
                      </ActionBtn>
                    </div>
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginTop:16 }}>
            <ActionBtn onClick={()=>load(page-1)} disabled={page===0}>← Prev</ActionBtn>
            <span style={{ fontSize:13, color:C.textMuted }}>Page {page+1} of {totalPages}</span>
            <ActionBtn onClick={()=>load(page+1)} disabled={page>=totalPages-1}>Next →</ActionBtn>
          </div>
        )}
      </SectionCard>

      {/* Reject modal */}
      <Modal open={!!rejectModal} onClose={()=>setRejectModal(null)}
        title={`Reject "${rejectModal?.name}"`}
        subtitle="Optional reason — will be saved with the request record.">
        <textarea value={rejectComment} onChange={e=>setRejectComment(e.target.value)}
          placeholder="Rejection reason (optional)…"
          style={{ width:"100%", minHeight:90, padding:"10px 12px", borderRadius:8,
            border:`0.5px solid ${C.border}`, fontFamily:"inherit", fontSize:13,
            resize:"vertical", color:C.text, background:C.white, marginBottom:16,
            boxSizing:"border-box" }}/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <ActionBtn onClick={()=>setRejectModal(null)}>Cancel</ActionBtn>
          <ActionBtn variant="reject" onClick={confirmReject}
            loading={rejectModal && actionLoading[rejectModal.id]==="reject"}>
            Confirm rejection
          </ActionBtn>
        </div>
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE: Enrolled Schools
// GET  /api/schools                    → List<SchoolResponseDto>  (getAllActive)
// GET  /api/schools/all                → Page<SchoolResponseDto>  (getAllSchools)
// GET  /api/schools/{id}               → SchoolResponseDto
// GET  /api/platform/invoices/school/{id} → List<SchoolInvoiceResponseDto>
// POST /api/platform/invoices/{id}/pay → SchoolInvoiceResponseDto
// POST /api/schools/{id}/suspend       → 200
// POST /api/schools/{id}/reactivate    → 200
// ════════════════════════════════════════════════════════════════════════════════
function SchoolsPage() {
  const [schools, setSchools]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);   // SchoolResponseDto
  const [invoices, setInvoices]         = useState([]);
  const [invLoading, setInvLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [suspendModal, setSuspendModal] = useState(null);  // { school, action:"suspend"|"reactivate" }
  const [suspendComment, setSuspendComment] = useState("");
  const { toast, show: showToast } = useToast();

  const loadSchools = useCallback(() => {
    setLoading(true);
    // Uses the non-paginated list endpoint (active schools)
    api.get("/api/schools")
      .then(r => setSchools(r.data ?? []))
      .catch(()=>showToast("Failed to load schools","error"))
      .finally(()=>setLoading(false));
  },[showToast]);

  useEffect(()=>{ loadSchools(); },[loadSchools]);

  const openSchool = (school) => {
    setSelected(school);
    setInvoices([]);
    setInvLoading(true);
    api.get(`/api/platform/invoices/school/${school.id}`)
      .then(r=>setInvoices(r.data ?? []))
      .catch(()=>setInvoices([]))
      .finally(()=>setInvLoading(false));
  };

  // Refresh selected school detail after suspend/reactivate
  const refreshSelected = async (id) => {
    try {
      const r = await api.get(`/api/schools/${id}`);
      setSelected(r.data);
      setSchools(prev => prev.map(s => s.id===id ? r.data : s));
    } catch {}
  };

  const markPaid = async (invoiceId) => {
    setActionLoading(prev=>({...prev,[`inv_${invoiceId}`]:true}));
    try {
      const r = await api.post(`/api/platform/invoices/${invoiceId}/pay`);
      setInvoices(prev=>prev.map(inv=>inv.id===invoiceId ? r.data : inv));
      showToast("Invoice marked as paid");
    } catch {
      showToast("Failed to update invoice","error");
    } finally {
      setActionLoading(prev=>({...prev,[`inv_${invoiceId}`]:false}));
    }
  };

  const confirmSuspendAction = async () => {
    if (!suspendModal) return;
    const { school, action } = suspendModal;
    setActionLoading(prev=>({...prev,[`school_${school.id}`]:action}));
    try {
      await api.post(`/api/schools/${school.id}/${action}`, null,
        { params: suspendComment ? { comment: suspendComment } : {} });
      showToast(action==="suspend"
        ? `"${school.schoolName}" suspended`
        : `"${school.schoolName}" reactivated`);
      setSuspendModal(null);
      await refreshSelected(school.id);
    } catch {
      showToast(`Failed to ${action} school`, "error");
    } finally {
      setActionLoading(prev=>({...prev,[`school_${school.id}`]:null}));
    }
  };

  const selectedStatus = selected?.subscriptionStatus?.toUpperCase();

  return (
    <>
      <Toast toast={toast}/>
      <PageHeader title="Enrolled schools" sub="Click a card to view details, invoices, and manage subscription"/>

      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:C.textMuted }}>
          <i className="ti ti-loader-2" style={{fontSize:32}} aria-hidden="true"/>
          <div style={{marginTop:10}}>Loading schools…</div>
        </div>
      ) : !schools.length ? (
        <div style={{ textAlign:"center", padding:80, color:C.textMuted }}>No enrolled schools yet</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12 }}>
          {schools.map(s=>(
            <div key={s.id} onClick={()=>openSchool(s)}
              style={{ background:C.white, border:`0.5px solid ${C.border}`, borderRadius:12,
                padding:"16px 18px", cursor:"pointer",
                borderLeft:`4px solid ${subStatusColor(s.subscriptionStatus)}`,
                transition:"box-shadow .15s" }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,0.07)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:38, height:38, borderRadius:8, background:C.blueLt,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:500, fontSize:13, color:C.blue, flexShrink:0 }}>
                  {initials(s.schoolName)}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:C.text, lineHeight:1.3 }}>{s.schoolName}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{s.wilaya}</div>
                </div>
              </div>
              <Pill status={s.subscriptionStatus}/>
              <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", fontSize:11, color:C.textMuted }}>
                <span><i className="ti ti-users" style={{fontSize:11}} aria-hidden="true"/> {s.totalStudents ?? "—"}</span>
                <span>exp. {fmtDate(s.subscriptionExpiresAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── School detail modal ── */}
      <Modal open={!!selected} onClose={()=>setSelected(null)}
        title={selected?.schoolName}
        subtitle={[selected?.wilaya, selected?.email].filter(Boolean).join(" · ")}
        wide>
        {selected && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
            {/* Left col — details */}
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:8 }}>School details</div>
              <DetailRow label="Owner"              value={selected.ownerName}/>
              <DetailRow label="Status"             value={<Pill status={selected.subscriptionStatus}/>}/>
              <DetailRow label="Expires"            value={fmtDate(selected.subscriptionExpiresAt)}/>
              <DetailRow label="Students"           value={selected.totalStudents ?? "—"}/>
              <DetailRow label="Teachers"           value={selected.totalTeachers ?? "—"}/>
              <DetailRow label="Revenue this month" value={fmt(selected.currentMonthRevenue)}/>
              <DetailRow label="Created"            value={fmtDT(selected.createdAt)}/>

              {/* Suspend / Reactivate */}
              <div style={{ marginTop:16, display:"flex", gap:8 }}>
                {selectedStatus !== "SUSPENDED" && selectedStatus !== "EXPIRED" && (
                  <ActionBtn variant="suspend"
                    onClick={()=>{ setSuspendModal({school:selected,action:"suspend"}); setSuspendComment(""); }}
                    loading={actionLoading[`school_${selected.id}`]==="suspend"}>
                    <i className="ti ti-lock" style={{marginRight:4}} aria-hidden="true"/>Suspend
                  </ActionBtn>
                )}
                {selectedStatus === "SUSPENDED" && (
                  <ActionBtn variant="reactivate"
                    onClick={()=>{ setSuspendModal({school:selected,action:"reactivate"}); setSuspendComment(""); }}
                    loading={actionLoading[`school_${selected.id}`]==="reactivate"}>
                    <i className="ti ti-lock-open" style={{marginRight:4}} aria-hidden="true"/>Reactivate
                  </ActionBtn>
                )}
              </div>
            </div>

            {/* Right col — invoices */}
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:8 }}>Subscription invoices</div>
              {invLoading ? (
                <div style={{ textAlign:"center", padding:24, color:C.textMuted, fontSize:13 }}>
                  <i className="ti ti-loader-2" aria-hidden="true"/> Loading…
                </div>
              ) : !invoices.length ? (
                <div style={{ textAlign:"center", padding:24, color:C.textMuted, fontSize:13 }}>
                  No invoices found
                </div>
              ) : (
                <div style={{ maxHeight:340, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr><Th>Period</Th><Th>Due</Th><Th right>Amount</Th><Th>Status</Th><Th></Th></tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv=>(
                        <tr key={inv.id}>
                          <Td>
                            <div style={{fontSize:12,fontWeight:500}}>{inv.period}</div>
                            <div style={{fontSize:10,color:C.textMuted}}>{inv.academicYear}</div>
                          </Td>
                          <Td muted>{fmtDate(inv.dueDate)}</Td>
                          <Td right>{fmt(inv.amount)}</Td>
                          <Td><Pill status={inv.status}/></Td>
                          <Td>
                            {inv.status?.toUpperCase() !== "PAID" && (
                              <ActionBtn variant="pay" small
                                onClick={()=>markPaid(inv.id)}
                                loading={actionLoading[`inv_${inv.id}`]}>
                                Pay
                              </ActionBtn>
                            )}
                            {inv.status?.toUpperCase() === "PAID" && (
                              <span style={{ fontSize:11, color:C.textMuted }}>{fmtDT(inv.paidAt)}</span>
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

      {/* ── Suspend / Reactivate confirm modal ── */}
      <Modal open={!!suspendModal} onClose={()=>setSuspendModal(null)}
        title={suspendModal?.action==="suspend"
          ? `Suspend "${suspendModal?.school?.schoolName}"?`
          : `Reactivate "${suspendModal?.school?.schoolName}"?`}
        subtitle={suspendModal?.action==="suspend"
          ? "This will disable the school admin's access immediately."
          : "This will restore the school admin's access."}>
        <textarea value={suspendComment} onChange={e=>setSuspendComment(e.target.value)}
          placeholder="Reason / note (optional)…"
          style={{ width:"100%", minHeight:80, padding:"10px 12px", borderRadius:8,
            border:`0.5px solid ${C.border}`, fontFamily:"inherit", fontSize:13,
            resize:"vertical", color:C.text, background:C.white, marginBottom:16,
            boxSizing:"border-box" }}/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <ActionBtn onClick={()=>setSuspendModal(null)}>Cancel</ActionBtn>
          <ActionBtn
            variant={suspendModal?.action==="suspend" ? "suspend" : "reactivate"}
            onClick={confirmSuspendAction}
            loading={suspendModal && actionLoading[`school_${suspendModal.school?.id}`]}>
            {suspendModal?.action==="suspend" ? "Confirm suspension" : "Confirm reactivation"}
          </ActionBtn>
        </div>
      </Modal>
    </>
  );
}

// ── Shared page header ────────────────────────────────────────────────────────
const PageHeader = ({ title, sub }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ fontSize:18, fontWeight:500, color:C.text }}>{title}</div>
    {sub && <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>{sub}</div>}
  </div>
);

// ── Sidebar nav config ────────────────────────────────────────────────────────
const NAV = [
  { key:"overview",  icon:"ti-layout-dashboard", label:"Overview"          },
  { key:"requests",  icon:"ti-school",           label:"School requests"   },
  { key:"schools",   icon:"ti-building",          label:"Enrolled schools"  },
];

// ════════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [pendingCount, setPendingCount] = useState(null);

  useEffect(() => {
    api.get("/api/platform/dashboard")
      .then(r => setPendingCount(r.data?.pendingRequests ?? 0))
      .catch(()=>{});
  }, []);

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"inherit", background:C.bg }}>
      {/* Sidebar */}
      <div style={{ width:220, minWidth:220, background:C.white,
        borderRight:`0.5px solid ${C.border}`, display:"flex", flexDirection:"column" }}>
        {/* Logo */}
        <div style={{ padding:"20px 20px 16px", borderBottom:`0.5px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:C.blue,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="ti ti-school" style={{ color:"#fff", fontSize:17 }} aria-hidden="true"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:C.text }}>ScPlatform</div>
              <div style={{ fontSize:10, color:C.textMuted }}>Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:"12px 8px", flex:1 }}>
          {NAV.map(n=>(
            <button key={n.key} onClick={()=>setActivePage(n.key)}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"8px 12px", border:"none", borderRadius:8, cursor:"pointer",
                fontSize:13, fontFamily:"inherit", textAlign:"left", marginBottom:2,
                background: activePage===n.key ? C.blueLt : "none",
                color: activePage===n.key ? C.blue : C.textMuted,
                fontWeight: activePage===n.key ? 500 : 400, transition:"background .1s" }}>
              <i className={`ti ${n.icon}`} aria-hidden="true"/>
              <span style={{flex:1}}>{n.label}</span>
              {n.key==="requests" && pendingCount > 0 && (
                <span style={{ background:C.blue, color:"#fff", fontSize:10,
                  padding:"1px 6px", borderRadius:99 }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"12px 16px", borderTop:`0.5px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.textMuted }}>Signed in as</div>
          <div style={{ fontSize:12, fontWeight:500, color:C.text, marginTop:2 }}>Super Admin</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:28 }}>
        {activePage==="overview"  && <OverviewPage onNavigate={setActivePage}/>}
        {activePage==="requests"  && <RequestsPage/>}
        {activePage==="schools"   && <SchoolsPage/>}
      </div>
    </div>
  );
}