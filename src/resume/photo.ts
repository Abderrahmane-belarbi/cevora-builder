const sourceLimit = 10 * 1024 * 1024;
const outputSize = 384;

/** Decode, center-crop, and compress locally. No uploads or external requests. */
export async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP photo.");
  }
  if (file.size > sourceLimit) throw new Error("Choose a photo smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); }
    catch { throw new Error("This photo couldn’t be opened. Try another JPEG, PNG, or WebP file."); }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("This photo has no readable image data.");
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser couldn’t prepare your photo.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, outputSize, outputSize);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}
