"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// Royalty-free images from Unsplash (university classrooms + calendars)
const HERO_IMAGE_SOURCES = [
  { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80", alt: "University lecture hall" },
  { src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80", alt: "University classroom" },
  { src: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80", alt: "University campus" },
  { src: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=80", alt: "Calendar and planner" },
  { src: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80", alt: "Desk calendar and notes" },
  { src: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80", alt: "Calendar and schedule" },
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

export function HeroImageCarousel() {
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

  if (allFailed) {
    return (
      <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg)] shadow-soft">
        <PlaceholderSlide />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg)] shadow-soft">
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
              sizes="(max-width: 768px) 100vw, 28rem"
              onError={() => handleError(i)}
            />
          )}
        </div>
      ))}
      <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
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
