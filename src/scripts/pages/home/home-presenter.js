export default class HomePresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async loadStories() {
    this.#view.showLoading();
    try {
      const token = this.#authModel.getAccessToken();
      const response = await this.#model.getAllStories({ token, location: 1, size: 40 });

      if (response.error || !response.ok) {
        this.#view.showError(response.message || 'Gagal memuat data story.');
        return;
      }

      if (!response.listStory || response.listStory.length === 0) {
        this.#view.showEmpty();
        return;
      }

      this.#view.populateStories(response.listStory);
    } catch (error) {
      this.#view.showError('Tidak dapat terhubung ke server. Periksa koneksi internetmu.');
    } finally {
      this.#view.hideLoading();
    }
  }
}
