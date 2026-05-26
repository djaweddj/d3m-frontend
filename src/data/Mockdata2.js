// ── Students ───────────────────────────────────────────────────────────────
export const STUDENTS = [
  { id: 1, name: "أحمد بن علي", level: "3 ثانوي", subjects: ["رياضيات", "فيزياء"], fee: 3500, paid: true, phone: "0661234567" },
  { id: 2, name: "فاطمة الزهراء", level: "2 ثانوي", subjects: ["علوم طبيعية"], fee: 2800, paid: true, phone: "0551234567" },
  { id: 3, name: "يوسف كريمي", level: "1 ثانوي", subjects: ["رياضيات", "لغة عربية"], fee: 3000, paid: false, phone: "0771234567" },
  { id: 4, name: "سمية بوخالفة", level: "3 ثانوي", subjects: ["فيزياء"], fee: 1800, paid: true, phone: "0561234567" },
  { id: 5, name: "رضا منصوري", level: "2 متوسط", subjects: ["لغة عربية", "تاريخ"], fee: 2200, paid: false, phone: "0771234568" },
  { id: 6, name: "إيمان بلحوسين", level: "3 ثانوي", subjects: ["رياضيات"], fee: 1800, paid: true, phone: "0661234568" },
  { id: 7, name: "كمال زروق", level: "1 متوسط", subjects: ["علوم طبيعية", "رياضيات"], fee: 3200, paid: true, phone: "0551234568" },
  { id: 8, name: "هاجر عيسى", level: "2 ثانوي", subjects: ["لغة فرنسية"], fee: 1800, paid: false, phone: "0771234569" },
];

// ── Teachers ───────────────────────────────────────────────────────────────
export const TEACHERS = [
  { id: 1, name: "محمد الصالح", subject: "رياضيات", sessionsPerWeek: 12, phone: "0661111111", email: "m.salah@amal.dz" },
  { id: 2, name: "سارة بوعزة", subject: "فيزياء وكيمياء", sessionsPerWeek: 10, phone: "0551111111", email: "s.bouaza@amal.dz" },
  { id: 3, name: "كريم منصوري", subject: "لغة عربية", sessionsPerWeek: 8, phone: "0771111111", email: "k.mansouri@amal.dz" },
  { id: 4, name: "ليلى بن علي", subject: "علوم طبيعية", sessionsPerWeek: 9, phone: "0661111112", email: "l.benali@amal.dz" },
  { id: 5, name: "عمر حمزة", subject: "تاريخ وجغرافيا", sessionsPerWeek: 6, phone: "0551111112", email: "o.hamza@amal.dz" },
  { id: 6, name: "نادية قاسم", subject: "لغة فرنسية", sessionsPerWeek: 7, phone: "0771111112", email: "n.kassem@amal.dz" },
];

// ── Weekly schedule ────────────────────────────────────────────────────────
// days: 0=Sun … 4=Thu  |  room: string
export const SCHEDULE = [
  { id: 1, subject: "رياضيات", teacher: "محمد الصالح", day: 0, startTime: "08:00", endTime: "10:00", room: "3", color: "#EEF2FF", textColor: "#4338CA" },
  { id: 2, subject: "فيزياء", teacher: "سارة بوعزة", day: 0, startTime: "10:00", endTime: "12:00", room: "1", color: "#ECFDF5", textColor: "#065F46" },
  { id: 3, subject: "لغة عربية", teacher: "كريم منصوري", day: 0, startTime: "14:00", endTime: "16:00", room: "5", color: "#FEF3C7", textColor: "#92400E" },
  { id: 4, subject: "علوم طبيعية", teacher: "ليلى بن علي", day: 0, startTime: "16:00", endTime: "18:00", room: "2", color: "#F3E8FF", textColor: "#6B21A8" },
  { id: 5, subject: "رياضيات", teacher: "محمد الصالح", day: 1, startTime: "10:00", endTime: "12:00", room: "3", color: "#EEF2FF", textColor: "#4338CA" },
  { id: 6, subject: "علوم طبيعية", teacher: "ليلى بن علي", day: 1, startTime: "14:00", endTime: "16:00", room: "2", color: "#F3E8FF", textColor: "#6B21A8" },
  { id: 7, subject: "فيزياء", teacher: "سارة بوعزة", day: 2, startTime: "08:00", endTime: "10:00", room: "1", color: "#ECFDF5", textColor: "#065F46" },
  { id: 8, subject: "رياضيات", teacher: "محمد الصالح", day: 2, startTime: "14:00", endTime: "16:00", room: "3", color: "#EEF2FF", textColor: "#4338CA" },
  { id: 9, subject: "رياضيات", teacher: "محمد الصالح", day: 3, startTime: "08:00", endTime: "10:00", room: "3", color: "#EEF2FF", textColor: "#4338CA" },
  { id: 10, subject: "لغة عربية", teacher: "كريم منصوري", day: 3, startTime: "10:00", endTime: "12:00", room: "5", color: "#FEF3C7", textColor: "#92400E" },
  { id: 11, subject: "علوم طبيعية", teacher: "ليلى بن علي", day: 3, startTime: "16:00", endTime: "18:00", room: "2", color: "#F3E8FF", textColor: "#6B21A8" },
  { id: 12, subject: "فيزياء", teacher: "سارة بوعزة", day: 4, startTime: "10:00", endTime: "12:00", room: "1", color: "#ECFDF5", textColor: "#065F46" },
  { id: 13, subject: "لغة عربية", teacher: "كريم منصوري", day: 4, startTime: "14:00", endTime: "16:00", room: "5", color: "#FEF3C7", textColor: "#92400E" },
];

// ── Monthly income (Sep→Aug) ────────────────────────────────────────────────
export const MONTHLY_INCOME = [
  { month: "سبتمبر", amount: 42000 },
  { month: "أكتوبر", amount: 58000 },
  { month: "نوفمبر", amount: 63000 },
  { month: "ديسمبر", amount: 67000 },
  { month: "جانفي", amount: 73500 },
  { month: "فيفري", amount: 69000 },
  { month: "مارس", amount: 58000 },
  { month: "أبريل", amount: 62000 },
  { month: "ماي", amount: 71000 },
  { month: "جوان", amount: 78000 },
  { month: "جويلية", amount: 55000 },
  { month: "أوت", amount: 40000 },
];

export const SUBJECT_BREAKDOWN = [
  { label: "رياضيات", value: 35, color: "#2563EB" },
  { label: "فيزياء", value: 28, color: "#10B981" },
  { label: "لغة عربية", value: 22, color: "#F59E0B" },
  { label: "أخرى", value: 15, color: "#8B5CF6" },
];

export const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
export const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];