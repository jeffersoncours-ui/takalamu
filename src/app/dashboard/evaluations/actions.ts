"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { conjugate, parseVerbForms, type Tense } from "@/lib/conjugation";

// ── Quiz de langue auto-généré (vocabulaire + formulation fusionnés) ─────────
// Génération : on appelle les deux RPC éprouvées (generate_individual_quiz,
// generate_formulation_quiz) — distracteurs par type, jamais mélangés — puis on
// concatène et on mélange les questions côté serveur. Chaque question porte sa
// `source` pour que la correction sache l'aiguiller. Correction : une seule RPC
// (submit_language_quiz) → un seul score, une seule tentative.

export type QuizDirection = "fr_to_ar" | "ar_to_fr" | "fr_to_ar_audio";
export type QuizSource = "vocab" | "formulation";

export type QuizQuestion = {
  source: QuizSource;
  item_id: string;
  direction: QuizDirection;
  prompt: string;
  choices: string[];
  /** Question de compréhension orale (formulation AR→FR) : URL signée courte
   *  de la voix du prof — le texte arabe n'est jamais transmis au client. */
  audio_url?: string;
  /** Mode « FR → écoute des 4 audios » (formulation) : question en texte français,
   *  réponses en audio arabe. `token` = id opaque de la formulation choisie. */
  audio_choices?: { token: string; audio_url: string }[];
};

export type QuizAnswer = {
  source: QuizSource;
  item_id: string;
  direction: QuizDirection;
  chosen: string;
  /** Renvoyé uniquement pour `fr_to_ar_audio` : le prompt français round-trip,
   *  le serveur score par correspondance FR (pas d'id-source échangé). */
  prompt?: string;
};

export type AnswerDetail = {
  direction: string;
  chosen: string;
  correct: string;
  is_correct: boolean;
};

export type QuizResult = {
  score: number;
  total: number;
  quiz_attempt_id: string;
  answers: AnswerDetail[];
};

type RawVocabQuestion = { vocab_id: string; direction: "fr_to_ar" | "ar_to_fr"; prompt: string; choices: string[] };
type RawFormQuestion = {
  form_id?: string;
  direction: QuizDirection;
  prompt?: string;
  audio_path?: string;
  choices?: string[];
  audio_choices?: { id: string; audio_path: string }[];
};

