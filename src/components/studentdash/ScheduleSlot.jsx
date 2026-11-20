import { Clock } from "lucide-react";
import { ACCENT } from "./studentUtils";

export default function ScheduleSlot({ accent, subject, time, room }) {
  return (
    <div className={`rounded-sm border-s-4 bg-canvas p-2 ${ACCENT[accent]}`}>
      <p className="text-xs font-bold leading-snug text-ink">{subject}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-ink/60">
        <Clock className="size-2.5" />{time}
      </p>
      {room && <p className="text-[10px] text-ink/50">{room}</p>}
    </div>
  );
}
