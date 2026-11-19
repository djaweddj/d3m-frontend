import { Diamond, GoldRule } from "./Marks";
import Reveal from "./Reveal";
import AnimatedText from "./AnimatedText";

export default function SectionHeader({ tag, title, subtitle }) {
  return (
    <Reveal className="mb-16 text-center">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-gold-deep">
        <Diamond className="size-2" />{tag}
      </span>
      <h2 className="mt-3 font-display text-3xl text-green-deep sm:text-5xl">
        <AnimatedText text={title} />
      </h2>
      {subtitle && <p className="mx-auto mt-5 max-w-xl leading-relaxed text-green-deep/60">{subtitle}</p>}
      <GoldRule className="mt-6" />
    </Reveal>
  );
}