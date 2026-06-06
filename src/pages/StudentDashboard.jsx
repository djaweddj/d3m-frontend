import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, User, CalendarDays, School,
  LogOut, Phone, Mail, MapPin, Clock,
  ChevronLeft, Edit3, Check, X,
} from "lucide-react";
import { mockStudent, WEEK_DAYS } from "../data/mockStudentData";

// ─────────────────────────────────────────────────────────
// Color palette per enrollment
// ─────────────────────────────────────────────────────────
const PALETTE = [
  { bg:"#EBF4FE", text:"#0C447C", border:"#85B7EB", dot:"#185FA5" },
  { bg:"#E1F5EE", text:"#085041", border:"#5DCAA5", dot:"#0F6E56" },
  { bg:"#EEEDFE", text:"#3C3489", border:"#AFA9EC", dot:"#534AB7" },
  { bg:"#FAECE7", text:"#712B13", border:"#F0997B", dot:"#C05621" },
];
const pal = i => PALETTE[i % PALETTE.length];

const SESSIONS_PER_MONTH = 4;

// ─────────────────────────────────────────────────────────
// Sidebar nav items
// ─────────────────────────────────────────────────────────
const NAV = [
  { id:"sessions",  icon:BookOpen,    label:"حصصي"             },
  { id:"schedule",  icon:CalendarDays,label:"برنامجي الأسبوعي"  },
  { id:"schools",   icon:School,      label:"مدارسي المسجلة"    },
  { id:"profile",   icon:User,        label:"بروفايل شخصي"      },
];

// ─────────────────────────────────────────────────────────
// Shared tiny components
// ─────────────────────────────────────────────────────────
function Card({ children, style={} }) {
  return (
    <div style={{ background:"#fff", borderRadius:14,
      border:"1.5px solid #E8EEF6", padding:"1.25rem", ...style }}>
      {children}
    </div>
  );
}

function SecTitle({ children }) {
  return (
    <h2 style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:"0 0 1.1rem" }}>
      {children}
    </h2>
  );
}

