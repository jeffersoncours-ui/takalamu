/** Reconstruit les lignes vocab/grammaire dynamiques d'une fiche de séance depuis un FormData. */

export function zipVocab(formData: FormData) {
  const arabic = formData.getAll("vocab_arabic").map((v) => String(v).trim());
  const french = formData.getAll("vocab_french").map((v) => String(v).trim());

  const rows: { arabic_word: string; french_definition: string }[] = [];
  for (let i = 0; i < arabic.length; i++) {
    if (arabic[i] && french[i]) {
      rows.push({ arabic_word: arabic[i], french_definition: french[i] });
    }
  }
  return rows;
}

export type GrammarRowInput = {
  title: string;
  content: string;
  /** Nouvelles photos ajoutées pour cette règle (fiche de création ET édition). */
  newPhotos: File[];
  /** Photos déjà en Storage conservées telles quelles (édition uniquement). */
  existingPhotos: { path: string; name: string }[];
  /**
   * `rule_group_id` d'origine (édition d'une règle déjà existante uniquement) —
   * conserve le regroupement avec les autres élèves de la même fiche d'origine.
   * `null` pour une ligne nouvellement ajoutée (aucun groupe à préserver).
   */
  existingGroupId: string | null;
};

/**
 * Chaque ligne de règle rend un champ `grammar_photos_{idx}` (multiple) indexé
 * par sa position de rendu — la position peut se décaler quand une ligne
 * précédente est retirée, mais React conserve le même noeud DOM (clé stable)
 * pour chaque ligne, donc les fichiers déjà choisis restent attachés au bon
 * champ même si son `name` est renommé entre deux rendus.
 */
export function zipGrammar(formData: FormData): GrammarRowInput[] {
  const title = formData.getAll("grammar_title").map((v) => String(v).trim());
  const content = formData.getAll("grammar_content").map((v) => String(v).trim());

  const rows: GrammarRowInput[] = [];
  for (let i = 0; i < title.length; i++) {
    if (!title[i] || !content[i]) continue;
    const newPhotos = formData
      .getAll(`grammar_photos_${i}`)
      .filter((f): f is File => f instanceof File && f.size > 0);
    const existingPhotos = formData
      .getAll(`grammar_photos_existing_${i}`)
      .map((v) => {
        try {
          return JSON.parse(String(v)) as { path: string; name: string };
        } catch {
          return null;
        }
      })
      .filter((f): f is { path: string; name: string } => f !== null);
    const existingGroupId = String(formData.get(`grammar_rule_group_existing_${i}`) ?? "").trim() || null;
    rows.push({ title: title[i], content: content[i], newPhotos, existingPhotos, existingGroupId });
  }
  return rows;
}

export type FormulationRowInput = {
  arabic_text: string;
  french_text: string;
  /** Nouvel enregistrement micro (fiche de création ET édition). */
  newAudio: File | null;
  /** Audio déjà en Storage conservé tel quel (édition uniquement). */
  existingAudioPath: string | null;
};

/**
 * Chaque ligne de formulation rend exactement un champ de chaque nom
 * (form_arabic / form_french / form_audio [/ form_audio_existing]), y compris
 * vides — l'alignement se fait par index.
 */
export function zipFormulation(formData: FormData): FormulationRowInput[] {
  const arabic = formData.getAll("form_arabic").map((v) => String(v).trim());
  const french = formData.getAll("form_french").map((v) => String(v).trim());
  const audios = formData.getAll("form_audio");
  const existing = formData.getAll("form_audio_existing").map((v) => String(v).trim());

  const rows: FormulationRowInput[] = [];
  for (let i = 0; i < arabic.length; i++) {
    if (!arabic[i] || !french[i]) continue;
    const audio = audios[i];
    rows.push({
      arabic_text: arabic[i],
      french_text: french[i],
      newAudio: audio instanceof File && audio.size > 0 ? audio : null,
      existingAudioPath: existing[i] || null,
    });
  }
  return rows;
}