/** Mélange Fisher-Yates (copie) — quiz mixte dans un ordre imprévisible. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function generateLanguageQuiz(size: number): Promise<QuizQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  // Chaque RPC est demandée à hauteur de `size` — chacune se plafonne déjà
  // naturellement à son propre pool (LIMIT SQL, aucune erreur si trop demandé).
  // Combiner puis tronquer à `size` après mélange donne une répartition
  // proportionnelle au contenu réel (vocab vs formulations) sans sur-représenter
  // un côté pauvre en contenu.
  const [vocabRes, formRes] = await Promise.all([
    supabase.rpc("generate_individual_quiz", {
      p_student_id: studentId,
      p_size: size,
    }),
    supabase.rpc("generate_formulation_quiz", {
      p_student_id: studentId,
      // Opt-in explicite au mode audio-choix (base partagée preview/prod).
      p_allow_audio_choices: true,
      p_size: size,
    }),
  ]);

  if (vocabRes.error) throw new Error(vocabRes.error.message);
  if (formRes.error) throw new Error(formRes.error.message);

  // ── Vocabulaire (texte pur, aucun audio) ──────────────────────────────────
  const vocabQuestions: QuizQuestion[] = ((vocabRes.data as RawVocabQuestion[]) ?? []).map((q) => ({
    source: "vocab" as const,
    item_id: q.vocab_id,
    direction: q.direction,
    prompt: q.prompt,
    choices: q.choices,
  }));

  // ── Formulation : URLs signées courtes pour tous les audios ───────────────
  const rawForms = (formRes.data as RawFormQuestion[]) ?? [];
  const audioPaths = new Set<string>();
  for (const q of rawForms) {
    if (q.audio_path) audioPaths.add(q.audio_path);
    for (const c of q.audio_choices ?? []) audioPaths.add(c.audio_path);
  }
  const urlByPath = new Map<string, string>();
  if (audioPaths.size > 0) {
    const { data: signed } = await supabase.storage
      .from("formulation-audio")
      .createSignedUrls([...audioPaths], 3600);
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
    }
  }

  const formQuestions: QuizQuestion[] = [];
  for (const q of rawForms) {
    if (q.direction === "fr_to_ar_audio") {
      const choices = (q.audio_choices ?? []).map((c) => ({
        token: c.id,
        audio_url: urlByPath.get(c.audio_path),
      }));
      if (choices.length < 4 || choices.some((c) => !c.audio_url)) continue;
      formQuestions.push({
        source: "formulation",
        item_id: "", // scoring via prompt round-trip
        direction: "fr_to_ar_audio",
        prompt: q.prompt ?? "",
        choices: [],
        audio_choices: choices as { token: string; audio_url: string }[],
      });
      continue;
    }

    const audioUrl = q.audio_path ? urlByPath.get(q.audio_path) : undefined;
    if (q.direction === "ar_to_fr" && !audioUrl) continue;
    formQuestions.push({
      source: "formulation",
      item_id: q.form_id ?? "",
      direction: q.direction,
      prompt: q.prompt ?? "",
      choices: q.choices ?? [],
      ...(audioUrl ? { audio_url: audioUrl } : {}),
    });
  }

  return shuffle([...vocabQuestions, ...formQuestions]).slice(0, size);
}

// ── Quiz de conjugaison (verbe → formes, ou forme → personne) ────────────────
export type ConjQuestion =
  | {
      qtype: "conjugate";
      vocab_id: string;
      tense: string;
      person_code: string;
      verb_ar: string;
      verb_fr: string;
      choices: string[];
    }
  | {
      qtype: "which_person";
      vocab_id: string;
      tense: string;
      shown_form: string;
      choices: string[]; // person_codes
    };

export type ConjAnswer =
  | { qtype: "conjugate"; vocab_id: string; tense: string; person_code: string; chosen: string }
  | { qtype: "which_person"; vocab_id: string; tense: string; shown_form: string; chosen: string };

export type ConjAnswerDetail =
  | {
      qtype: "conjugate";
      tense: string;
      person_code: string;
      verb_ar: string;
      verb_fr: string;
      chosen: string;
      correct: string;
      is_correct: boolean;
    }
  | {
      qtype: "which_person";
      tense: string;
      shown_form: string;
      chosen: string;
      chosen_form: string | null;
      correct_person: string | null;
      is_correct: boolean;
    };

export type ConjResult = {
  score: number;
  total: number;
  quiz_attempt_id: string;
  answers: ConjAnswerDetail[];
};

/**
 * Auto-génère et persiste les conjugaisons manquantes de l'élève à partir de son
 * vocabulaire : chaque mot « passé/présent » détecté comme verbe est conjugué par
 * le moteur (src/lib/conjugation) puis inséré (sans écraser une saisie prof, via
 * la RPC ensure_conjugations). Idempotent — appelé à l'ouverture des Évaluations.
 */
export async function ensureConjugations(): Promise<void> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();
  const { data: vocab } = await supabase
    .from("vocabulary")
    .select("id, arabic_word")
    .eq("student_id", studentId);
  if (!vocab || vocab.length === 0) return;

  const rows: { vocab_id: string; tense: string; forms: Record<string, string> }[] = [];
  for (const v of vocab) {
    const parsed = parseVerbForms(v.arabic_word);
    if (!parsed) continue;
    try {
      const c = conjugate(parsed.madi, parsed.mudari);
      rows.push({ vocab_id: v.id, tense: "madi", forms: c.madi });
      rows.push({ vocab_id: v.id, tense: "mudari", forms: c.mudari });
      rows.push({ vocab_id: v.id, tense: "amr", forms: c.amr as Record<string, string> });
    } catch {
      // verbe non conjugable par le moteur → ignoré (l'enseignant peut le saisir).
    }
  }
  if (rows.length === 0) return;
  await supabase.rpc("ensure_conjugations", { p_student_id: studentId, p_rows: rows });
}

