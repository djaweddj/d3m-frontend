import Reveal from "./Reveal";

export default function FeatureCard({ icon: Icon, title, desc, delay = 0 }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="group h-full border border-gold/25 bg-white p-8 transition duration-500 hover:-translate-y-1 hover:border-gold">
        <span className="mb-6 grid size-12 place-items-center rounded-sm bg-green-deep text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
          <Icon className="size-6" strokeWidth={1.5} />
        </span>
        <h4 className="mb-3 font-display text-xl text-green-deep">{title}</h4>
        <p className="text-sm leading-7 text-green-deep/60">{desc}</p>
      </div>
    </Reveal>
  );
}