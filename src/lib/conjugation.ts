// Logique de conjugaison arabe (verbe régulier / sain — الفعل الصحيح السالم).
//
// Objectif : pré-remplir mécaniquement les tables de conjugaison des trois temps
// (passé الماضي، présent المضارع، impératif الأمر) pour un verbe SAIN, afin que
// l'enseignant n'ait plus qu'à relire et corriger les cas particuliers (verbes
// faibles, hamza, doublés). Les harakat sont TOUJOURS complètes.
//
// Contrainte linguistique clé : le présent n'est PAS déductible du passé (la
// voyelle médiane varie selon le verbe : كَتَبَ→يَكْتُبُ mais جَلَسَ→يَجْلِسُ). Le
// présent est donc saisi par l'enseignant sous sa forme هو (3ᵉ pers. masc. sing.),
// d'où se déduisent mécaniquement les 13 formes du présent ET les 5 de l'impératif.
//
// Toutes les fonctions sont DÉFENSIVES : sur une entrée inattendue (verbe non
// sain, saisie non vocalisée), elles renvoient au mieux une forme plausible sans
// jamais planter — l'enseignant corrige ensuite à la main.

// ── Harakat (voyelles brèves + sukun + shadda) ──────────────────────────────
export const FATHA = "َ"; // َ
export const KASRA = "ِ"; // ِ
export const DAMMA = "ُ"; // ُ
export const SUKUN = "ْ"; // ْ
export const SHADDA = "ّ"; // ّ
export const ALIF = "ا"; // ا
export const WAW = "و"; // و
export const YA = "ي"; // ي
export const NUN = "ن"; // ن
export const TA = "ت"; // ت
export const MIM = "م"; // م
export const ALIF_WASLA = "ٱ"; // ٱ (non utilisé — on garde alif simple + kasra/damma)

const HARAKAT = new Set([FATHA, KASRA, DAMMA, SUKUN, SHADDA]);
const isHaraka = (ch: string) => HARAKAT.has(ch);

export type Tense = "madi" | "mudari" | "amr";

export const TENSES: { id: Tense; ar: string; fr: string }[] = [
  { id: "madi", ar: "الماضي", fr: "Passé" },
  { id: "mudari", ar: "المضارع", fr: "Présent" },
  { id: "amr", ar: "الأمر", fr: "Impératif" },
];

// ── Les 13 personnes (أنتما commun masc/fém, comme confirmé par le propriétaire) ─
// `code` = clé stable stockée en base ; `pron` = pronom vocalisé ; `fr` = libellé.
export type PersonCode =
  | "ana" | "anta" | "anti" | "antuma" | "antum" | "antunna"
  | "huwa" | "hiya" | "huma_m" | "huma_f" | "hum" | "hunna" | "nahnu";

export type Person = { code: PersonCode; pron: string; fr: string };

export const PERSONS: Person[] = [
  { code: "ana", pron: "أَنَا", fr: "je" },                       // أَنَا
  { code: "anta", pron: "أَنْتَ", fr: "tu (masc.)" },         // أَنْتَ
  { code: "anti", pron: "أَنْتِ", fr: "tu (fém.)" },          // أَنْتِ
  { code: "antuma", pron: "أَنْتُمَا", fr: "vous deux" }, // أَنْتُمَا
  { code: "antum", pron: "أَنْتُمْ", fr: "vous (masc. plur.)" }, // أَنْتُمْ
  { code: "antunna", pron: "أَنْتُنَّ", fr: "vous (fém. plur.)" }, // أَنْتُنَّ
  { code: "huwa", pron: "هُوَ", fr: "il" },                              // هُوَ
  { code: "hiya", pron: "هِيَ", fr: "elle" },                            // هِيَ
  { code: "huma_m", pron: "هُمَا", fr: "eux deux (masc.)" },        // هُمَا
  { code: "huma_f", pron: "هُمَا", fr: "elles deux (fém.)" },       // هُمَا
  { code: "hum", pron: "هُمْ", fr: "ils" },                              // هُمْ
  { code: "hunna", pron: "هُنَّ", fr: "elles" },                    // هُنَّ
  { code: "nahnu", pron: "نَحْنُ", fr: "nous" },               // نَحْنُ
];

// L'impératif ne se conjugue qu'aux 2ᵉ personnes (5 formes).
export const AMR_PERSONS: PersonCode[] = ["anta", "anti", "antuma", "antum", "antunna"];

export const personByCode = (code: PersonCode): Person =>
  PERSONS.find((p) => p.code === code) ?? PERSONS[0];

