// Moteur de conjugaison arabe — الماضي / المضارع / الأمر, 13 personnes.
//
// Entrées : les DEUX formes هو fournies par l'enseignant dans le vocabulaire
// (passé `f1` + présent `f2`, séparées par « / »). On dérive les radicaux et le
// schéma directement de ces formes plutôt que de supposer un verbe sain — ce qui
// permet de couvrir, en plus des sains : les formes dérivées (II–X), les
// assimilés, les hamzés (mécaniques), et via des branches dédiées les verbes
// redoublés, creux et défectueux. Harakat toujours complètes.
//
// Chaque famille est validée visuellement contre des tables de référence
// (voir scripts de test) avant toute mise en service.

// ── Harakat & lettres ───────────────────────────────────────────────────────
export const FATHA = "َ";
export const KASRA = "ِ";
export const DAMMA = "ُ";
export const SUKUN = "ْ";
export const SHADDA = "ّ";
export const ALIF = "ا"; // ا (hamzat al-waṣl de l'impératif : alif nu)
export const ALIF_HAMZA = "أ"; // أ (hamzat al-qaṭʿ : préfixe أنا du présent)
export const WAW = "و"; // و
export const YA = "ي"; // ي
export const ALIF_MAQSURA = "ى"; // ى
export const NUN = "ن"; // ن
export const TA = "ت"; // ت
export const MIM = "م"; // م

const HARAKAT = new Set([FATHA, KASRA, DAMMA, SUKUN, SHADDA]);
const isHaraka = (ch: string) => HARAKAT.has(ch);
const WEAK = new Set([ALIF, WAW, YA, ALIF_MAQSURA]);

export type Tense = "madi" | "mudari" | "amr";

export const TENSES: { id: Tense; ar: string; fr: string }[] = [
  { id: "madi", ar: "الماضي", fr: "Passé" },
  { id: "mudari", ar: "المضارع", fr: "Présent" },
  { id: "amr", ar: "الأمر", fr: "Impératif" },
];

// ── Les 13 personnes (أنتما commun masc/fém) ────────────────────────────────
export type PersonCode =
  | "ana" | "anta" | "anti" | "antuma" | "antum" | "antunna"
  | "huwa" | "hiya" | "huma_m" | "huma_f" | "hum" | "hunna" | "nahnu";

export type Person = { code: PersonCode; pron: string; fr: string };

export const PERSONS: Person[] = [
  { code: "ana", pron: "أَنَا", fr: "je" },
  { code: "anta", pron: "أَنْتَ", fr: "tu (masc.)" },
  { code: "anti", pron: "أَنْتِ", fr: "tu (fém.)" },
  { code: "antuma", pron: "أَنْتُمَا", fr: "vous deux" },
  { code: "antum", pron: "أَنْتُمْ", fr: "vous (masc. plur.)" },
  { code: "antunna", pron: "أَنْتُنَّ", fr: "vous (fém. plur.)" },
  { code: "huwa", pron: "هُوَ", fr: "il" },
  { code: "hiya", pron: "هِيَ", fr: "elle" },
  { code: "huma_m", pron: "هُمَا", fr: "eux deux (masc.)" },
  { code: "huma_f", pron: "هُمَا", fr: "elles deux (fém.)" },
  { code: "hum", pron: "هُمْ", fr: "ils" },
  { code: "hunna", pron: "هُنَّ", fr: "elles" },
  { code: "nahnu", pron: "نَحْنُ", fr: "nous" },
];

export const AMR_PERSONS: PersonCode[] = ["anta", "anti", "antuma", "antum", "antunna"];

export const personByCode = (code: PersonCode): Person =>
  PERSONS.find((p) => p.code === code) ?? PERSONS[0];

export const personsForTense = (tense: Tense): Person[] =>
  tense === "amr" ? PERSONS.filter((p) => AMR_PERSONS.includes(p.code)) : PERSONS;

// ── Décomposition en unités {lettre + harakat} ──────────────────────────────
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

const vowelOf = (u: Unit): string => u.marks.replace(SHADDA, "").replace(SUKUN, "") || "";

// ════════════════════════════════════════════════════════════════════════════
// Classification à partir des deux formes هو.
// ════════════════════════════════════════════════════════════════════════════
export type Family = "sound" | "doubled" | "hollow" | "defective";