function Tag({ children, c }) {
  return (
    <span style={{ background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:20, display:"inline-block" }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────
function Sidebar({ active, setActive, student, onLogout }) {
  return (
    <aside style={{
      width:220, flexShrink:0, background:"#0F172A",
      display:"flex", flexDirection:"column", height:"100vh",
      position:"sticky", top:0,
      borderLeft:"1px solid rgba(255,255,255,.07)",
    }}>
      {/* Logo */}
      <div style={{ padding:"1.1rem 1rem", borderBottom:"1px solid rgba(255,255,255,.07)",
        display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"#185FA5",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, flexShrink:0 }}>🎓</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>منصة مدارس الدعم</div>
          <div style={{ fontSize:10, color:"#64748B", marginTop:1 }}>لوحة الطالب</div>
        </div>
      </div>

      {/* Student badge */}
      <div style={{ padding:"10px 1rem", borderBottom:"1px solid rgba(255,255,255,.07)",
        display:"flex", alignItems:"center", gap:9,
        background:"rgba(255,255,255,.03)" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"#185FA5",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:700, color:"#fff", flexShrink:0,
          border:"2px solid rgba(255,255,255,.15)" }}>
          {student.avatar}
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:"#E2E8F0" }}>{student.name}</div>
          <div style={{ fontSize:10, color:"#1D9E75", marginTop:1 }}>طالب مسجل ✓</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 0", overflowY:"auto" }}>
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"9px 1rem", border:"none", cursor:"pointer",
                background: isActive ? "rgba(24,95,165,.2)" : "transparent",
                borderRight: `3px solid ${isActive ? "#185FA5" : "transparent"}`,
                color: isActive ? "#fff" : "#64748B",
                fontSize:13, fontWeight:500,
                fontFamily:"'Cairo',system-ui,sans-serif",
                transition:"all .15s", textAlign:"right",
              }}
              onMouseEnter={e => { if(!isActive){ e.currentTarget.style.background="rgba(255,255,255,.04)"; e.currentTarget.style.color="#CBD5E1"; }}}
              onMouseLeave={e => { if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748B"; }}}
            >
              <Icon size={16} style={{ flexShrink:0,
                color: isActive ? "#185FA5" : "inherit" }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding:"10px 1rem", borderTop:"1px solid rgba(255,255,255,.07)" }}>
        <button onClick={onLogout}
          style={{ display:"flex", alignItems:"center", gap:8, background:"none",
            border:"none", color:"#475569", fontSize:12, fontWeight:500,
            cursor:"pointer", fontFamily:"inherit", width:"100%", padding:"5px 0",
            transition:"color .15s" }}
          onMouseEnter={e=>e.currentTarget.style.color="#94A3B8"}
          onMouseLeave={e=>e.currentTarget.style.color="#475569"}>
          <LogOut size={14} /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// Page: حصصي  (upcoming sessions)
// ─────────────────────────────────────────────────────────
function PageSessions({ student }) {
  const all = student.enrollments.flatMap((enr, i) =>
    enr.upcoming.map(u => ({ ...u, schoolName:enr.schoolName, idx:i }))
  ).sort((a,b) => a.date.localeCompare(b.date));

  const fmt = d => new Date(d).toLocaleDateString("ar-MA",
    { weekday:"long", month:"long", day:"numeric" });

  // sessions remaining
  const totalAttended  = student.enrollments.reduce((s,e) =>
    s + e.sessions.reduce((_, __)=>_+1, 0), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
      {/* Stats strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"إجمالي الحصص الأسبوعية",
            value: student.enrollments.reduce((s,e)=>s+e.sessions.length,0) },
          { label:"حصص قادمة",
            value: all.length },
          { label:"الرسوم الشهرية",
            value: student.enrollments.reduce((s,e)=>s+e.price,0)+" درهم" },
        ].map(stat => (
          <Card key={stat.label} style={{ textAlign:"center", padding:"1rem" }}>
            <div style={{ fontSize:22, fontWeight:700, color:"#185FA5" }}>{stat.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <SecTitle>الحصص القادمة</SecTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {all.map((s,i) => {
            const c = pal(s.idx);
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"10px 12px", borderRadius:10,
                border:"1px solid #F1F5F9", background:"#FAFCFF",
                transition:"border-color .15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=c.border}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#F1F5F9"}>
                {/* Date pill */}
                <div style={{ background:c.bg, border:`1px solid ${c.border}`,
                  borderRadius:9, padding:"5px 12px", textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:c.text }}>{fmt(s.date)}</div>
                  <div style={{ fontSize:10, color:"#64748B", marginTop:1 }}>🕐 {s.time}</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#0F172A" }}>{s.subject}</div>
                  <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{s.schoolName}</div>
                </div>
                <Tag c={c}>{s.type}</Tag>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment countdown per school */}
      <Card>
        <SecTitle>متابعة الدفع الشهري</SecTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {student.enrollments.map((enr, i) => {
            const c       = pal(i);
            const attended = 2 + i; // mock attended count
            const rem      = SESSIONS_PER_MONTH - attended;
            const pct      = (attended / SESSIONS_PER_MONTH) * 100;
            return (
              <div key={enr.schoolId} style={{ padding:"10px 12px", borderRadius:10,
                border:`1.5px solid ${c.border}`, background:c.bg }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:c.text }}>
                    {enr.schoolName}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700,
                    color: rem<=0 ? "#DC2626" : rem===1 ? "#BA7517" : "#0F6E56" }}>
                    {rem<=0 ? "يجب تجديد الدفع !" : `${rem} حصة متبقية`}
                  </span>
                </div>
                <div style={{ height:6, borderRadius:6, background:"rgba(0,0,0,.08)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:6, width:`${pct}%`,
                    background: rem<=0?"#EF4444": rem===1?"#F59E0B":c.dot,
                    transition:"width .4s" }} />
                </div>
                <div style={{ fontSize:10, color:c.text, marginTop:4, opacity:.7 }}>
                  {attended} من {SESSIONS_PER_MONTH} حصص
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: برنامجي الأسبوعي
// ─────────────────────────────────────────────────────────
function PageSchedule({ student }) {
  const byDay = {};
  WEEK_DAYS.forEach(d => { byDay[d] = []; });
  student.enrollments.forEach((enr, i) => {
    enr.sessions.forEach(ses => {
      if (byDay[ses.day]) byDay[ses.day].push({ ...ses, schoolName:enr.schoolName, idx:i });
    });
  });

  // All upcoming sorted
  const upcoming = student.enrollments.flatMap((enr,i) =>
    enr.upcoming.map(u=>({...u,schoolName:enr.schoolName,idx:i}))
  ).sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
      {/* Weekly grid */}
      <Card>
        <SecTitle>الجدول الأسبوعي</SecTitle>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${WEEK_DAYS.length},1fr)`, gap:8 }}>
          {WEEK_DAYS.map(day => {
            const slots = byDay[day];
            return (
              <div key={day}>
                <div style={{ fontSize:11, fontWeight:700, color:"#185FA5",
                  textAlign:"center", paddingBottom:6,
                  borderBottom:"2px solid #EBF4FE", marginBottom:6 }}>
                  {day}
                </div>
                {slots.length === 0
                  ? <div style={{ height:48, borderRadius:8, background:"#F8FAFC",
                      border:"1px dashed #E2E8F0" }} />
                  : slots.map((s,idx) => {
                      const c = pal(s.idx);
                      return (
                        <div key={idx} style={{ background:c.bg, border:`1px solid ${c.border}`,
                          borderRadius:8, padding:"5px 7px", marginBottom:4 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:c.text }}>{s.subject}</div>
                          <div style={{ fontSize:9, color:"#64748B", marginTop:1 }}>{s.time.split(" - ")[0]}</div>
                          <div style={{ fontSize:9, color:c.text, opacity:.7, marginTop:1 }}>{s.room}</div>
                        </div>
                      );
                    })
                }
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming list */}
      <Card>
        <SecTitle>الحصص القادمة</SecTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {upcoming.map((s,i) => {
            const c = pal(s.idx);
            const d = new Date(s.date);
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"9px 12px", borderRadius:10,
                border:"1.5px solid #F1F5F9", background:"#FAFCFF" }}>
                <div style={{ width:44, textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:c.text }}>{d.getDate()}</div>
                  <div style={{ fontSize:9, color:"#94A3B8" }}>
                    {d.toLocaleDateString("ar-MA",{month:"short"})}
                  </div>
                </div>
                <div style={{ width:1, height:36, background:"#E8EEF6", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{s.subject}</div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>
                    🕐 {s.time} · {s.schoolName}
                  </div>
                </div>
                <Tag c={c}>{s.type}</Tag>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: مدارسي المسجلة
// ─────────────────────────────────────────────────────────
function PageSchools({ student }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card style={{ textAlign:"center", padding:"1rem" }}>
          <div style={{ fontSize:26, fontWeight:700, color:"#185FA5" }}>
            {student.enrollments.length}
          </div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:4 }}>مدارس مسجلة</div>
        </Card>
        <Card style={{ textAlign:"center", padding:"1rem" }}>
          <div style={{ fontSize:26, fontWeight:700, color:"#0F6E56" }}>
            {student.enrollments.reduce((s,e)=>s+e.price,0)} درهم
          </div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:4 }}>إجمالي رسوم شهرية</div>
        </Card>
      </div>

      {student.enrollments.map((enr, i) => {
        const c = pal(i);
        return (
          <Card key={enr.schoolId}>
            {/* School header */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:"1rem" }}>
              <div style={{ width:46, height:46, borderRadius:12, background:c.bg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, border:`1.5px solid ${c.border}`, flexShrink:0 }}>🏫</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0F172A" }}>{enr.schoolName}</div>
                <div style={{ fontSize:12, color:"#64748B", marginTop:3, display:"flex", gap:12 }}>
                  <span>📍 {enr.location}</span>
                  <span>👨‍🏫 {enr.teacher}</span>
                </div>
              </div>
              <div style={{ background:c.bg, border:`1px solid ${c.border}`,
                borderRadius:9, padding:"5px 12px", textAlign:"center", flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:c.text }}>{enr.price} درهم</div>
                <div style={{ fontSize:9, color:c.text, opacity:.7 }}>شهرياً</div>
              </div>
            </div>

            <hr style={{ border:"none", borderTop:"1px solid #F1F5F9", margin:"0 0 12px" }}/>

            {/* Sessions */}
            <div style={{ fontSize:12, color:"#94A3B8", marginBottom:8 }}>
              الحصص الأسبوعية ({enr.sessions.length})
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {enr.sessions.map(ses => (
                <div key={ses.id} style={{ display:"flex", alignItems:"center", gap:8,
                  padding:"7px 10px", borderRadius:9, background:c.bg,
                  border:`1px solid ${c.border}` }}>
                  <span style={{ fontSize:12, fontWeight:600, color:c.text, minWidth:80 }}>
                    {ses.subject}
                  </span>
                  <span style={{ fontSize:11, color:"#64748B" }}>{ses.day}</span>
                  <span style={{ fontSize:11, color:"#64748B", marginRight:"auto" }}>{ses.time}</span>
                  <span style={{ fontSize:10, color:c.text, background:"#fff",
                    borderRadius:5, padding:"2px 7px", border:`1px solid ${c.border}` }}>
                    {ses.room}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: بروفايل شخصي
// ─────────────────────────────────────────────────────────
function PageProfile({ student }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    name:     student.name,
    age:      student.age,
    phone:    student.phone,
    email:    student.email,
  });
  const [saved, setSaved] = useState(false);

  const inp = {
    padding:"8px 11px", borderRadius:9, border:"1.5px solid #E2E8F0",
    fontSize:13, fontFamily:"inherit", color:"#0F172A",
    background:"#FAFCFF", outline:"none", width:"100%",
  };

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem", maxWidth:560 }}>

      {/* Avatar card */}
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#185FA5",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, fontWeight:700, color:"#fff",
            border:"3px solid #EBF4FE", flexShrink:0 }}>
            {student.avatar}
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#0F172A" }}>{form.name}</div>
            <div style={{ fontSize:13, color:"#64748B", marginTop:3 }}>طالب مسجل</div>
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>
              📅 انضم منذ: {student.joinedAt}
            </div>
          </div>
          <button onClick={()=>setEditing(e=>!e)}
            style={{ marginRight:"auto", display:"flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:9,
              border:`1.5px solid ${editing?"#E2E8F0":"#185FA5"}`,
              background: editing?"#fff":"#EBF4FE",
              color: editing?"#64748B":"#185FA5",
              fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            <Edit3 size={13}/> {editing?"إلغاء":"تعديل"}
          </button>
        </div>
      </Card>

      {/* Info form */}
      <Card>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:"1.1rem" }}>
          <SecTitle>المعلومات الشخصية</SecTitle>
          {saved && (
            <span style={{ fontSize:12, color:"#0F6E56", fontWeight:600,
              display:"flex", alignItems:"center", gap:5 }}>
              <Check size={13}/> تم الحفظ بنجاح
            </span>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"#64748B",
              display:"block", marginBottom:4 }}>الاسم الكامل</label>
            {editing
              ? <input style={inp} value={form.name}
                  onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              : <div style={{ fontSize:14, color:"#0F172A", padding:"8px 0",
                  borderBottom:"1px solid #F1F5F9" }}>{form.name}</div>
            }
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {/* Age */}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748B",
                display:"block", marginBottom:4 }}>العمر</label>
              {editing
                ? <input style={inp} type="number" value={form.age}
                    onChange={e=>setForm(f=>({...f,age:e.target.value}))}/>
                : <div style={{ fontSize:14, color:"#0F172A", padding:"8px 0",
                    borderBottom:"1px solid #F1F5F9" }}>{form.age} سنة</div>
              }
            </div>
            {/* Phone */}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748B",
                display:"block", marginBottom:4 }}>رقم الهاتف</label>
              {editing
                ? <input style={inp} type="tel" value={form.phone}
                    onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                : <div style={{ fontSize:14, color:"#0F172A", padding:"8px 0",
                    borderBottom:"1px solid #F1F5F9", direction:"ltr", textAlign:"right" }}>
                    {form.phone}
                  </div>
              }
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"#64748B",
              display:"block", marginBottom:4 }}>البريد الإلكتروني</label>
            {editing
              ? <input style={inp} type="email" value={form.email}
                  onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              : <div style={{ fontSize:14, color:"#0F172A", padding:"8px 0",
                  borderBottom:"1px solid #F1F5F9", direction:"ltr", textAlign:"right" }}>
                  {form.email}
                </div>
            }
          </div>

          {/* Stats (read-only) */}
          <hr style={{ border:"none", borderTop:"1px solid #F1F5F9" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { label:"عدد المدارس المسجلة",  value: student.enrollments.length          },
              { label:"إجمالي الحصص الأسبوعية", value: student.enrollments.reduce((s,e)=>s+e.sessions.length,0) },
            ].map(stat=>(
              <div key={stat.label} style={{ background:"#F8FAFC", borderRadius:10,
                padding:"10px 12px", border:"1px solid #E8EEF6" }}>
                <div style={{ fontSize:18, fontWeight:700, color:"#185FA5" }}>{stat.value}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {editing && (
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
              <button onClick={()=>setEditing(false)}
                style={{ padding:"7px 16px", borderRadius:9, border:"1.5px solid #E2E8F0",
                  background:"#fff", color:"#64748B", fontSize:13, cursor:"pointer",
                  fontFamily:"inherit" }}>
                إلغاء
              </button>
              <button onClick={handleSave}
                style={{ display:"flex", alignItems:"center", gap:6,
                  padding:"7px 18px", borderRadius:9, border:"none",
                  background:"#185FA5", color:"#fff", fontSize:13, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit" }}>
                <Check size={13}/> حفظ التعديلات
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main StudentDashboard
// ─────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const student  = mockStudent;
  const [active, setActive] = useState("sessions");

  const PAGE_TITLES = {
    sessions: "حصصي",
    schedule: "برنامجي الأسبوعي",
    schools:  "مدارسي المسجلة",
    profile:  "بروفايل شخصي",
  };

  return (
    <div dir="rtl" style={{
      display:"flex", minHeight:"100vh",
      fontFamily:"'Cairo', system-ui, Arial, sans-serif",
      background:"#F8FAFC",
    }}>
      {/* Sidebar */}
      <Sidebar
        active={active}
        setActive={setActive}
        student={student}
        onLogout={() => navigate("/")}
      />

      {/* Main content */}
      <main style={{ flex:1, minWidth:0, overflowY:"auto" }}>
        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1.5px solid #E8EEF6",
          padding:"0 1.5rem", height:56, display:"flex",
          alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:40 }}>
          <h1 style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:0 }}>
            {PAGE_TITLES[active]}
          </h1>
          {/* Quick school count badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ background:"#EBF4FE", border:"1px solid #B5D4F4",
              borderRadius:999, padding:"4px 12px", fontSize:12, fontWeight:600,
              color:"#0C447C" }}>
              🏫 {student.enrollments.length} مدارس
            </div>
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding:"1.5rem" }}>
          {active === "sessions"  && <PageSessions student={student} />}
          {active === "schedule"  && <PageSchedule student={student} />}
          {active === "schools"   && <PageSchools  student={student} />}
          {active === "profile"   && <PageProfile  student={student} />}
        </div>
      </main>
    </div>
  );
}