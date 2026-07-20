"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { uploadFilesToBucket } from "@/lib/upload-files";
import { compressImage } from "@/lib/compress-image";
import { KhatamOrnament } from "@/components/khatam-ornament";
import { createBook } from "./actions";

type Book = {
  id: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  kind: string;
  courseCount: number;
};

async function uploadCover(file: File): Promise<string> {
  const compressed = await compressImage(file, { maxDim: 1000, quality: 0.82 });
  const [uploaded] = await uploadFilesToBucket("book-covers", "covers", [compressed]);
  const supabase = createClient();
  return supabase.storage.from("book-covers").getPublicUrl(uploaded.path).data.publicUrl;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1.5px solid var(--tk-parchment-border)",
  background: "var(--tk-parchment-field)",
  padding: "10px 13px",
  fontSize: 14,
  color: "var(--tk-ink-text)",
  outline: "none",
};

export function BookManager({ books }: { books: Book[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Ajout
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [kind, setKind] = useState<"courses" | "grammar">("courses");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const submitAdd = async () => {
    setError(null);
    setBusy(true);
    try {
      let coverUrl = "";
      const file = coverRef.current?.files?.[0];
      if (file) coverUrl = await uploadCover(file);
      const res = await createBook({ title, subtitle, kind, coverUrl });
      if (res.error) {
        setError(res.error);
        return;
      }
      setTitle("");
      setSubtitle("");
      setKind("courses");
      setCoverPreview(null);
      if (coverRef.current) coverRef.current.value = "";
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Échec de l'envoi de la couverture.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--tk-danger)" }}>{error}</p>
      )}

      {/* Grille des livres */}
      <div className="grid grid-cols-2 gap-3">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/teacher/books/${b.id}`}
            className="group block transition-opacity hover:opacity-90"
          >
            {b.kind === "grammar" ? (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-[14px]"
                style={{
                  aspectRatio: "3/4",
                  background: "linear-gradient(160deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
                  border: "1px solid rgba(199,154,62,.35)",
                }}
              >
                <KhatamOrnament size={40} color="var(--tk-gold-light)" />
              </div>
            ) : b.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.cover_url}
                alt=""
                className="w-full rounded-[14px] object-cover"
                style={{ aspectRatio: "3/4", border: "1px solid rgba(199,154,62,.45)" }}
              />
            ) : (
              <div
                className="rounded-[14px]"
                style={{ aspectRatio: "3/4", background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)" }}
              />
            )}
            <div dir="rtl" lang="ar" className="font-arabic font-bold truncate mt-2" style={{ fontSize: 15, color: "var(--tk-ink-text)" }}>
              {b.title}
            </div>
            <div className="mt-0.5" style={{ fontSize: 11.5, color: "var(--tk-muted-olive)" }}>
              {b.kind === "grammar"
                ? `auto · ${b.courseCount} règle${b.courseCount > 1 ? "s" : ""}`
                : `${b.courseCount} cours`}
            </div>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex flex-col items-center justify-center gap-2 rounded-[14px]"
          style={{
            aspectRatio: "3/4",
            border: "1.5px dashed rgba(199,154,62,.5)",
            background: "rgba(199,154,62,.06)",
            color: "var(--tk-gold-dark)",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-dark)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="font-semibold" style={{ fontSize: 12.5 }}>Ajouter</span>
        </button>
      </div>

      {/* Ajouter un livre */}
      {showForm && (
        <div className="rounded-[16px] p-4 space-y-3" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
          <p className="font-semibold" style={{ color: "var(--tk-ink-text)", fontSize: 15 }}>Ajouter un livre</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (arabe)" dir="rtl" className="font-arabic" style={inputStyle} />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Libellé français (ex. Récits des prophètes)" style={inputStyle} />

          <div className="flex gap-2">
            {(["courses", "grammar"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="flex-1 rounded-[11px] py-2 text-xs font-semibold transition-colors"
                style={
                  kind === k
                    ? { background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))", color: "var(--tk-cream-text)" }
                    : { background: "var(--tk-parchment-field)", color: "var(--tk-muted-olive)", border: "1px solid var(--tk-parchment-border)" }
                }
              >
                {k === "courses" ? "Livre de cours" : "Livre de grammaire (auto)"}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 cursor-pointer" style={{ background: "var(--tk-parchment-field)", border: "1px dashed var(--tk-parchment-border-alt)" }}>
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="" className="rounded-[6px] object-cover" style={{ width: 34, height: 46 }} />
            ) : (
              <span style={{ fontSize: 20 }}>📕</span>
            )}
            <span className="text-sm" style={{ color: "var(--tk-muted-olive)" }}>{coverPreview ? "Changer la couverture" : "Couverture (image)"}</span>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setCoverPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>

          <button
            type="button"
            onClick={submitAdd}
            disabled={busy || !title.trim()}
            className="w-full rounded-[12px] py-3 font-bold text-sm disabled:opacity-50"
            style={{
              background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
              color: "var(--tk-ink-screen)",
              boxShadow: "var(--tk-shadow-cta)",
            }}
          >
            {busy ? "Ajout…" : "Ajouter le livre"}
          </button>
        </div>
      )}
    </div>
  );
}
