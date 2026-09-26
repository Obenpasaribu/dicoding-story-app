import { CONFIG } from '../config.js';

/**
 * Membungkus document.startViewTransition dengan fallback aman
 * untuk browser yang belum mendukung View Transition API.
 */
export function transitionHelper({ skipTransition = false, updateDOM }) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => {});
    return {
      ready: Promise.reject(new Error('View Transition API tidak didukung di browser ini.')),
      updateCallbackDone,
      finished: updateCallbackDone,
    };
  }
  return document.startViewTransition(updateDOM);
}

export function formatDate(isoString) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch (error) {
    return isoString;
  }
}

export function isValidImageFile(file) {
  if (!file) return false;
  if (!file.type.startsWith('image/')) return false;
  if (file.size > CONFIG.MAX_PHOTO_SIZE) return false;
  return true;
}

export function dataURLtoFile(dataUrl, filename) {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], filename, { type: mime });
}
