const ACCESS_TOKEN_KEY = 'dicodingStory:accessToken';
const USER_NAME_KEY = 'dicodingStory:userName';

/**
 * AuthRepository — bagian dari layer Model.
 * Bertanggung jawab menyimpan/mengambil status login di localStorage.
 */
const AuthRepository = {
  getAccessToken() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('getAccessToken: gagal membaca localStorage', error);
      return null;
    }
  },

  putAccessToken(token) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('putAccessToken: gagal menulis localStorage', error);
      return false;
    }
  },

  getUserName() {
    try {
      return localStorage.getItem(USER_NAME_KEY);
    } catch (error) {
      return null;
    }
  },

  putUserName(name) {
    try {
      localStorage.setItem(USER_NAME_KEY, name);
      return true;
    } catch (error) {
      return false;
    }
  },

  removeAccessToken() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_NAME_KEY);
      return true;
    } catch (error) {
      console.error('removeAccessToken: gagal menulis localStorage', error);
      return false;
    }
  },

  isLoggedIn() {
    return Boolean(this.getAccessToken());
  },
};

export default AuthRepository;
