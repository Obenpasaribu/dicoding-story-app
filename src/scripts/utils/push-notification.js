import { CONFIG } from '../config.js';
import StoryApi from '../data/story-api.js';

/**
 * Mengonversi VAPID public key (base64url) menjadi Uint8Array,
 * format yang dibutuhkan oleh `PushManager.subscribe`.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getExistingSubscription() {
  if (!isPushNotificationSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Meminta izin notifikasi, membuat PushSubscription baru, lalu
 * mendaftarkannya ke Story API supaya server bisa mengirim push
 * saat ada story baru.
 */
export async function subscribePushNotification({ token }) {
  if (!isPushNotificationSupported()) {
    throw new Error('Peramban ini tidak mendukung push notification.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi tidak diberikan.');
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing
    || (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY),
    }));

  const response = await StoryApi.subscribeNotification({ token, subscription });
  if (response.error || !response.ok) {
    throw new Error(response.message || 'Gagal mendaftarkan notifikasi ke server.');
  }

  return subscription;
}

export async function unsubscribePushNotification({ token }) {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  await StoryApi.unsubscribeNotification({ token, endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