export function classifyVerb(madiHuwa: string, _mudariHuwa?: string): Family {
  const mu = toUnits(madiHuwa);
  if (mu.length >= 2) {
    const last = mu[mu.length - 1];
    // Redoublé : shadda sur la dernière radicale (مَدَّ, ضَرَّ). Exclut la forme II
    // (shadda au milieu, pas en fin).
    if (last.marks.includes(SHADDA)) return "doubled";
    // Défectueux : dernière lettre faible (رَمَى, دَعَا, نَسِيَ, صَلَّى).
    if (WEAK.has(last.base)) return "defective";
  }
  // Creux : radicale médiane = alif long (قالَ, بَاعَ, كانَ).
  if (mu.length === 3 && mu[1].base === ALIF) return "hollow";
  return "sound";
}

// ── Assemblage : suffixes du passé (attachés à un radical sans voyelle finale) ─
// stem = forme هو sans sa voyelle finale ; la dernière radicale reçoit la marque.
function madiFromStem(huwa: string): Record<PersonCode, string> {
  const u = toUnits(huwa);
  const lastIdx = u.length - 1;
  const stemNoFinal = u.map((x, i) => (i === lastIdx ? x.base : x.base + x.marks)).join("");
  const withLast = (mark: string, suffix: string) => stemNoFinal + mark + suffix;
  return {
    ana: withLast(SUKUN, TA + DAMMA),
    anta: withLast(SUKUN, TA + FATHA),
    anti: withLast(SUKUN, TA + KASRA),
    antuma: withLast(SUKUN, TA + DAMMA + MIM + FATHA + ALIF),
    antum: withLast(SUKUN, TA + DAMMA + MIM + SUKUN),
    antunna: withLast(SUKUN, TA + DAMMA + NUN + SHADDA + FATHA),
    huwa,
    hiya: withLast(FATHA, TA + SUKUN),
    huma_m: withLast(FATHA, ALIF),
    huma_f: withLast(FATHA, TA + FATHA + ALIF),
    hum: withLast(DAMMA, WAW + ALIF),
    hunna: withLast(SUKUN, NUN + FATHA),
    nahnu: withLast(SUKUN, NUN + FATHA + ALIF),
  };
}

// ── Présent générique : préfixe (voyelle lue de f2) + radical + suffixe ──────
function mudariFromForm(mudariHuwa: string): { table: Record<PersonCode, string>; pstem: string; pv: string; helperNeeded: boolean; helperVowel: string } {
  const u = toUnits(mudariHuwa);
  const pv = vowelOf(u[0]) || FATHA;                 // voyelle du préfixe (fatha/damma)
  const stemUnits = u.slice(1);                       // sans le préfixe ي
  const lastIdx = stemUnits.length - 1;
  const pstem = stemUnits.map((x, i) => (i === lastIdx ? x.base : x.base + x.marks)).join(""); // sans voyelle finale
  const firstStem = stemUnits[0];
  const helperNeeded = firstStem?.marks.includes(SUKUN) ?? false; // forme I → besoin hamza de liaison
  const midVowel = stemUnits[1] ? vowelOf(stemUnits[1]) : FATHA;
  const helperVowel = midVowel === DAMMA ? DAMMA : KASRA;

  const pre = (consonant: string) => consonant + pv;
  const anaPre = ALIF_HAMZA + pv;

  const ind = (prefix: string) => prefix + pstem + DAMMA;                       // مرفوع
  const table: Record<PersonCode, string> = {
    ana: anaPre + pstem + DAMMA,
    nahnu: ind(pre(NUN)),
    anta: ind(pre(TA)),
    huwa: ind(pre(YA)),
    hiya: ind(pre(TA)),
    anti: pre(TA) + pstem + KASRA + YA + NUN + FATHA,
    antuma: pre(TA) + pstem + FATHA + ALIF + NUN + KASRA,
    huma_m: pre(YA) + pstem + FATHA + ALIF + NUN + KASRA,
    huma_f: pre(TA) + pstem + FATHA + ALIF + NUN + KASRA,
    antum: pre(TA) + pstem + DAMMA + WAW + NUN + FATHA,
    hum: pre(YA) + pstem + DAMMA + WAW + NUN + FATHA,
    antunna: pre(TA) + pstem + SUKUN + NUN + FATHA,
    hunna: pre(YA) + pstem + SUKUN + NUN + FATHA,
  };
  return { table, pstem, pv, helperNeeded, helperVowel };
}

