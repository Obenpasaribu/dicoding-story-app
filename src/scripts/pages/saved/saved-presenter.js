export default class SavedPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async loadSavedStories() {
    this.#view.showLoading();
    try {
      const stories = await this.#model.getAllStories();
      if (!stories || stories.length === 0) {
        this.#view.showEmpty();
        return;
      }
      this.#view.setStories(stories);
    } catch (error) {
      this.#view.showError('Gagal memuat story tersimpan dari penyimpanan lokal.');
    } finally {
      this.#view.hideLoading();
    }
  }

  async deleteStory(id) {
    try {
      await this.#model.deleteStory(id);
      this.#view.storyDeleted(id);
    } catch (error) {
      this.#view.showDeleteError('Gagal menghapus story tersimpan.');
    }
  }
}
