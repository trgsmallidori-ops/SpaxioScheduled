"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

const HERO_IMAGES = [
  "/home/hero-1.png",
  "/home/hero-2.png",
  "/home/hero-3.png",
  "/home/hero-4.png",
];

const ROTATE_INTERVAL_MS = 4000;

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
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % HERO_IMAGES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(goNext, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [goNext]);

  const handleError = (i: number) => {
    setFailed((prev) => ({ ...prev, [i]: true }));
  };

  const allFailed = HERO_IMAGES.length === Object.keys(failed).length;

  if (allFailed) {
    return (
      <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg)] shadow-soft">
        <PlaceholderSlide />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg)] shadow-soft">
      {HERO_IMAGES.map((src, i) => (
        <div
          key={`${src}-${i}`}
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
              src={src}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 28rem"
              unoptimized
              onError={() => handleError(i)}
            />
          )}
        </div>
      ))}
      <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
        {HERO_IMAGES.map((_, i) => (
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
