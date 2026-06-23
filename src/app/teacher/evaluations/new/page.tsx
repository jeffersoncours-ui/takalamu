import Link from "next/link";

import { requireTeacher } from "@/lib/auth";
import { createGrammarQuiz } from "../actions";

export default async function NewGrammarQuizPage() {
  await requireTeacher();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-0.5">
        <Link
          href="/teacher/evaluations"
          className="flex items-center justify-center rounded-[10px] transition-opacity hover:opacity-70"
          style={{ width: 36, height: 36, background: "#F7F4EE", border: "1px solid #EFEAE0" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "#1C1A17" }}
        >
          Nouveau quiz
        </h1>
      </div>

      <form
        action={createGrammarQuiz}
        className="rounded-[18px] p-5 space-y-4"
        style={{ background: "#fff", border: "1px solid #EFEAE0" }}
      >
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className="block font-semibold"
            style={{ color: "#1C1A17", fontSize: 13 }}
          >
            Titre du quiz
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="ex. Règles du pluriel — séance 3"
            className="w-full rounded-[12px] px-3.5 py-3 text-sm outline-none transition"
            style={{
              background: "#F7F4EE",
              border: "1px solid #EFEAE0",
              color: "#1C1A17",
            }}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85"
          style={{ background: "#0A553F" }}
        >
          Créer le quiz
        </button>
      </form>
    </div>
  );
}
