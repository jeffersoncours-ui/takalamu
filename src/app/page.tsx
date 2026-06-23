import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center"
      style={{ background: "#F7F4EE" }}
    >
      <div className="flex flex-col items-center gap-5 max-w-xl">
        <span
          className="flex items-center justify-center rounded-[16px] text-white font-arabic"
          style={{ width: 56, height: 56, background: "#0F9D6E", fontSize: 30, boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
        >
          ت
        </span>
        <div className="space-y-3">
          <p
            className="font-bold uppercase"
            style={{ color: "#0F9D6E", fontSize: 12, letterSpacing: ".14em" }}
          >
            Takalamu
          </p>
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 34, color: "#1C1A17" }}
          >
            Cours d&apos;arabe &amp; étude de texte islamique
          </h1>
          <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.6 }}>
            Cours d&apos;arabe individuels en visio et étude de texte en groupe,
            avec un suivi pédagogique complet.
          </p>
        </div>
      </div>

      <Link
        href="/login"
        className="rounded-full font-bold text-white"
        style={{ background: "#0F9D6E", padding: "14px 28px", fontSize: 15, boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
      >
        Mon espace
      </Link>
    </main>
  );
}