/** Mélange Fisher-Yates générique (copie). */
function shuffleAny<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * `tenses` = un seul temps, ou plusieurs pour un "mix". La RPC n'a qu'un
 * paramètre `p_tense` (un seul temps ou null = TOUS les temps existants côté
 * DB, ce qui inclurait des temps non enseignés) — donc pour un mix de temps
 * précis on appelle la RPC une fois par temps (taille répartie) et on combine
 * côté client, comme `generateLanguageQuiz` pour vocab+formulation.
 */
export async function generateConjugationQuiz(tenses: string[], size: number): Promise<ConjQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  if (tenses.length <= 1) {
    const { data, error } = await supabase.rpc("generate_conjugation_quiz", {
      p_student_id: studentId,
      p_size: size,
      ...(tenses[0] ? { p_tense: tenses[0] } : {}),
    });
    if (error) throw new Error(error.message);
    return (data as ConjQuestion[]) ?? [];
  }

  const perTense = Math.ceil(size / tenses.length);
  const results = await Promise.all(
    tenses.map((t) =>
      supabase.rpc("generate_conjugation_quiz", { p_student_id: studentId, p_tense: t, p_size: perTense }),
    ),
  );
  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
  }
  const combined = results.flatMap((r) => (r.data as ConjQuestion[]) ?? []);
  return shuffleAny(combined).slice(0, size);
}

const TENSE_KEYWORDS: Record<Tense, RegExp> = {
  // Mots-clés AR (sans harakat, après normalisation) + FR — robustes à la
  // formulation exacte du titre saisi par le prof.
  madi: /الماضي|passé/i,
  mudari: /المضارع|présent/i,
  // "الأمر" (avec alif-lam) évite un faux positif sur "أمريكا" (Amérique).
  amr: /الأمر|impératif/i,
};

/** Retire les harakat (voyelles brèves, sukun, shadda) pour un matching fiable
 *  quelle que soit la vocalisation exacte du titre saisi par le prof. */
function stripHarakat(s: string): string {
  return s.replace(/[ً-ْٰ]/g, "");
}

/**
 * Détecte les temps de conjugaison "débloqués" pour l'élève courant à partir
 * de ses `grammar_rules` déjà saisies par l'enseignant (titre contenant le mot-
 * clé du temps, ex. « الفِعْلُ المَاضِي = le verbe au passé »). Pas de champ à
 * ajouter côté fiche élève : le signal existe déjà dans les données réelles.
 */
export async function getUnlockedTenses(): Promise<Tense[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();
  const { data } = await supabase
    .from("grammar_rules")
    .select("title")
    .eq("student_id", studentId);

  const titles = (data ?? []).map((r) => stripHarakat(r.title ?? ""));
  const order: Tense[] = ["madi", "mudari", "amr"];
  return order.filter((t) => titles.some((title) => TENSE_KEYWORDS[t].test(title)));
}

export async function submitConjugationQuiz(answers: ConjAnswer[]): Promise<ConjResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_conjugation_quiz", {
    p_student_id: studentId,
    p_answers: answers,
  });
  if (error) throw new Error(error.message);
  return data as ConjResult;
}

export async function submitLanguageQuiz(answers: QuizAnswer[]): Promise<QuizResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const payload = answers.map((a) => {
    if (a.source === "vocab") {
      return { vocab_id: a.item_id, direction: a.direction, chosen: a.chosen };
    }
    if (a.direction === "fr_to_ar_audio") {
      return { direction: a.direction, chosen: a.chosen, prompt: a.prompt ?? "" };
    }
    return { form_id: a.item_id, direction: a.direction, chosen: a.chosen };
  });

  const { data, error } = await supabase.rpc("submit_language_quiz", {
    p_student_id: studentId,
    p_answers: payload,
  });

  if (error) throw new Error(error.message);
  return data as QuizResult;
}
