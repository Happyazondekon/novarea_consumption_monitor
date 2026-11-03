/**
 * Client-side image downscaling before upload.
 *
 * Photos are stored as data URLs in Postgres, so every byte saved here is
 * saved in Neon storage and in Neon network transfer each time it is read.
 * WebP is ~30% smaller than JPEG at equal quality; browsers that cannot encode
 * it (older Safari) silently return PNG from toDataURL, so we fall back to JPEG.
 */
export interface CompressOptions {
  maxDim: number;
  quality: number;
}

export const METER_PHOTO: CompressOptions = { maxDim: 1024, quality: 0.6 };
export const AVATAR: CompressOptions = { maxDim: 256, quality: 0.7 };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unreadable image"));
    img.src = src;
  });
}

export async function compressImage(file: File, { maxDim, quality }: CompressOptions): Promise<string> {
  const img = await loadImage(await readAsDataUrl(file));

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", quality);
}
