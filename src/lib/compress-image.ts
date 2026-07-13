"use client";

/**
 * Compresse/redimensionne une image dans le navigateur AVANT l'upload.
 * Une photo de devoir manuscrit n'a pas besoin de la pleine résolution d'un
 * téléphone (3–8 Mo) : ramenée à ~1800 px et ré-encodée en JPEG ~0,8, elle passe
 * à ~200–500 Ko → envoi bien plus rapide, surtout en 4G.
 *
 * - Ne touche qu'aux images ; audio / PDF / autres sont renvoyés tels quels.
 * - `imageOrientation: "from-image"` respecte l'orientation EXIF (photos iPhone)
 *   pour ne pas retourner l'image.
 * - Si la compression échoue (format non décodable comme certains HEIC) ou
 *   n'aide pas (déjà plus petit), on garde le fichier d'origine.
 */
export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  const { maxDim = 1800, quality = 0.8 } = opts;
  if (!file.type.startsWith("image/")) return file;
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
