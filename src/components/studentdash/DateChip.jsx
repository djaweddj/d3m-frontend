import { Clock } from "lucide-react";

export default function DateChip({ date, time }) {
  return (
    <div className="shrink-0 rounded-sm bg-ink px-3 py-2 text-center text-gold">
      <p className="text-xs font-bold">{date}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-ivory/70">
        <Clock className="size-2.5" />{time}
      </p>
    </div>
  );
}
