"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// High-quality royalty-free images from Unsplash (school, campus, study, calendars)
// w=1920 for full-screen hero; q=90 for sharpness. Unsplash license: free to use.
const HERO_IMAGE_SOURCES = [
  { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=90", alt: "University lecture hall" },
  { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=90", alt: "University classroom" },
  { src: "https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=90", alt: "University campus" },
  { src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=90", alt: "Students studying on campus" },
  { src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=90", alt: "University library" },
  { src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=90", alt: "Student studying with laptop and notes" },
  { src: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1920&q=90", alt: "Calendar and planner" },
  { src: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1920&q=90", alt: "Desk calendar and notes" },
];

const ROTATE_INTERVAL_MS = 4000;

/** Deterministic reorder so server and client render the same (avoids hydration mismatch). */
function deterministicOrder<T>(array: T[], seed: number): T[] {
  const out = [...array];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const HERO_IMAGES_ORDERED = deterministicOrder(HERO_IMAGE_SOURCES, 42);

function PlaceholderSlide() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)]/20"
      aria-hidden
    >
      <span className="text-center text-lg font-bold text-[var(--text)]/80">
        Your syllabus,
        <br />
        one calendar.
      </span>
    </div>
  );
}

type HeroImageCarouselProps = {
  fullScreen?: boolean;
};

export function HeroImageCarousel({ fullScreen = false }: HeroImageCarouselProps) {
  const images = HERO_IMAGES_ORDERED;
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const id = setInterval(goNext, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [goNext]);

  const handleError = (i: number) => {
    setFailed((prev) => ({ ...prev, [i]: true }));
  };

  const allFailed = images.length === Object.keys(failed).length;

  const containerClass = fullScreen
    ? "absolute inset-0 w-full h-full overflow-hidden"
    : "relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg)] shadow-soft";

  if (allFailed) {
    return (
      <div className={containerClass}>
        <PlaceholderSlide />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {images.map((item, i) => (
        <div
          key={`${item.src}-${i}`}
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            zIndex: i === index ? 1 : 0,
            pointerEvents: i === index ? "auto" : "none",
          }}
        >
          {failed[i] ? (
            <PlaceholderSlide />
          ) : (
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes={fullScreen ? "100vw" : "(max-width: 768px) 100vw, 28rem"}
              onError={() => handleError(i)}
            />
          )}
        </div>
      ))}
      <div className={`absolute left-0 right-0 z-10 flex justify-center gap-1.5 ${fullScreen ? "bottom-6" : "bottom-2"}`}>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-[var(--muted)]/60"
            }`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
