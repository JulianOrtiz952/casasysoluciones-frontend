export const MAX_PROPERTY_IMAGES = 20;
export const MAX_PROPERTY_IMAGE_BYTES = 12 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen."))),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

async function optimizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("El navegador no pudo procesar la imagen.");
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToBlob(canvas);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "inmueble";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

export async function preparePropertyImages(files: File[], currentCount = 0): Promise<File[]> {
  if (currentCount + files.length > MAX_PROPERTY_IMAGES) {
    throw new Error(`Cada inmueble puede tener máximo ${MAX_PROPERTY_IMAGES} imágenes.`);
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(`“${file.name}” debe ser una imagen JPG, PNG, WebP o GIF.`);
    }
    if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
      throw new Error(`“${file.name}” supera el límite de 12 MB.`);
    }
  }

  try {
    return await Promise.all(files.map(optimizeImage));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("“")) throw error;
    throw new Error("Una de las imágenes no es válida o el navegador no pudo procesarla.");
  }
}
