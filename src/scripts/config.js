export const CONFIG = {
  BASE_URL: "https://story-api.dicoding.dev/v1",
  MAX_PHOTO_SIZE: 1024 * 1024, // 1MB, sesuai batas Story API
  // VAPID public key resmi dari dokumentasi Dicoding Story API, dipakai untuk
  // mendaftarkan PushSubscription (Kriteria 2 — Push Notification).
  // Cocokkan kembali dengan dokumentasi kelasmu sebelum submit — jika API
  // key sudah berganti, cukup ganti nilai string di bawah ini.
  PUSH_MSG_VAPID_PUBLIC_KEY:
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk",
};
