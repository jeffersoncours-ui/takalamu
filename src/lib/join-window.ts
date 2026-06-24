// Fenêtre d'accès au cours en visio (règles métier §7.7 / §8).
// Le lien Zoom devient disponible JOIN_OPEN_MIN minutes AVANT le cours
// (le prof peut enchaîner / arranger l'élève), et cesse d'être proposé
// JOIN_LATE_MIN minutes APRÈS l'heure de début (au-delà = retard, accès fermé).
//
// NOTE (limite connue) : ces fenêtres ne font que masquer le bouton côté client —
// le `zoom_link` est aujourd'hui livré dans le SSR. Pour couper réellement l'accès
// hors fenêtre, il faudra servir le lien via une RPC/route gardée temporellement.
// TODO Phase 5+ : livraison du lien Zoom côté serveur, fenêtrée.

export const JOIN_OPEN_MIN = 10; // rejoignable dès −10 min
export const JOIN_LATE_MIN = 10; // accès fermé après +10 min (seuil de retard)

export function joinWindow(scheduledAt: string | Date) {
  const courseTime = new Date(scheduledAt);
  return {
    courseTime,
    openAt: new Date(courseTime.getTime() - JOIN_OPEN_MIN * 60_000),
    closeAt: new Date(courseTime.getTime() + JOIN_LATE_MIN * 60_000),
  };
}
