export default class AddStoryPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async submitStory({ description, photo, lat, lon }) {
    this.#view.showSubmitLoading();
    try {
      const token = this.#authModel.getAccessToken();
      const response = await this.#model.addNewStory({ token, description, photo, lat, lon });

      if (response.error || !response.ok) {
        this.#view.submitFailed(response.message || 'Gagal mengirim story, silakan coba lagi.');
        return;
      }
      this.#view.submitSuccess();
    } catch (error) {
      this.#view.submitFailed('Tidak dapat terhubung ke server. Periksa koneksi internetmu.');
    } finally {
      this.#view.hideSubmitLoading();
    }
  }
}
