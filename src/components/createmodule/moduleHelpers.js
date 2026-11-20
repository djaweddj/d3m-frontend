export const DAY_VALUES = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export const LEVEL_KEYS = [
  "preparatory", "primary1", "primary2", "primary3", "primary4", "primary5",
  "middle1", "middle2", "middle3", "middle4",
  "secondary1", "secondary2", "secondary3", "other",
];

export const LEVEL_CANONICAL_AR = {
  preparatory: "التحضيري",
  primary1: "السنة الأولى ابتدائي",
  primary2: "السنة الثانية ابتدائي",
  primary3: "السنة الثالثة ابتدائي",
  primary4: "السنة الرابعة ابتدائي",
  primary5: "السنة الخامسة ابتدائي",
  middle1: "السنة الأولى متوسط",
  middle2: "السنة الثانية متوسط",
  middle3: "السنة الثالثة متوسط",
  middle4: "السنة الرابعة متوسط",
  secondary1: "السنة الأولى ثانوي",
  secondary2: "السنة الثانية ثانوي",
  secondary3: "السنة الثالثة ثانوي (البكالوريا)",
  other: "مستوى آخر...",
};

export const OTHER_LEVEL_VALUE = LEVEL_CANONICAL_AR.other;

export const NEW_SCHEDULE_ROW = { day: "", startTime: "08:00", endTime: "09:30" };

// ─── time-conflict helpers ────────────────────────────────────────────────────
function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function timeRangesOverlap(aStart, aEnd, bStart, bEnd) {
  const as = toMinutes(aStart), ae = toMinutes(aEnd);
  const bs = toMinutes(bStart), be = toMinutes(bEnd);
  if (as == null || ae == null || bs == null || be == null) return false;
  return as < be && bs < ae;
}

// Returns { [rowIndex]: conflictingModuleName } for the given entity
// (classroom OR teacher, selected by `entityField`) against every existing module.
function findEntityConflicts(entityId, entityField, schedules, modules) {
  const conflicts = {};
  if (!entityId) return conflicts;
  const eid = Number(entityId);

  schedules.forEach((row, idx) => {
    if (!row.day || !row.startTime || !row.endTime) return;
    for (const mod of modules) {
      if (Number(mod[entityField]) !== eid) continue;
      const modSchedules = mod.schedules ?? mod.scheduleEntries ?? [];
      for (const sch of modSchedules) {
        if (sch.day !== row.day) continue;
        if (timeRangesOverlap(row.startTime, row.endTime, sch.startTime?.slice(0, 5), sch.endTime?.slice(0, 5))) {
          conflicts[idx] = mod.name ?? mod.moduleName ?? "";
          break;
        }
      }
      if (conflicts[idx]) break;
    }
  });

  return conflicts;
}

export const findClassroomConflicts = (classroomId, schedules, modules) =>
  findEntityConflicts(classroomId, "classroomId", schedules, modules);

// ASSUMPTION (unchanged): modules expose the teacher id as `teacherId`.
export const findTeacherConflicts = (teacherId, schedules, modules) =>
  findEntityConflicts(teacherId, "teacherId", schedules, modules);