export const personsForTense = (tense: Tense): Person[] =>
  tense === "amr" ? PERSONS.filter((p) => AMR_PERSONS.includes(p.code)) : PERSONS;

// ── Décomposition d'une forme vocalisée en unités {lettre + harakat} ─────────
type Unit = { base: string; marks: string };

function toUnits(word: string): Unit[] {
  const units: Unit[] = [];
  for (const ch of word) {
    if (isHaraka(ch)) {
      if (units.length > 0) units[units.length - 1].marks += ch;
    } else {
      units.push({ base: ch, marks: "" });
    }
  }
  return units;
}

const render = (units: Unit[]): string =>
  units.map((u) => u.base + u.marks).join("");

// Extrait les 3 lettres-racine d'un passé هو trilitère sain (ex. كَتَبَ → ك ت ب).
// Ignore les harakat ; ne garde que les consonnes. Défensif : renvoie ce qu'il
// trouve même si ce n'est pas exactement 3 lettres.
export function extractRoot(madiHuwa: string): string[] {
  return toUnits(madiHuwa).map((u) => u.base);
}

// ════════════════════════════════════════════════════════════════════════════
// PASSÉ — الماضي
// À partir de la forme هو (فَعَلَ), suffixes fixes. Radical sain = 3 consonnes,
// voyelles fa-ʿa-la : 1ʳᵉ radicale fatha, 2ᵉ radicale = sa voyelle propre (telle
// que saisie dans la forme هو), 3ᵉ radicale reçoit le suffixe.
// ════════════════════════════════════════════════════════════════════════════
export function prefillMadi(madiHuwa: string): Record<PersonCode, string> {
  const u = toUnits(madiHuwa);
  // On attend 3 unités (فعل). Si ce n'est pas le cas, on renvoie la forme brute
  // partout (l'enseignant corrigera) plutôt que de produire du faux.
  if (u.length !== 3) {
    return Object.fromEntries(PERSONS.map((p) => [p.code, madiHuwa])) as Record<PersonCode, string>;
  }
  const [r1, r2, r3] = u; // r3 porte la voyelle finale de هو (fatha)
  // Radical « nu » jusqu'à la 3ᵉ radicale incluse, sans la voyelle finale.
  const stemBase = r1.base + FATHA + r2.base + r2.marks + r3.base;

  // Suffixes du passé (sur la 3ᵉ radicale) :
  const build = (thirdMark: string, suffix: string) =>
    r1.base + FATHA + r2.base + r2.marks + r3.base + thirdMark + suffix;

  return {
    // 3ᵉ radicale sukun + terminaison consonantique
    ana: build(SUKUN, TA + DAMMA), //  ـْتُ
    anta: build(SUKUN, TA + FATHA), //  ـْتَ
    anti: build(SUKUN, TA + KASRA), //  ـْتِ
    antuma: build(SUKUN, TA + DAMMA + MIM + FATHA + ALIF), // ـْتُمَا
    antum: build(SUKUN, TA + DAMMA + MIM + SUKUN), // ـْتُمْ
    antunna: build(SUKUN, TA + DAMMA + NUN + SHADDA + FATHA), // ـْتُنَّ
    // 3ᵉ personnes : 3ᵉ radicale garde fatha
    huwa: stemBase + FATHA, // فَعَلَ
    hiya: r1.base + FATHA + r2.base + r2.marks + r3.base + FATHA + TA + SUKUN, // ـَتْ
    huma_m: stemBase + FATHA + ALIF, // ـَا
    huma_f: r1.base + FATHA + r2.base + r2.marks + r3.base + FATHA + TA + FATHA + ALIF, // ـَتَا
    hum: r1.base + FATHA + r2.base + r2.marks + r3.base + DAMMA + WAW + ALIF, // ـُوا
    hunna: build(SUKUN, NUN + FATHA), // ـْنَ
    nahnu: build(SUKUN, NUN + FATHA + ALIF), // ـْنَا
  };
}

