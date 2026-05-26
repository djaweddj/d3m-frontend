import { useState } from "react";
import { Plus, X, Edit2, Trash2, Users, Check, XCircle, History } from "lucide-react";
import { useSchool } from "../context/SchoolContext";

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const DAYS_AR   = ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
const TIME_SLOTS= ["08:00","09:30","11:00","12:30","14:00","15:30","17:00"];
const SUBJECTS  = ["رياضيات","فيزياء","لغة عربية","علوم طبيعية","كيمياء","إنجليزية","فرنسية","تاريخ"];
const CLASSES   = ["أ","ب","ج","د"];
const SESSIONS_PER_MONTH = 4;

const SUBJECT_COLORS = {
  "رياضيات":    {bg:"#EEF2FF",text:"#4338CA",border:"#C7D2FE"},
  "فيزياء":     {bg:"#ECFDF5",text:"#065F46",border:"#A7F3D0"},
  "لغة عربية":  {bg:"#FEF3C7",text:"#92400E",border:"#FDE68A"},
  "علوم طبيعية":{bg:"#F3E8FF",text:"#6B21A8",border:"#E9D5FF"},
  "كيمياء":     {bg:"#FFF1F2",text:"#9F1239",border:"#FECDD3"},
  "إنجليزية":   {bg:"#F0FDF4",text:"#14532D",border:"#BBF7D0"},
};
const colorFor = s => SUBJECT_COLORS[s] || {bg:"#F1F5F9",text:"#475569",border:"#CBD5E1"};

// ─────────────────────────────────────────────────────────
// Mock student data per session  key = `${sessionId}`
// ─────────────────────────────────────────────────────────
const SESSION_STUDENTS = {
  1:[
    {id:101,name:"أحمد بن يوسف",   attended:2,paidSessions:4},
    {id:102,name:"مريم الزهراء",   attended:4,paidSessions:4},
    {id:103,name:"يوسف بلقاسم",    attended:1,paidSessions:4},
    {id:104,name:"سارة منصور",     attended:3,paidSessions:4},
  ],
  2:[
    {id:201,name:"كريم بوعلام",    attended:3,paidSessions:4},
    {id:202,name:"نور الهدى",       attended:0,paidSessions:4},
    {id:203,name:"إيمان بن علي",   attended:2,paidSessions:4},
  ],
  3:[
    {id:301,name:"هشام الرباطي",   attended:4,paidSessions:4},
    {id:302,name:"لينا سعيدي",     attended:1,paidSessions:4},
  ],
  4:[
    {id:401,name:"رضا بن عمر",     attended:3,paidSessions:4},
    {id:402,name:"آية الله تواتي", attended:2,paidSessions:4},
    {id:403,name:"خالد مزيان",     attended:0,paidSessions:4},
  ],
  5:[
    {id:501,name:"سمية بلال",      attended:3,paidSessions:4},
    {id:502,name:"وليد حمزة",      attended:4,paidSessions:4},
  ],
  6:[
    {id:601,name:"أمينة بوشطة",    attended:2,paidSessions:4},
    {id:602,name:"يوسف العيد",     attended:1,paidSessions:4},
  ],
};

// ─────────────────────────────────────────────────────────
// Shared small components
// ─────────────────────────────────────────────────────────
const inputSt = {
  padding:"7px 10px",borderRadius:8,border:"1.5px solid #E2E8F0",
  fontSize:13,fontFamily:"'Cairo',sans-serif",color:"#0F172A",
  background:"#FAFCFF",outline:"none",width:"100%",
};

function Field({label,children}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:11,fontWeight:600,color:"#64748B"}}>{label}</label>
      {children}
    </div>
  );
}

