"use client";
import { useState } from "react";

const TESTIMONIALS = [
  {
    stars: 5,
    quote: "[Citation réelle à venir : une phrase sur le résultat obtenu]",
    name: "Prénom A.",
    detail: "Débutant complet",
  },
  {
    stars: 5,
    quote: "[Citation réelle à venir : une phrase sur le résultat obtenu]",
    name: "Prénom B.",
    detail: "Lit le Coran depuis 6 mois",
  },
  {
    stars: 5,
    quote: "[Citation réelle à venir : une phrase sur le résultat obtenu]",
    name: "Prénom C.",
    detail: "Reprise après une longue pause",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <span style={{ color: "#0F9D6E", fontSize: 19, letterSpacing: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < count ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function TestimonialsStack() {
  const [current, setCurrent] = useState(0);
  const n = TESTIMONIALS.length;

  const prev = () => setCurrent((c) => (c - 1 + n) % n);
  const next = () => setCurrent((c) => (c + 1) % n);

  // Swipe support
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx < -40) next();
    else if (dx > 40) prev();
    setTouchX(null);
  };

  return (
    <div>
      <div
        style={{ position: "relative", height: 230, margin: "0 auto", maxWidth: 400 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {TESTIMONIALS.map((t, i) => {
          const offset = (i - current + n) % n;
          if (offset > 2) return null;
          const zIndex = 3 - offset;
          const tx = offset * 14;
          const ty = offset * 10;
          const scale = 1 - offset * 0.045;
          const opacity = offset === 2 ? 0.45 : offset === 1 ? 0.72 : 1;

          return (
            <div
              key={i}
              onClick={offset === 0 ? next : undefined}
              style={{
                position: "absolute",
                inset: 0,
                zIndex,
                transform: `translateX(${tx}px) translateY(${ty}px) scale(${scale})`,
                transformOrigin: "bottom left",
                opacity,
                transition: "transform 0.3s ease, opacity 0.3s ease",
                cursor: offset === 0 ? "pointer" : "default",
                background: "#fff",
                borderRadius: 20,
                border: "1.5px solid #E9E3D8",
                boxShadow: "0 6px 24px rgba(28,26,23,.09)",
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Stars count={t.stars} />
                <p
                  style={{
                    color: "#1C1A17",
                    fontSize: 14.5,
                    lineHeight: 1.65,
                    marginTop: 12,
                    fontStyle: "italic",
                    fontFamily: "var(--font-outfit)",
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <p style={{ color: "#8B857A", fontSize: 13, marginTop: 12 }}>
                — {t.name},{" "}
                <span style={{ fontStyle: "italic" }}>{t.detail}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 28,
        }}
      >
        <button
          onClick={prev}
          aria-label="Précédent"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1.5px solid #D8D1C4",
            background: "#fff",
            cursor: "pointer",
            fontSize: 18,
            color: "#4A463F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Témoignage ${i + 1}`}
            style={{
              width: i === current ? 22 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? "#0F9D6E" : "#D8D1C4",
              border: "none",
              cursor: "pointer",
              transition: "all 0.25s ease",
              padding: 0,
            }}
          />
        ))}
        <button
          onClick={next}
          aria-label="Suivant"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1.5px solid #D8D1C4",
            background: "#fff",
            cursor: "pointer",
            fontSize: 18,
            color: "#4A463F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ›
        </button>
      </div>

      <p style={{ textAlign: "center", color: "#B0A99E", fontSize: 12, marginTop: 8 }}>
        Glisse ou clique pour naviguer
      </p>
    </div>
  );
}
