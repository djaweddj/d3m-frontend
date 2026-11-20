// Four-segment password strength meter. score: 0..4, label: text shown beside the bar.
const BAR = ["bg-algeria-red", "bg-algeria-red", "bg-gold", "bg-green-deep", "bg-green-deep"];
const TEXT = ["text-algeria-red", "text-algeria-red", "text-gold-deep", "text-green-deep", "text-green-deep"];

export default function StrengthMeter({ score = 0, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 transition-colors duration-300 ${i < score ? BAR[score] : "bg-sand"}`}
          />
        ))}
      </div>
      <span className={`whitespace-nowrap text-xs font-bold ${TEXT[score]}`}>{label}</span>
    </div>
  );
}