function ModalWrap({onClose,children,maxWidth=400}){
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",
        display:"flex",alignItems:"center",justifyContent:"center",
        zIndex:200,padding:"1rem"}}>
      <div dir="rtl" style={{background:"#fff",borderRadius:14,width:"100%",
        maxWidth,border:"1.5px solid #E2E8F0",overflow:"hidden",
        fontFamily:"'Cairo',sans-serif",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({icon,title,sub,onClose}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"1rem 1.25rem",borderBottom:"1.5px solid #F1F5F9",
      background:"#FAFCFF",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:"#EBF4FE",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:16,border:"1px solid #B5D4F4",flexShrink:0}}>{icon}</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{title}</div>
          <div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{sub}</div>
        </div>
      </div>
      <button onClick={onClose} style={{width:28,height:28,borderRadius:7,
        border:"1px solid #E2E8F0",background:"#fff",cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <X size={13} color="#64748B"/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// History modal (nested inside Students modal)
// ─────────────────────────────────────────────────────────
function HistoryModal({student,onClose}){
  const history = Array.from({length:student.paidSessions},(_,i)=>({
    n: i+1,
    date:`2026-05-${(9+i).toString().padStart(2,"0")}`,
    present: i < student.attended,
  }));
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(15,23,42,.65)",
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"1rem"}}>
      <div dir="rtl" style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:340,
        border:"1.5px solid #E2E8F0",overflow:"hidden",fontFamily:"'Cairo',sans-serif"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"1rem 1.25rem",borderBottom:"1.5px solid #F1F5F9",background:"#FAFCFF"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>سجل {student.name}</div>
            <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>تاريخ الحضور والغياب</div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,
            border:"1px solid #E2E8F0",background:"#fff",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={13} color="#64748B"/>
          </button>
        </div>
        <div style={{padding:"1rem 1.25rem",display:"flex",flexDirection:"column",gap:7}}>
          {history.map(h=>(
            <div key={h.n} style={{display:"flex",alignItems:"center",gap:10,
              padding:"8px 12px",borderRadius:9,
              background:h.present?"#E1F5EE":"#FEE2E2",
              border:`1px solid ${h.present?"#5DCAA5":"#FCA5A5"}`}}>
              <span style={{fontSize:16}}>{h.present?"✅":"❌"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>حصة {h.n}</div>
                <div style={{fontSize:10,color:"#64748B",marginTop:1}}>{h.date}</div>
              </div>
              <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,
                background:"#fff",border:`1px solid ${h.present?"#5DCAA5":"#FCA5A5"}`,
                color:h.present?"#0F6E56":"#DC2626"}}>
                {h.present?"حاضر":"غائب"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Students attendance modal
// ─────────────────────────────────────────────────────────
function StudentsModal({session,onClose}){
  const c = colorFor(session.subject);
  const raw = SESSION_STUDENTS[session.id] || [];
  const [students,setStudents] = useState(raw.map(s=>({...s,todayStatus:null})));
  const [histStudent,setHistStudent] = useState(null);

  const mark = (id,status) =>
    setStudents(prev=>prev.map(s=>s.id===id
      ? {...s, todayStatus: s.todayStatus===status ? null : status}
      : s));

  const remaining = s => s.paidSessions - s.attended;
  const needsPay  = s => remaining(s) <= 0;
  const marked    = students.filter(s=>s.todayStatus!==null).length;

  return(
    <>
    <ModalWrap onClose={onClose} maxWidth={500}>

      {/* Coloured header */}
      <div style={{padding:"1.1rem 1.25rem",background:c.bg,
        borderBottom:`1.5px solid ${c.border}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:c.text}}>
              {session.subject} — قسم {session.classNum}
            </div>
            <div style={{fontSize:11,color:c.text,opacity:.8,marginTop:3,display:"flex",gap:12}}>
              <span>👨‍🏫 {session.teacher}</span>
              <span>🕐 {session.start}</span>
              <span>🚪 ق.{session.room}</span>
            </div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,
            border:`1px solid ${c.border}`,background:"rgba(255,255,255,.5)",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={14} color={c.text}/>
          </button>
        </div>
        {/* Summary pills */}
        <div style={{display:"flex",gap:7,marginTop:10}}>
          {[
            `${students.length} طالب`,
            `${students.filter(s=>s.todayStatus==="present").length} حاضر`,
            `${students.filter(s=>s.todayStatus==="absent").length} غائب`,
          ].map(lbl=>(
            <span key={lbl} style={{fontSize:10,fontWeight:600,padding:"3px 10px",
              borderRadius:20,background:"rgba(255,255,255,.5)",color:c.text,
              border:`1px solid ${c.border}`}}>{lbl}</span>
          ))}
        </div>
      </div>

      {/* Student rows */}
      <div style={{overflowY:"auto",flex:1}}>
        {students.length===0
          ? <div style={{padding:"2rem",textAlign:"center",color:"#94A3B8",fontSize:13}}>
              لا يوجد طلاب مسجلون في هذه الحصة
            </div>
          : students.map((s,i)=>{
              const rem  = remaining(s);
              const pays = needsPay(s);
              const remColor = pays?"#DC2626": rem<=1?"#BA7517":"#0F6E56";
              return(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,
                  padding:"11px 1.25rem",
                  borderBottom:i<students.length-1?"1px solid #F8FAFC":"none",
                  background:s.todayStatus==="present"?"rgba(225,245,238,.5)"
                    :s.todayStatus==="absent"?"rgba(254,226,226,.4)":"#fff",
                  transition:"background .2s"}}>

                  {/* Avatar */}
                  <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,
                    background:pays?"#FEE2E2":"#EBF4FE",
                    border:`2px solid ${pays?"#FCA5A5":"#B5D4F4"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:700,color:pays?"#DC2626":"#0C447C"}}>
                    {s.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </div>

                  {/* Name + remaining */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0F172A",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {s.name}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                      <span style={{fontSize:10,fontWeight:600,color:remColor}}>
                        {pays?"يجب تجديد الدفع"
                          :`${rem} حصة متبقية من ${SESSIONS_PER_MONTH}`}
                      </span>
                      {pays&&(
                        <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",
                          borderRadius:20,background:"#FEE2E2",color:"#DC2626",
                          border:"1px solid #FCA5A5"}}>تجديد!</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{width:44,flexShrink:0}}>
                    <div style={{height:4,borderRadius:4,background:"#F1F5F9",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:4,
                        width:`${(s.attended/s.paidSessions)*100}%`,
                        background:pays?"#EF4444":rem<=1?"#F59E0B":"#0F6E56",
                        transition:"width .3s"}}/>
                    </div>
                    <div style={{fontSize:9,color:"#94A3B8",textAlign:"center",marginTop:2}}>
                      {s.attended}/{s.paidSessions}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    {/* Present */}
                    <button onClick={()=>mark(s.id,"present")} title="حاضر"
                      style={{width:30,height:30,borderRadius:8,cursor:"pointer",
                        border:`1.5px solid ${s.todayStatus==="present"?"#0F6E56":"#E2E8F0"}`,
                        background:s.todayStatus==="present"?"#E1F5EE":"#fff",
                        color:s.todayStatus==="present"?"#0F6E56":"#94A3B8",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all .15s"}}>
                      <Check size={13}/>
                    </button>
                    {/* Absent */}
                    <button onClick={()=>mark(s.id,"absent")} title="غائب"
                      style={{width:30,height:30,borderRadius:8,cursor:"pointer",
                        border:`1.5px solid ${s.todayStatus==="absent"?"#DC2626":"#E2E8F0"}`,
                        background:s.todayStatus==="absent"?"#FEE2E2":"#fff",
                        color:s.todayStatus==="absent"?"#DC2626":"#94A3B8",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all .15s"}}>
                      <XCircle size={13}/>
                    </button>
                    {/* History */}
                    <button onClick={()=>setHistStudent(s)} title="السجل"
                      style={{width:30,height:30,borderRadius:8,cursor:"pointer",
                        border:"1.5px solid #E2E8F0",background:"#fff",color:"#94A3B8",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#185FA5";e.currentTarget.style.color="#185FA5"}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.color="#94A3B8"}}>
                      <History size={13}/>
                    </button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Footer */}
      <div style={{padding:".85rem 1.25rem",borderTop:"1.5px solid #F1F5F9",
        background:"#FAFCFF",display:"flex",justifyContent:"space-between",
        alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:11,color:"#94A3B8"}}>{marked} من {students.length} تم تسجيلهم</span>
        <button onClick={onClose} style={{padding:"7px 18px",borderRadius:9,border:"none",
          background:"#185FA5",color:"#fff",fontSize:13,fontWeight:600,
          cursor:"pointer",fontFamily:"inherit"}}>
          حفظ الحضور
        </button>
      </div>
    </ModalWrap>

    {/* Nested history modal */}
    {histStudent && <HistoryModal student={histStudent} onClose={()=>setHistStudent(null)}/>}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Session chip  (edit | delete | students icons on hover)
// ─────────────────────────────────────────────────────────
function SessionChip({s,onEdit,onDelete,onStudents,onDragStart}){
  const c = colorFor(s.subject);
  const [hov,setHov] = useState(false);
  const count = (SESSION_STUDENTS[s.id]||[]).length;

  return(
    <div draggable onDragStart={onDragStart}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{borderRadius:8,padding:"5px 7px",
        background:c.bg,border:`1.5px solid ${c.border}`,
        cursor:"grab",position:"relative",
        filter:hov?"brightness(.93)":"none",
        boxShadow:hov?"0 2px 8px rgba(0,0,0,.1)":"none",
        transition:"filter .15s,box-shadow .15s"}}>

      <div style={{fontSize:11,fontWeight:700,color:c.text}}>{s.subject} — {s.classNum}</div>
      <div style={{fontSize:9,color:c.text,opacity:.75,marginTop:1}}>
        {s.teacher.split(" ")[0]} · ق.{s.room}
      </div>
      {/* Student count badge */}
      <div style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}>
        <Users size={8} color={c.text} style={{opacity:.6}}/>
        <span style={{fontSize:9,color:c.text,opacity:.65}}>{count} طالب</span>
      </div>

      {/* Hover actions: ✏️  🗑️  👥 */}
      {hov && (
        <div style={{position:"absolute",top:3,left:3,display:"flex",gap:3}}>
          <button onClick={e=>{e.stopPropagation();onEdit();}} title="تعديل"
            style={{width:20,height:20,borderRadius:5,border:"none",
              background:"rgba(255,255,255,.75)",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Edit2 size={10} color="#475569"/>
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete();}} title="حذف"
            style={{width:20,height:20,borderRadius:5,border:"none",
              background:"rgba(255,255,255,.75)",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Trash2 size={10} color="#DC2626"/>
          </button>
          <button onClick={e=>{e.stopPropagation();onStudents();}} title="التلاميذ"
            style={{width:20,height:20,borderRadius:5,border:"none",
              background:"rgba(255,255,255,.75)",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Users size={10} color="#185FA5"/>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Add / Edit modal
// ─────────────────────────────────────────────────────────
const EMPTY_FORM = {day:0,start:TIME_SLOTS[0],subject:"رياضيات",classNum:"أ",teacher:"",room:""};

function SessionModal({mode,session,onClose,onSave}){
  const [form,setForm] = useState(
    mode==="edit"&&session
      ? {day:session.day,start:session.start,subject:session.subject,
         classNum:session.classNum,teacher:session.teacher,room:session.room}
      : {...EMPTY_FORM,...(session?{day:session.day,start:session.start}:{})}
  );
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const sel={...inputSt,cursor:"pointer"};

  return(
    <ModalWrap onClose={onClose}>
      <ModalHeader
        icon={mode==="add"?"📅":"✏️"}
        title={mode==="add"?"إضافة حصة":"تعديل الحصة"}
        sub={mode==="add"?"أدخل بيانات الحصة":"عدّل بيانات الحصة"}
        onClose={onClose}/>
      <div style={{padding:"1.1rem 1.25rem",display:"flex",flexDirection:"column",gap:11}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="اليوم">
            <select style={sel} value={form.day} onChange={e=>set("day",+e.target.value)}>
              {DAYS_AR.map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>
          </Field>
          <Field label="وقت البداية">
            <select style={sel} value={form.start} onChange={e=>set("start",e.target.value)}>
              {TIME_SLOTS.slice(0,-1).map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="المادة">
            <select style={sel} value={form.subject} onChange={e=>set("subject",e.target.value)}>
              {SUBJECTS.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="القسم">
            <select style={sel} value={form.classNum} onChange={e=>set("classNum",e.target.value)}>
              {CLASSES.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="الأستاذ">
            <input style={inputSt} placeholder="أ. الاسم" value={form.teacher}
              onChange={e=>set("teacher",e.target.value)}/>
          </Field>
          <Field label="رقم القاعة">
            <input style={inputSt} placeholder="3" value={form.room}
              onChange={e=>set("room",e.target.value)}/>
          </Field>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",
        padding:".9rem 1.25rem",borderTop:"1.5px solid #F1F5F9",background:"#FAFCFF"}}>
        <button onClick={onClose} style={{padding:"7px 16px",borderRadius:8,
          border:"1.5px solid #E2E8F0",background:"#fff",color:"#64748B",
          fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>إلغاء</button>
        <button onClick={()=>onSave(form)} style={{padding:"7px 18px",borderRadius:8,
          border:"none",background:"#185FA5",color:"#fff",
          fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          {mode==="add"?"إضافة الحصة":"حفظ التعديلات"}
        </button>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────
// Delete confirm modal
// ─────────────────────────────────────────────────────────
function DeleteModal({session,onClose,onConfirm}){
  return(
    <ModalWrap onClose={onClose} maxWidth={360}>
      <ModalHeader icon="🗑️" title="حذف الحصة" sub="تأكيد الحذف" onClose={onClose}/>
      <div style={{padding:"1.5rem",display:"flex",flexDirection:"column",
        alignItems:"center",gap:12,textAlign:"center"}}>
        <div style={{fontSize:36}}>⚠️</div>
        <p style={{fontSize:13,color:"#64748B",lineHeight:1.6}}>
          هل أنت متأكد من حذف حصة{" "}
          <strong style={{color:"#0F172A"}}>{session.subject}</strong>{" "}
          للقسم <strong style={{color:"#0F172A"}}>{session.classNum}</strong>؟
          <br/>لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{padding:"7px 18px",borderRadius:8,
            border:"1.5px solid #E2E8F0",background:"#fff",color:"#64748B",
            fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>إلغاء</button>
          <button onClick={onConfirm} style={{padding:"7px 20px",borderRadius:8,
            border:"none",background:"#E24B4A",color:"#fff",
            fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>حذف</button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────
// Main Schedule page
// ─────────────────────────────────────────────────────────
const INITIAL_SESSIONS = [
  {id:1,day:0,start:"08:00",subject:"رياضيات",  teacher:"أ. محمد العلمي",   room:"3",  classNum:"أ"},
  {id:2,day:0,start:"09:30",subject:"فيزياء",   teacher:"أ. كريم بوعلام",   room:"1",  classNum:"ب"},
  {id:3,day:1,start:"11:00",subject:"لغة عربية",teacher:"أ. نادية التطواني",room:"5",  classNum:"أ"},
  {id:4,day:2,start:"14:00",subject:"علوم طبيعية",teacher:"أ. سارة منصور", room:"م1", classNum:"ج"},
  {id:5,day:3,start:"09:30",subject:"رياضيات",  teacher:"أ. محمد العلمي",   room:"3",  classNum:"ب"},
  {id:6,day:4,start:"11:00",subject:"كيمياء",   teacher:"أ. يوسف بن حسين", room:"م2", classNum:"أ"},
];

export default function Schedule(){
  const {school} = useSchool();
  const p = school.primaryColor;

  const [sessions,   setSessions]  = useState(INITIAL_SESSIONS);
  const [nextId,     setNextId]    = useState(20);
  const [modal,      setModal]     = useState(null); // {mode, session}
  const [deleteS,    setDeleteS]   = useState(null);
  const [studentsS,  setStudentsS] = useState(null); // session to show students for
  const [dragId,     setDragId]    = useState(null);
  const [overCell,   setOverCell]  = useState(null);

  const timeRanges = TIME_SLOTS.slice(0,-1).map((t,i)=>({start:t,end:TIME_SLOTS[i+1]}));

  const addSession  = form=>{setSessions(p=>[...p,{id:nextId,...form,teacher:form.teacher||"—",room:form.room||"—"}]);setNextId(n=>n+1);setModal(null);};
  const editSession = form=>{setSessions(p=>p.map(s=>s.id===modal.session.id?{...s,...form}:s));setModal(null);};
  const delSession  = ()=>{setSessions(p=>p.filter(s=>s.id!==deleteS.id));setDeleteS(null);};
  const onDrop=(day,start)=>{if(dragId===null)return;setSessions(p=>p.map(s=>s.id===dragId?{...s,day,start}:s));setDragId(null);setOverCell(null);};
  const isOver=(day,start)=>overCell&&overCell.day===day&&overCell.start===start;

  return(
    <div dir="rtl" style={{padding:"1.25rem",fontFamily:"'Cairo',sans-serif",
      background:"#F8FAFC",minHeight:"100vh",display:"flex",flexDirection:"column",gap:"1rem"}}>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontSize:15,fontWeight:700,color:"#0F172A",margin:0}}>الجدول الأسبوعي</h1>
          <p style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{sessions.length} حصة مسجلة</p>
        </div>
        <button onClick={()=>setModal({mode:"add",session:null})}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
            borderRadius:8,background:p,color:"#fff",border:"none",
            fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          <Plus size={14}/> إضافة حصة
        </button>
      </div>

      {/* Timetable */}
      <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #E2E8F0",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:600,tableLayout:"fixed"}}>
          <thead>
            <tr style={{borderBottom:"1.5px solid #E2E8F0"}}>
              <th style={{padding:"10px 8px",fontSize:11,fontWeight:700,color:"#64748B",textAlign:"right",width:80}}>الوقت</th>
              {DAYS_AR.map(d=>(
                <th key={d} style={{padding:"10px 8px",fontSize:11,fontWeight:700,color:"#64748B",textAlign:"center"}}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRanges.map(({start,end},ri)=>(
              <tr key={start} style={{borderBottom:ri<timeRanges.length-1?"1px solid #F8FAFC":"none"}}>
                <td style={{padding:"6px 8px",whiteSpace:"nowrap"}}>
                  <span style={{fontSize:10,fontWeight:600,color:"#94A3B8"}}>{start}–{end}</span>
                </td>
                {[0,1,2,3,4,5].map(day=>{
                  const inCell=sessions.filter(s=>s.day===day&&s.start===start);
                  return(
                    <td key={day} style={{padding:"5px 4px",verticalAlign:"top"}}>
                      <div
                        onDragOver={e=>{e.preventDefault();setOverCell({day,start});}}
                        onDragLeave={()=>setOverCell(null)}
                        onDrop={()=>onDrop(day,start)}
                        style={{minHeight:44,borderRadius:8,padding:2,
                          border:`1.5px dashed ${isOver(day,start)?"#185FA5":"transparent"}`,
                          background:isOver(day,start)?"rgba(24,95,165,.06)":"transparent",
                          display:"flex",flexDirection:"column",gap:4,
                          transition:"border-color .15s,background .15s"}}>

                        {inCell.map(s=>(
                          <SessionChip key={s.id} s={s}
                            onEdit    ={()=>setModal({mode:"edit",session:s})}
                            onDelete  ={()=>setDeleteS(s)}
                            onStudents={()=>setStudentsS(s)}
                            onDragStart={()=>setDragId(s.id)}
                          />
                        ))}

                        <button onClick={()=>setModal({mode:"add",session:{day,start}})}
                          style={{width:"100%",padding:"3px 0",borderRadius:7,
                            border:"1px dashed #E2E8F0",background:"transparent",
                            cursor:"pointer",fontSize:10,color:"#CBD5E1",
                            fontFamily:"inherit",transition:"all .15s",
                            marginTop:inCell.length?2:0}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#185FA5";e.currentTarget.style.color="#185FA5";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.color="#CBD5E1";}}>
                          + حصة
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {Object.entries(SUBJECT_COLORS).map(([label,c])=>(
          <span key={label} style={{fontSize:11,fontWeight:600,padding:"3px 12px",
            borderRadius:20,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>
            {label}
          </span>
        ))}
      </div>

      {/* Modals */}
      {modal     && <SessionModal  mode={modal.mode} session={modal.session} onClose={()=>setModal(null)}    onSave={modal.mode==="add"?addSession:editSession}/>}
      {deleteS   && <DeleteModal   session={deleteS}  onClose={()=>setDeleteS(null)}   onConfirm={delSession}/>}
      {studentsS && <StudentsModal session={studentsS} onClose={()=>setStudentsS(null)}/>}
    </div>
  );
}