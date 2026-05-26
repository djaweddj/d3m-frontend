import { useState } from "react";
import { X, Plus } from "lucide-react";

const SUBJECTS = [
  "الرياضيات","الفيزياء","الكيمياء","اللغة العربية",
  "الفرنسية","الإنجليزية","الفلسفة","التاريخ","علوم الحياة",
];

const DAYS = ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];

const EMPTY = {
  name:"", phone:"", email:"", salary:"",
  subjects:[], days:[], startTime:"08:00", endTime:"17:00",
};

// ── small field wrapper ───────────────────────────────────
function Field({ label, children, full }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5,
      ...(full ? { gridColumn:"1 / -1" } : {}) }}>
      <label style={{ fontSize:11, fontWeight:600, color:"#475569", letterSpacing:".03em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (err) => ({
  padding:"8px 11px", borderRadius:9, width:"100%",
  border:`1.5px solid ${err ? "#E24B4A" : "#E2E8F0"}`,
  fontSize:13, fontFamily:"'Cairo',sans-serif", color:"#0F172A",
  background:"#FAFCFF", outline:"none",
});

// ── main modal ────────────────────────────────────────────
export default function AddTeacherModal({ onClose, onSave }) {
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saved, setSaved]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (k, val) =>
    set(k, form[k].includes(val)
      ? form[k].filter(x => x !== val)
      : [...form[k], val]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (form.subjects.length === 0) e.subjects = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave?.(form);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose?.(); }, 1800);
  };

  return (
    /* ── backdrop ── */
    <div
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={{
        position:"fixed", inset:0, background:"rgba(15,23,42,0.55)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"1rem", zIndex:200,
      }}
    >
      <div dir="rtl" style={{
        background:"#fff", borderRadius:16, width:"100%", maxWidth:480,
        border:"1.5px solid #E2E8F0", overflow:"hidden",
        fontFamily:"'Cairo',sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"1.1rem 1.25rem",
          borderBottom:"1.5px solid #F1F5F9", background:"#FAFCFF",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:10, background:"#EBF4FE",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, border:"1px solid #B5D4F4", flexShrink:0,
            }}>🎓</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>إضافة أستاذ جديد</div>
              <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>أدخل بيانات الأستاذ</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, border:"1px solid #E2E8F0",
            background:"#fff", cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center", color:"#64748B",
          }}>
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:"1.25rem", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Name + Phone */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="الاسم الكامل *">
              <input
                style={inputStyle(errors.name)}
                value={form.name} placeholder="محمد بن علي"
                onChange={e => { set("name", e.target.value); setErrors(er => ({...er, name:false})); }}
              />
            </Field>
            <Field label="رقم الهاتف">
              <input style={inputStyle()} value={form.phone} placeholder="0661 234 567"
                onChange={e => set("phone", e.target.value)} />
            </Field>
          </div>

          {/* Email + Salary */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="البريد الإلكتروني">
              <input style={inputStyle()} type="email" value={form.email} placeholder="prof@example.com"
                onChange={e => set("email", e.target.value)} />
            </Field>
            <Field label="الراتب الشهري (دج)">
              <input style={inputStyle()} type="number" value={form.salary} placeholder="35000"
                onChange={e => set("salary", e.target.value)} />
            </Field>
          </div>

          {/* Subjects */}
          <Field label={`المادة التي يدرّسها${errors.subjects ? " — مطلوب" : ""}`} full>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:2 }}>
              {SUBJECTS.map(s => (
                <div key={s} onClick={() => { toggleArr("subjects", s); setErrors(er => ({...er, subjects:false})); }}
                  style={{
                    padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:500,
                    border:`1.5px solid ${form.subjects.includes(s) ? "#185FA5" : (errors.subjects ? "#E24B4A" : "#E2E8F0")}`,
                    background: form.subjects.includes(s) ? "#EBF4FE" : "#F8FAFC",
                    color: form.subjects.includes(s) ? "#185FA5" : "#64748B",
                    cursor:"pointer", transition:"all .15s", userSelect:"none",
                  }}>
                  {s}
                </div>
              ))}
            </div>
          </Field>

          {/* Days */}
          <Field label="أيام التدريس" full>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginTop:2 }}>
              {DAYS.map(d => (
                <div key={d} onClick={() => toggleArr("days", d)}
                  style={{
                    padding:"6px 0", borderRadius:8, fontSize:11, fontWeight:500,
                    textAlign:"center", cursor:"pointer", transition:"all .15s",
                    border:`1.5px solid ${form.days.includes(d) ? "#185FA5" : "#E2E8F0"}`,
                    background: form.days.includes(d) ? "#EBF4FE" : "#F8FAFC",
                    color: form.days.includes(d) ? "#185FA5" : "#64748B",
                  }}>
                  {d}
                </div>
              ))}
            </div>
          </Field>

          {/* Time range */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="وقت البداية">
              <input style={inputStyle()} type="time" value={form.startTime}
                onChange={e => set("startTime", e.target.value)} />
            </Field>
            <Field label="وقت النهاية">
              <input style={inputStyle()} type="time" value={form.endTime}
                onChange={e => set("endTime", e.target.value)} />
            </Field>
          </div>

        </div>

        {/* ── Footer ── */}
        <div style={{
          display:"flex", gap:10, justifyContent:"flex-end",
          padding:"1rem 1.25rem",
          borderTop:"1.5px solid #F1F5F9", background:"#FAFCFF",
        }}>
          <button onClick={onClose} style={{
            padding:"8px 18px", borderRadius:9, border:"1.5px solid #E2E8F0",
            background:"#fff", color:"#64748B", fontSize:13, fontWeight:500,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            إلغاء
          </button>
          <button onClick={handleSave} style={{
            padding:"8px 22px", borderRadius:9, border:"none",
            background: saved ? "#0F6E56" : "#185FA5",
            color:"#fff", fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", gap:7,
            transition:"background .2s",
          }}>
            {saved
              ? "✓ تم الحفظ"
              : <><Plus size={15} /> حفظ الأستاذ</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}