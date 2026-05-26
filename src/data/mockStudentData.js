// src/data/mockStudentData.js
// Drop this next to your existing mockData.js

export const mockStudent = {
  id: "s1",
  name: "أحمد بن يوسف",
  age: 17,
  phone: "0661234567",
  email: "ahmed@example.com",
  avatar: "أب", // initials
  joinedAt: "2024-09-01",

  // Schools the student is enrolled in
  enrollments: [
    {
      schoolId: "1",
      schoolName: "مدرسة النجاح للرياضيات",
      teacher: "الأستاذ محمد العلمي",
      location: "الرباط، المركز",
      price: 500,
      sessions: [
        { id: "s1-1", subject: "الرياضيات",  day: "السبت",    time: "16:00 - 17:30", room: "قاعة أ" },
        { id: "s1-2", subject: "الفيزياء",   day: "الاثنين",  time: "16:00 - 17:30", room: "قاعة ب" },
        { id: "s1-3", subject: "الكيمياء",   day: "الأربعاء", time: "17:00 - 18:30", room: "قاعة ج" },
      ],
      upcoming: [
        { date: "2026-05-25", subject: "الرياضيات",  time: "16:00", type: "حصة عادية" },
        { date: "2026-05-27", subject: "الفيزياء",   time: "16:00", type: "حصة عادية" },
        { date: "2026-05-29", subject: "الكيمياء",   time: "17:00", type: "مراجعة"    },
      ],
    },
    {
      schoolId: "6",
      schoolName: "أكاديمية البرمجة والتكنولوجيا",
      teacher: "المهندس أمين الرباطي",
      location: "الرباط، أكدال",
      price: 600,
      sessions: [
        { id: "s6-1", subject: "البرمجة",        day: "الأحد",    time: "15:00 - 17:00", room: "مختبر ١" },
        { id: "s6-2", subject: "علوم الحاسوب",   day: "الثلاثاء", time: "15:00 - 16:30", room: "مختبر ١" },
      ],
      upcoming: [
        { date: "2026-05-26", subject: "البرمجة",      time: "15:00", type: "مشروع" },
        { date: "2026-05-28", subject: "علوم الحاسوب", time: "15:00", type: "حصة عادية" },
      ],
    },
  ],
};

// Days used in the weekly timetable grid
export const WEEK_DAYS = ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];