function amrFromMudari(m: ReturnType<typeof mudariFromForm>): Partial<Record<PersonCode, string>> {
  const { pstem, helperNeeded, helperVowel } = m;
  const helper = helperNeeded ? ALIF + helperVowel : "";
  return {
    anta: helper + pstem + SUKUN,
    anti: helper + pstem + KASRA + YA,
    antuma: helper + pstem + FATHA + ALIF,
    antum: helper + pstem + DAMMA + WAW + ALIF,
    antunna: helper + pstem + SUKUN + NUN + FATHA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// REDOUBLÉ (مضاعف) — مَدَّ / يَمُدُّ
// Géminé sauf devant un suffixe consonantique (تُ, نَ…) où il se défait.
// ════════════════════════════════════════════════════════════════════════════
function doubledMadi(huwa: string): Record<PersonCode, string> {
  const u = toUnits(huwa);        // مَدَّ = م(fatha) د(shadda)
  const r1 = u[0];
  const r23 = u[u.length - 1];    // radicale redoublée
  const pre = u.slice(0, u.length - 1).map((x) => x.base + x.marks).join(""); // avant la gémination (inclut r1)
  const geminated = pre + r23.base + SHADDA;               // مَدّ
  const split = pre + r23.base + FATHA + r23.base;          // مَدَد (défait, avant sukun+suffixe)
  void r1;
  return {
    // suffixes consonantiques → défait
    ana: split + SUKUN + TA + DAMMA,
    anta: split + SUKUN + TA + FATHA,
    anti: split + SUKUN + TA + KASRA,
    antuma: split + SUKUN + TA + DAMMA + MIM + FATHA + ALIF,
    antum: split + SUKUN + TA + DAMMA + MIM + SUKUN,
    antunna: split + SUKUN + TA + DAMMA + NUN + SHADDA + FATHA,
    hunna: split + SUKUN + NUN + FATHA,
    nahnu: split + SUKUN + NUN + FATHA + ALIF,
    // géminé
    huwa: geminated + FATHA,
    hiya: geminated + FATHA + TA + SUKUN,
    huma_m: geminated + FATHA + ALIF,
    huma_f: geminated + FATHA + TA + FATHA + ALIF,
    hum: geminated + DAMMA + WAW + ALIF,
  };
}

function doubledMudari(mudariHuwa: string): Record<PersonCode, string> {
  const u = toUnits(mudariHuwa);  // يَمُدُّ = ي(fatha) م(damma) د(shadda)
  const pv = vowelOf(u[0]) || FATHA;
  const r1 = u[1];                // م(damma)
  const r23 = u[u.length - 1];    // د(shadda)
  const midV = vowelOf(r1) || DAMMA;
  const gem = r1.base + midV + r23.base;        // radical géminé sans marque finale : مُدّ (avant suffixe)
  const geminated = r1.base + midV + r23.base + SHADDA;
  const split = r1.base + SUKUN + r23.base + midV + r23.base; // مْدُد (défait, devant نَ)
  void gem;
  const pre = (c: string) => c + pv;
  const anaPre = ALIF_HAMZA + pv;
  const indG = (p: string) => p + geminated + DAMMA;   // مرفوع géminé
  return {
    ana: anaPre + geminated + DAMMA,
    nahnu: indG(pre(NUN)),
    anta: indG(pre(TA)),
    huwa: indG(pre(YA)),
    hiya: indG(pre(TA)),
    anti: pre(TA) + geminated + KASRA + YA + NUN + FATHA,
    antuma: pre(TA) + geminated + FATHA + ALIF + NUN + KASRA,
    huma_m: pre(YA) + geminated + FATHA + ALIF + NUN + KASRA,
    huma_f: pre(TA) + geminated + FATHA + ALIF + NUN + KASRA,
    antum: pre(TA) + geminated + DAMMA + WAW + NUN + FATHA,
    hum: pre(YA) + geminated + DAMMA + WAW + NUN + FATHA,
    // devant نَ : défait
    antunna: pre(TA) + split + SUKUN + NUN + FATHA,
    hunna: pre(YA) + split + SUKUN + NUN + FATHA,
  };
}

function doubledAmr(mudariHuwa: string): Partial<Record<PersonCode, string>> {
  const u = toUnits(mudariHuwa);
  const r1 = u[1];
  const r23 = u[u.length - 1];
  const midV = vowelOf(r1) || DAMMA;
  const geminated = r1.base + midV + r23.base + SHADDA; // مُدّ
  const split = r1.base + SUKUN + r23.base + midV + r23.base;
  // Impératif redoublé : forme géminée avec voyelle finale (مُدَّ) ou défaite (اُمْدُدْ).
  // On retient la forme courante géminée : anta = radical géminé + FATHA.
  return {
    anta: geminated + FATHA,
    anti: geminated + KASRA + YA,
    antuma: geminated + FATHA + ALIF,
    antum: geminated + DAMMA + WAW + ALIF,
    antunna: split + SUKUN + NUN + FATHA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CREUX (أجوف) — قالَ/يَقولُ (و), بَاعَ/يَبيعُ (ي), خافَ/يَخافُ (a)
// La voyelle longue tombe (se raccourcit) devant un suffixe consonantique.
// ════════════════════════════════════════════════════════════════════════════
function hollowParts(madiHuwa: string, mudariHuwa: string) {
  const mu = toUnits(madiHuwa);   // قالَ = ق(fatha) ا ل(fatha)
  const r1 = mu[0];
  const r3 = mu[2];
  const pu = toUnits(mudariHuwa); // يَقولُ = ي(fatha) ق(sukun) و(?) ل(damma)
  const pv = vowelOf(pu[0]) || FATHA;
  const midLong = pu[2]?.base ?? WAW;              // lettre longue du présent (و/ي/ا)
  // Voyelle courte du passé (1re/2e pers.) : و→damma, sinon kasra ; type خاف→kasra.
  const shortPast = midLong === WAW ? DAMMA : KASRA;
  // Voyelle courte du présent devant نَ : و→damma, ي→kasra, ا→fatha.
  const shortPres = midLong === WAW ? DAMMA : midLong === YA ? KASRA : FATHA;
  return { r1, r3, pv, midLong, shortPast, shortPres };
}

function hollowMadi(madiHuwa: string, mudariHuwa: string): Record<PersonCode, string> {
  const { r1, r3, shortPast } = hollowParts(madiHuwa, mudariHuwa);
  const shortStem = r1.base + shortPast + r3.base;         // قُل / بِع
  const longHuwa = madiHuwa;                                // قالَ
  const longStem = r1.base + FATHA + ALIF + r3.base;        // قال (avant voyelle)
  return {
    ana: shortStem + SUKUN + TA + DAMMA,
    anta: shortStem + SUKUN + TA + FATHA,
    anti: shortStem + SUKUN + TA + KASRA,
    antuma: shortStem + SUKUN + TA + DAMMA + MIM + FATHA + ALIF,
    antum: shortStem + SUKUN + TA + DAMMA + MIM + SUKUN,
    antunna: shortStem + SUKUN + TA + DAMMA + NUN + SHADDA + FATHA,
    hunna: shortStem + SUKUN + NUN + FATHA,
    nahnu: shortStem + SUKUN + NUN + FATHA + ALIF,
    huwa: longHuwa,
    hiya: longStem + FATHA + TA + SUKUN,
    huma_m: longStem + FATHA + ALIF,
    huma_f: longStem + FATHA + TA + FATHA + ALIF,
    hum: r1.base + FATHA + ALIF + r3.base + DAMMA + WAW + ALIF,
  };
}

function hollowMudari(madiHuwa: string, mudariHuwa: string): Record<PersonCode, string> {
  const { r1, r3, pv, midLong, shortPres } = hollowParts(madiHuwa, mudariHuwa);
  const longStem = r1.base + SUKUN + midLong + r3.base;    // قْول (radical long, sans voyelle finale) → قُول visuellement via préfixe
  // Le radical long présent : ق + (و long) + ل ; la voyelle sur r1 dépend du préfixe.
  // On construit : préfixe + r1(sukun) + longVowelLetter + r3.
  const shortStem = r1.base + shortPres + r3.base;         // قُل / بِع / خَف (devant نَ)
  void longStem;
  const pre = (c: string) => c + pv;
  const anaPre = ALIF_HAMZA + pv;
  // La 1re radicale porte la voyelle courte correspondant à la longue (قُول, بِيع).
  const longBody = r1.base + shortPres + midLong + r3.base; // قُول / بِيع
  const ind = (p: string) => p + longBody + DAMMA;         // يَقُولُ
  return {
    ana: anaPre + longBody + DAMMA,
    nahnu: ind(pre(NUN)),
    anta: ind(pre(TA)),
    huwa: ind(pre(YA)),
    hiya: ind(pre(TA)),
    anti: pre(TA) + longBody + KASRA + YA + NUN + FATHA,
    antuma: pre(TA) + longBody + FATHA + ALIF + NUN + KASRA,
    huma_m: pre(YA) + longBody + FATHA + ALIF + NUN + KASRA,
    huma_f: pre(TA) + longBody + FATHA + ALIF + NUN + KASRA,
    antum: pre(TA) + longBody + DAMMA + WAW + NUN + FATHA,
    hum: pre(YA) + longBody + DAMMA + WAW + NUN + FATHA,
    antunna: pre(TA) + shortStem + SUKUN + NUN + FATHA,
    hunna: pre(YA) + shortStem + SUKUN + NUN + FATHA,
  };
}

function hollowAmr(madiHuwa: string, mudariHuwa: string): Partial<Record<PersonCode, string>> {
  const { r1, r3, midLong, shortPres } = hollowParts(madiHuwa, mudariHuwa);
  const longBody = r1.base + shortPres + midLong + r3.base; // قُول / بِيع
  const shortStem = r1.base + shortPres + r3.base;          // قُل / بِع
  return {
    anta: shortStem + SUKUN,                                  // قُلْ / بِعْ
    anti: longBody + KASRA + YA,                             // قُولِي / بِيعِي
    antuma: longBody + FATHA + ALIF,                          // قُولَا
    antum: longBody + DAMMA + WAW + ALIF,                     // قُولُوا
    antunna: shortStem + SUKUN + NUN + FATHA,                 // قُلْنَ
  };
}

// ════════════════════════════════════════════════════════════════════════════
// DÉFECTUEUX (ناقص) — رَمَى/يَرْمِي (ي), دَعَا/يَدْعُو (و), نَسِيَ/يَنْسَى (ى)
// La dernière radicale faible mute selon le suffixe.
// ════════════════════════════════════════════════════════════════════════════
function defectiveType(mudariHuwa: string): "ya" | "waw" | "alif" {
  const u = toUnits(mudariHuwa);
  const last = u[u.length - 1];
  if (last.base === ALIF_MAQSURA || (last.base === ALIF)) return "alif"; // يَنْسَى
  if (last.base === WAW) return "waw";  // يَدْعُو
  return "ya";                          // يَرْمِي
}

function defParts(madiHuwa: string, mudariHuwa: string) {
  const mu = toUnits(madiHuwa);
  const preUnits = mu.slice(0, mu.length - 1);
  const pre = preUnits.map((x) => x.base + x.marks).join("");     // رَمَ / دَعَ / نَسِ
  const t = defectiveType(mudariHuwa);
  const pmu = toUnits(mudariHuwa);
  const pv = vowelOf(pmu[0]) || FATHA;
  const stemUnits = pmu.slice(1, pmu.length - 1);                  // sans préfixe ni faible finale
  const body = stemUnits.map((x) => x.base + x.marks).join("");    // رْمِ / دْعُ / نْسَ
  const bodyNoV = stemUnits.map((x, i) => (i === stemUnits.length - 1 ? x.base + (x.marks.includes(SHADDA) ? SHADDA : "") : x.base + x.marks)).join(""); // رْم / دْع / نْس
  return { pre, preUnits, t, pv, body, bodyNoV };
}

function defectiveMadi(madiHuwa: string, mudariHuwa: string): Record<PersonCode, string> {
  const { pre, preUnits, t } = defParts(madiHuwa, mudariHuwa);
  const huwa = madiHuwa;
  if (t === "alif") {
    // نَسِيَ : la faible finale est ي ; devant suffixe consonantique → نَسِي(long).
    const head = preUnits.slice(0, -1).map((x) => x.base + x.marks).join("");
    const lastC = preUnits[preUnits.length - 1].base;
    const cons = pre + YA;                                          // نَسِي
    return {
      ana: cons + TA + DAMMA, anta: cons + TA + FATHA, anti: cons + TA + KASRA,
      antuma: cons + TA + DAMMA + MIM + FATHA + ALIF, antum: cons + TA + DAMMA + MIM + SUKUN,
      antunna: cons + TA + DAMMA + NUN + SHADDA + FATHA,
      hunna: cons + NUN + FATHA, nahnu: cons + NUN + FATHA + ALIF,
      huwa,
      hiya: pre + YA + FATHA + TA + SUKUN,                          // نَسِيَتْ
      huma_m: pre + YA + FATHA + ALIF,                             // نَسِيَا
      huma_f: pre + YA + FATHA + TA + FATHA + ALIF,
      hum: head + lastC + DAMMA + WAW + ALIF,                       // نَسُوا
    };
  }
  const glide = t === "waw" ? WAW : YA;
  const cons = pre + glide + SUKUN;                                 // رَمَيْ / دَعَوْ
  return {
    ana: cons + TA + DAMMA, anta: cons + TA + FATHA, anti: cons + TA + KASRA,
    antuma: cons + TA + DAMMA + MIM + FATHA + ALIF, antum: cons + TA + DAMMA + MIM + SUKUN,
    antunna: cons + TA + DAMMA + NUN + SHADDA + FATHA,
    hunna: cons + NUN + FATHA, nahnu: cons + NUN + FATHA + ALIF,
    huwa,
    hiya: pre + TA + SUKUN,                                         // رَمَتْ / دَعَتْ
    huma_m: pre + glide + FATHA + ALIF,                             // رَمَيَا / دَعَوَا
    huma_f: pre + TA + FATHA + ALIF,
    hum: pre + WAW + SUKUN + ALIF,                                  // رَمَوْا / دَعَوْا
  };
}

function defectiveMudari(mudariHuwa: string): Record<PersonCode, string> {
  const pmu = toUnits(mudariHuwa);
  const pv = vowelOf(pmu[0]) || FATHA;
  const t = defectiveType(mudariHuwa);
  const stemUnits = pmu.slice(1, pmu.length - 1);
  const body = stemUnits.map((x) => x.base + x.marks).join("");
  const bodyNoV = stemUnits.map((x, i) => (i === stemUnits.length - 1 ? x.base + (x.marks.includes(SHADDA) ? SHADDA : "") : x.base + x.marks)).join("");
  const pre = (c: string) => c + pv;
  const anaPre = ALIF_HAMZA + pv;
  const weak = t === "waw" ? WAW : t === "ya" ? YA : ALIF_MAQSURA;
  const full = body + weak;                                         // رْمِي / دْعُو / نْسَى
  const ind = (p: string) => p + full;
  if (t === "alif") {                                               // يَنْسَى
    return {
      ana: anaPre + full, nahnu: ind(pre(NUN)), anta: ind(pre(TA)), huwa: ind(pre(YA)), hiya: ind(pre(TA)),
      anti: pre(TA) + body + YA + SUKUN + NUN + FATHA,              // تَنْسَيْنَ
      antuma: pre(TA) + body + YA + FATHA + ALIF + NUN + KASRA,
      huma_m: pre(YA) + body + YA + FATHA + ALIF + NUN + KASRA,
      huma_f: pre(TA) + body + YA + FATHA + ALIF + NUN + KASRA,
      antum: pre(TA) + body + WAW + SUKUN + NUN + FATHA,            // تَنْسَوْنَ
      hum: pre(YA) + body + WAW + SUKUN + NUN + FATHA,
      antunna: pre(TA) + body + YA + SUKUN + NUN + FATHA,
      hunna: pre(YA) + body + YA + SUKUN + NUN + FATHA,
    };
  }
  return {
    ana: anaPre + full, nahnu: ind(pre(NUN)), anta: ind(pre(TA)), huwa: ind(pre(YA)), hiya: ind(pre(TA)),
    anti: pre(TA) + bodyNoV + KASRA + YA + NUN + FATHA,             // تَرْمِينَ / تَدْعِينَ
    antuma: pre(TA) + full + FATHA + ALIF + NUN + KASRA,            // تَرْمِيَانِ / تَدْعُوَانِ
    huma_m: pre(YA) + full + FATHA + ALIF + NUN + KASRA,
    huma_f: pre(TA) + full + FATHA + ALIF + NUN + KASRA,
    antum: pre(TA) + bodyNoV + DAMMA + WAW + NUN + FATHA,           // تَرْمُونَ / تَدْعُونَ
    hum: pre(YA) + bodyNoV + DAMMA + WAW + NUN + FATHA,
    antunna: pre(TA) + full + NUN + FATHA,                          // تَرْمِينَ (ي long) / تَدْعُونَ
    hunna: pre(YA) + full + NUN + FATHA,
  };
}

function defectiveAmr(mudariHuwa: string): Partial<Record<PersonCode, string>> {
  const pmu = toUnits(mudariHuwa);
  const t = defectiveType(mudariHuwa);
  const stemUnits = pmu.slice(1, pmu.length - 1);
  const body = stemUnits.map((x) => x.base + x.marks).join("");
  const bodyNoV = stemUnits.map((x, i) => (i === stemUnits.length - 1 ? x.base + (x.marks.includes(SHADDA) ? SHADDA : "") : x.base + x.marks)).join("");
  const needHelper = stemUnits[0]?.marks.includes(SUKUN) ?? false;
  const helperVowel = t === "waw" ? DAMMA : KASRA;
  const helper = needHelper ? ALIF + helperVowel : "";
  if (t === "alif") {
    return {
      anta: helper + body,                                          // اِنْسَ
      anti: helper + body + YA + SUKUN,                             // اِنْسَيْ
      antuma: helper + body + YA + FATHA + ALIF,
      antum: helper + body + WAW + SUKUN + ALIF,                    // اِنْسَوْا
      antunna: helper + body + YA + SUKUN + NUN + FATHA,
    };
  }
  return {
    anta: helper + body,                                            // اِرْمِ / اُدْعُ
    anti: helper + bodyNoV + KASRA + YA,                            // اِرْمِي / اُدْعِي
    antuma: helper + bodyNoV + KASRA + YA + FATHA + ALIF,
    antum: helper + bodyNoV + DAMMA + WAW + ALIF,                   // اِرْمُوا / اُدْعُوا
    antunna: helper + bodyNoV + KASRA + YA + NUN + FATHA,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// API : conjugue les 3 temps à partir des deux formes هو.
// ════════════════════════════════════════════════════════════════════════════
export type Conjugation = {
  family: Family;
  madi: Record<PersonCode, string>;
  mudari: Record<PersonCode, string>;
  amr: Partial<Record<PersonCode, string>>;
};

export function conjugate(madiHuwa: string, mudariHuwa: string): Conjugation {
  const family = classifyVerb(madiHuwa, mudariHuwa);
  if (family === "doubled") {
    return { family, madi: doubledMadi(madiHuwa), mudari: doubledMudari(mudariHuwa), amr: doubledAmr(mudariHuwa) };
  }
  if (family === "hollow") {
    return { family, madi: hollowMadi(madiHuwa, mudariHuwa), mudari: hollowMudari(madiHuwa, mudariHuwa), amr: hollowAmr(madiHuwa, mudariHuwa) };
  }
  if (family === "defective") {
    return { family, madi: defectiveMadi(madiHuwa, mudariHuwa), mudari: defectiveMudari(mudariHuwa), amr: defectiveAmr(mudariHuwa) };
  }
  const m = mudariFromForm(mudariHuwa);
  return { family, madi: madiFromStem(madiHuwa), mudari: m.table, amr: amrFromMudari(m) };
}

// Détection d'un verbe depuis une entrée « f1/f2 » du vocabulaire.
// Verbe = 2ᵉ forme commençant par يَ ou يُ (préfixe présent), suivi d'une consonne
// (exclut les adjectifs féminins en يّة).
export function parseVerbForms(arabicWord: string): { madi: string; mudari: string } | null {
  if (!arabicWord.includes("/")) return null;
  const [f1raw, f2raw] = arabicWord.split("/");
  const f1 = f1raw.trim();
  const f2 = f2raw.trim();
  const u = toUnits(f2);
  if (u.length < 3) return null;
  if (u[0].base !== YA) return null;
  const pv = vowelOf(u[0]);
  if (pv !== FATHA && pv !== DAMMA) return null;
  // Exclut يّة (adjectif féminin) : 1re unité ي avec shadda.
  if (u[0].marks.includes(SHADDA)) return null;
  if (!f1) return null;
  return { madi: f1, mudari: f2 };
}
