export default class RegisterPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async register({ name, email, password }) {
    this.#view.showSubmitLoading();
    try {
      const response = await this.#model.register({ name, email, password });
      if (response.error || !response.ok) {
        this.#view.registerFailed(response.message || 'Gagal mendaftar, silakan coba lagi.');
        return;
      }
      this.#view.registerSuccess();
    } catch (error) {
      this.#view.registerFailed('Tidak dapat terhubung ke server. Periksa koneksi internetmu.');
    } finally {
      this.#view.hideSubmitLoading();
    }
  }
}
