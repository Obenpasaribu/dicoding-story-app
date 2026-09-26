export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async login({ email, password }) {
    this.#view.showSubmitLoading();
    try {
      const response = await this.#model.login({ email, password });
      if (response.error || !response.ok) {
        this.#view.loginFailed(response.message || 'Gagal masuk, silakan coba lagi.');
        return;
      }
      this.#authModel.putAccessToken(response.loginResult.token);
      this.#authModel.putUserName(response.loginResult.name);
      this.#view.loginSuccess();
    } catch (error) {
      this.#view.loginFailed('Tidak dapat terhubung ke server. Periksa koneksi internetmu.');
    } finally {
      this.#view.hideSubmitLoading();
    }
  }
}
