export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validateImage(file) {
  if (!file) return "No file selected.";
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return "Use a PNG, JPG or WebP image.";
  if (file.size > MAX_PHOTO_BYTES) return "That image is over 5 MB. Choose a smaller one.";
  return "";
}

// Centre-crops to a square and shrinks to `size` px, so the stored photo is ~15-30 KB
// (safe for localStorage and fast to render everywhere).
export function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("We couldn't read that image. Try another file.")); };
    img.src = url;
  });
}
