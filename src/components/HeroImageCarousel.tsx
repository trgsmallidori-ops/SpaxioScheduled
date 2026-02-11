"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const HERO_IMAGES = [
  "/home/hero-1.png",
  "/home/hero-2.png",
  "/home/hero-3.png",
  "/home/hero-4.png",
];

const SHUFFLE_INTERVAL_MS = 4000;

export function HeroImageCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, SHUFFLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg)] shadow-soft">
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 28rem"
            unoptimized
          />
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
