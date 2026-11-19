import Reveal from "../home/Reveal";
export default function TeacherCard({ teacher, index = 0 }) {
  const initials = (teacher.fullName || "")
    .split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Reveal delay={Math.min(index, 5) * 0.05} className="h-full">
      <div className="group h-full border border-gold/25 bg-white p-6 transition duration-500 hover:-translate-y-1 hover:border-gold">
        <div className="mb-4 flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-sm bg-green-deep font-display text-lg text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
            {initials}
          </span>
          <div className="min-w-0">
            <h4 className="truncate font-display text-lg text-green-deep">{teacher.fullName}</h4>
            <p className="truncate text-xs text-green-deep/60">{teacher.specialization}</p>
          </div>
        </div>

        {teacher.bio && <p className="mb-4 line-clamp-2 text-sm leading-7 text-green-deep/60">{teacher.bio}</p>}

        {teacher.subjectNames?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {teacher.subjectNames.map((s) => (
              <span key={s} className="border border-gold/30 bg-ivory px-3 py-1 text-xs font-bold text-green-deep">{s}</span>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}