"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { uploadFilesToBucket } from "@/lib/upload-files";
import { compressImage } from "@/lib/compress-image";
import { createBook } from "./actions";

const GREEN = "#0F9D6E";
const RED = "#B4292E";

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
  border: "1.5px solid #E9E3D8",
  background: "#fff",
  padding: "10px 13px",
  fontSize: 14,
  color: "#1C1A17",
  outline: "none",
};

export function BookManager({ books }: { books: Book[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <p className="text-sm font-medium" style={{ color: RED }}>{error}</p>
      )}

      {/* Liste des livres */}
      <div className="flex flex-col gap-2.5">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/teacher/books/${b.id}`}
            className="flex items-center gap-3 rounded-[16px] p-3 transition-opacity hover:opacity-90"
            style={{ background: "#fff", border: "1px solid #EFEAE0" }}
          >
            {b.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.cover_url} alt="" className="shrink-0 rounded-[8px] object-cover" style={{ width: 46, height: 62 }} />
            ) : (
              <div className="shrink-0 rounded-[8px]" style={{ width: 46, height: 62, background: "#EFEAE0" }} />
            )}
            <div className="flex-1 min-w-0">
              <div dir="rtl" lang="ar" className="font-arabic font-bold truncate" style={{ fontSize: 16, color: "#1C1A17" }}>
                {b.title}
              </div>
              {b.subtitle && <div className="truncate" style={{ fontSize: 12, color: "#8B857A" }}>{b.subtitle}</div>}
              <div className="mt-0.5" style={{ fontSize: 11, color: "#8B857A" }}>
                {b.kind === "grammar" ? "Grammaire" : `${b.courseCount} cours`}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Ajouter un livre */}
      <div className="rounded-[16px] p-4 space-y-3" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 15 }}>Ajouter un livre</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (arabe)" dir="rtl" className="font-arabic" style={inputStyle} />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Libellé français (ex. Récits des prophètes)" style={inputStyle} />

        <div className="flex gap-2">
          {(["courses", "grammar"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className="flex-1 rounded-[11px] py-2 text-xs font-semibold transition-colors"
              style={kind === k ? { background: "#0A553F", color: "#fff" } : { background: "#F7F4EE", color: "#8B857A", border: "1px solid #EFEAE0" }}
            >
              {k === "courses" ? "Livre de cours" : "Livre de grammaire (auto)"}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 cursor-pointer" style={{ background: "#F7F4EE", border: "1px dashed #D8D2C6" }}>
          {coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="" className="rounded-[6px] object-cover" style={{ width: 34, height: 46 }} />
          ) : (
            <span style={{ fontSize: 20 }}>📕</span>
          )}
          <span className="text-sm" style={{ color: "#8B857A" }}>{coverPreview ? "Changer la couverture" : "Couverture (image)"}</span>
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
          className="w-full rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: GREEN }}
        >
          {busy ? "Ajout…" : "Ajouter le livre"}
        </button>
      </div>
    </div>
  );
}
