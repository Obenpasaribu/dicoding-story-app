import { CONFIG } from '../config.js';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  NOTIFICATIONS_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return { error: true, message: 'Respons server tidak valid.' };
  }
}

/**
 * StoryApi — layer Model yang membungkus seluruh komunikasi ke Dicoding Story API.
 */
const StoryApi = {
  async register({ name, email, password }) {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },

  async login({ email, password }) {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },

  async getAllStories({ token, page, size, location = 1 }) {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (size) params.set('size', size);
    params.set('location', String(location));

    const response = await fetch(`${ENDPOINTS.STORIES}?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },

  async getStoryDetail({ token, id }) {
    const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },

  async addNewStory({ token, description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo, photo.name || 'story-photo.jpg');
    if (lat !== undefined && lat !== null && lat !== '') formData.append('lat', lat);
    if (lon !== undefined && lon !== null && lon !== '') formData.append('lon', lon);

    const response = await fetch(ENDPOINTS.STORIES, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },

  /**
   * Mendaftarkan PushSubscription milik browser ke server, supaya server
   * dapat mengirim push notification saat ada story baru dibuat.
   */
  async subscribeNotification({ token, subscription }) {
    const { endpoint, keys } = subscription.toJSON
      ? subscription.toJSON()
      : subscription;

    const response = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      }),
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },

  async unsubscribeNotification({ token, endpoint }) {
    const response = await fetch(ENDPOINTS.NOTIFICATIONS_SUBSCRIBE, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });
    const json = await parseJsonSafely(response);
    return { ...json, ok: response.ok };
  },
};

export default StoryApi;
