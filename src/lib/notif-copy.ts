// Rendu partagé d'une notification (cloche + page dédiée) : dérive un titre, un
// corps de texte avec du vrai contenu, et l'indicateur "prioritaire" à partir du
// type + du payload — un seul endroit à faire évoluer si un type change de forme.

export type NotifType =
  | "new_message"
  | "homework_due"
  | "eval_due"
  | "homework_corrected"
  | "homework_submitted"
  | "trial_request"
  | "session_reminder"
  | "house_rules";

export type NotifPayload = {
  url?: string;
  sender_name?: string;
  body_preview?: string;
  instructions_preview?: string;
  student_name?: string;
  grade?: string;
};

export type NotifCopy = {
  title: string;
  body: string | null;
  priority: boolean;
};

// Seul homework_due est prioritaire : c'est le prof qui le déclenche en écrivant
// un devoir dans la fiche de fin de cours, aucun flag manuel à gérer.
export function isPriorityNotif(type: string): boolean {
  return type === "homework_due";
}

export function getNotifCopy(type: string, payload: unknown): NotifCopy {
  const p = (payload ?? {}) as NotifPayload;

  switch (type as NotifType) {
    case "new_message":
      return {
        title: p.sender_name ? `Message de ${p.sender_name}` : "Nouveau message",
        body: p.body_preview ? `« ${p.body_preview} »` : null,
        priority: false,
      };
    case "homework_due":
      return {
        title: "Devoir à rendre",
        body: p.instructions_preview ? p.instructions_preview : null,
        priority: true,
      };
    case "homework_corrected":
      return {
        title: p.grade ? `Devoir corrigé · ${p.grade}` : "Devoir corrigé",
        body: p.instructions_preview ? p.instructions_preview : null,
        priority: false,
      };
    case "homework_submitted":
      return {
        title: p.student_name ? `${p.student_name} a rendu son devoir` : "Devoir soumis",
        body: p.instructions_preview ? p.instructions_preview : null,
        priority: false,
      };
    case "house_rules":
      return {
        title: "Règlement intérieur à valider",
        body: null,
        priority: false,
      };
    default:
      return { title: type, body: null, priority: false };
  }
}
