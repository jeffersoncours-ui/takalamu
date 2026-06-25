"use client";
import { useState, useEffect } from "react";

const DEFAULTS = {
  bg: "#F7F4EE",
  title: "#1C1A17",
  accent: "#0F9D6E",
  size: 34,
};

export function ColorTweaker() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--site-bg", v.bg);
    r.style.setProperty("--site-title", v.title);
    r.style.setProperty("--site-accent", v.accent);
    r.style.setProperty("--site-h2-size", `${v.size}px`);
    r.style.setProperty("--site-h1-size", `${v.size + 14}px`);
  }, [v]);

  const set = (key: keyof typeof DEFAULTS, val: string | number) =>
    setV((prev) => ({ ...prev, [key]: val }));

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {open && (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #E9E3D8",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 10,
            boxShadow: "0 8px 28px rgba(0,0,0,.14)",
            width: 210,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 800,
              fontSize: 13,
              color: "#1C1A17",
              marginBottom: 14,
            }}
          >
            Couleurs &amp; tailles
          </p>

          {(
            [
              { key: "bg", label: "Fond" },
              { key: "title", label: "Texte" },
              { key: "accent", label: "Accent" },
            ] as { key: "bg" | "title" | "accent"; label: string }[]
          ).map(({ key, label }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <label style={{ fontSize: 13, color: "#4A463F" }}>{label}</label>
              <input
                type="color"
                value={v[key]}
                onChange={(e) => set(key, e.target.value)}
                style={{
                  width: 34,
                  height: 26,
                  border: "1px solid #E9E3D8",
                  borderRadius: 5,
                  cursor: "pointer",
                  padding: 2,
                  background: "none",
                }}
              />
            </div>
          ))}

          {/* Taille titres */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <label style={{ fontSize: 13, color: "#4A463F" }}>Titres</label>
              <span style={{ fontSize: 12, color: "#8B857A" }}>{v.size}px</span>
            </div>
            <input
              type="range"
              min={20}
              max={60}
              value={v.size}
              onChange={(e) => set("size", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#0F9D6E" }}
            />
          </div>

          <button
            onClick={() => setV(DEFAULTS)}
            style={{
              width: "100%",
              padding: "6px 0",
              borderRadius: 8,
              border: "1px solid #E9E3D8",
              background: "#F7F4EE",
              fontSize: 12,
              color: "#4A463F",
              cursor: "pointer",
            }}
          >
            Réinitialiser
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Tweaker couleurs"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#0F9D6E",
          border: "none",
          cursor: "pointer",
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(15,157,110,.38)",
          marginLeft: "auto",
        }}
      >
        🎨
      </button>
    </div>
  );
}
