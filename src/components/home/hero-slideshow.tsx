"use client";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { PauseIcon, PlayIcon } from "@/components/icons";

export type HeroSlide = { src: string; alt: string; caption: string; credit: ReactNode };
type Labels = { region: string; pause: string; play: string; slide: string; of: string; goTo: string };

const INTERVAL = 6000;

export function HeroSlideshow({ slides, labels, numLocale = "en-US" }: { slides: HeroSlide[]; labels: Labels; numLocale?: string }) {
  const num = (n: number) => n.toLocaleString(numLocale);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [focused, setFocused] = useState(false);

  // Autoplay only when the visitor has not asked for reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || focused || slides.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => window.clearInterval(id);
  }, [playing, focused, slides.length]);

  const running = playing && !focused && slides.length > 1;

  return (
    <section
      className="hero hm-hero"
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onFocus={(e) => { if (e.target.matches(":focus-visible")) setFocused(true); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
    >
      <div aria-live={running ? "off" : "polite"}>
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.src}
              className="hero__slide"
              data-active={active}
              role="group"
              aria-roledescription="slide"
              aria-label={`${labels.slide} ${num(i + 1)} ${labels.of} ${num(slides.length)}`}
              aria-hidden={!active}
              inert={!active}
            >
              <Image src={s.src} alt={s.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
              <div className="hero__caption hm-hero__caption">
                <span className="hm-hero__text">{s.caption}</span>
                {s.credit}
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="hero__dots hm-hero__dots" role="group" aria-label={labels.region}>
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className="hero__dot"
              aria-current={i === index}
              aria-label={`${labels.goTo} ${num(i + 1)}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="icon-btn icon-btn--solid hero__control"
        aria-pressed={!playing}
        aria-label={playing ? labels.pause : labels.play}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
    </section>
  );
}
