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

export function zipGrammar(formData: FormData) {
  const title = formData.getAll("grammar_title").map((v) => String(v).trim());
  const content = formData.getAll("grammar_content").map((v) => String(v).trim());

  const rows: { title: string; content: string }[] = [];
  for (let i = 0; i < title.length; i++) {
    if (title[i] && content[i]) {
      rows.push({ title: title[i], content: content[i] });
    }
  }
  return rows;
}

export function zipFormulation(formData: FormData) {
  const arabic = formData.getAll("form_arabic").map((v) => String(v).trim());
  const french = formData.getAll("form_french").map((v) => String(v).trim());

  const rows: { arabic_text: string; french_text: string }[] = [];
  for (let i = 0; i < arabic.length; i++) {
    if (arabic[i] && french[i]) {
      rows.push({ arabic_text: arabic[i], french_text: french[i] });
    }
  }
  return rows;
}