// ════════════════════════════════════════════════════════════════════════════
// PRÉSENT — المضارع
// À partir de la forme هو (يَفْعُلُ / يَفْعِلُ / يَفْعَلُ). On lit le préfixe يَ, la 1ʳᵉ
// radicale (sukun), la 2ᵉ radicale + SA voyelle (damma/kasra/fatha selon le
// verbe — c'est justement l'info non déductible que l'enseignant fournit), la
// 3ᵉ radicale + terminaison. On remplace préfixe et terminaisons par personne.
// ════════════════════════════════════════════════════════════════════════════
export function prefillMudari(mudariHuwa: string): Record<PersonCode, string> {
  const u = toUnits(mudariHuwa);
  // Attendu : يَ + ف(ْ) + ع(voyelle) + ل(ُ) = 4 unités (préfixe + 3 radicales).
  if (u.length !== 4) {
    return Object.fromEntries(PERSONS.map((p) => [p.code, mudariHuwa])) as Record<PersonCode, string>;
  }
  const [, f, a, l] = u; // f=1ʳᵉ radicale, a=2ᵉ (+voyelle propre), l=3ᵉ radicale
  const midVowel = a.marks.replace(SUKUN, "") || FATHA; // voyelle médiane saisie
  // Corps commun « radical présent » sans préfixe ni terminaison :
  // ف(ْ) ع(voyelle) ل
  const stem = f.base + SUKUN + a.base + midVowel + l.base;

  const withPrefix = (prefix: string, ending: string) => prefix + stem + ending;

  return {
    ana: withPrefix(ALIF + FATHA, DAMMA), // أَ...ُ
    nahnu: withPrefix(NUN + FATHA, DAMMA), // نَ...ُ
    anta: withPrefix(TA + FATHA, DAMMA), // تَ...ُ
    anti: TA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + KASRA + YA + NUN + FATHA, // تَ...ِينَ
    antuma: TA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + FATHA + ALIF + NUN + KASRA, // تَ...َانِ
    antum: TA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + DAMMA + WAW + NUN + FATHA, // تَ...ُونَ
    antunna: TA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + SUKUN + NUN + FATHA, // تَ...ْنَ
    huwa: withPrefix(YA + FATHA, DAMMA), // يَ...ُ
    hiya: withPrefix(TA + FATHA, DAMMA), // تَ...ُ (identique à anta — ambiguïté gérée au quiz)
    huma_m: YA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + FATHA + ALIF + NUN + KASRA, // يَ...َانِ
    huma_f: TA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + FATHA + ALIF + NUN + KASRA, // تَ...َانِ (=antuma)
    hum: YA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + DAMMA + WAW + NUN + FATHA, // يَ...ُونَ
    hunna: YA + FATHA + f.base + SUKUN + a.base + midVowel + l.base + SUKUN + NUN + FATHA, // يَ...ْنَ
  };
}

// ════════════════════════════════════════════════════════════════════════════
// IMPÉRATIF — الأمر (2ᵉ personnes seulement)
// Dérivé du présent : on retire le préfixe تَ, on met la 1ʳᵉ radicale au sukun, et
// on ajoute une hamza de liaison initiale vocalisée selon la voyelle médiane du
// présent (damma → اُ, sinon اِ). Terminaisons = celles du مضارع مجزوم.
// ════════════════════════════════════════════════════════════════════════════
export function prefillAmr(mudariHuwa: string): Partial<Record<PersonCode, string>> {
  const u = toUnits(mudariHuwa);
  if (u.length !== 4) {
    return Object.fromEntries(AMR_PERSONS.map((c) => [c, ""])) as Partial<Record<PersonCode, string>>;
  }
  const [, f, a, l] = u;
  const midVowel = a.marks.replace(SUKUN, "") || FATHA;
  // Hamza de liaison : اُ si voyelle médiane damma, sinon اِ.
  const helper = ALIF + (midVowel === DAMMA ? DAMMA : KASRA);
  const stem = f.base + SUKUN + a.base + midVowel + l.base; // ف(ْ)ع(voyelle)ل

  return {
    anta: helper + f.base + SUKUN + a.base + midVowel + l.base + SUKUN, // اُفْعُلْ
    anti: helper + f.base + SUKUN + a.base + midVowel + l.base + KASRA + YA, // اُفْعُلِي
    antuma: helper + f.base + SUKUN + a.base + midVowel + l.base + FATHA + ALIF, // اُفْعُلَا
    antum: helper + f.base + SUKUN + a.base + midVowel + l.base + DAMMA + WAW + ALIF, // اُفْعُلُوا
    antunna: helper + f.base + SUKUN + a.base + midVowel + l.base + SUKUN + NUN + FATHA, // اُفْعُلْنَ
  };
}

// Point d'entrée générique pour le formulaire prof.
export function prefill(
  tense: Tense,
  baseForm: string,
): Record<string, string> {
  if (tense === "madi") return prefillMadi(baseForm);
  if (tense === "mudari") return prefillMudari(baseForm);
  return prefillAmr(baseForm) as Record<string, string>;
}
