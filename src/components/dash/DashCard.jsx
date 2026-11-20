import { Diamond } from "../home/Marks";

export default function DashCard({ title, action, className = "", children }) {
  return (
    <section className={`min-w-0 rounded-sm bg-white p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-base text-ink">
            <Diamond className="size-2 text-gold" />{title}
          </h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}