import SavedPresenter from './saved-presenter.js';
import IdbRepository from '../../data/idb-repository.js';
import { formatDate } from '../../utils/index.js';

export default class SavedStoriesPage {
  #presenter;
  #listContainer;
  #statusRegion;
  #searchInput;
  #sortSelect;
  #locationFilter;
  #allStories = [];

  async render() {
    return `
      <section class="page-intro">
        <h1>Story tersimpan</h1>
        <p>Story yang kamu simpan akan tetap bisa dibaca meski sedang offline, lengkap dengan pencarian dan pengurutan.</p>
      </section>

      <div id="saved-status" aria-live="polite"></div>

      <form class="saved-controls" id="saved-controls" role="search">
        <div class="field">
          <label for="saved-search">Cari story</label>
          <input type="search" id="saved-search" name="search" placeholder="Cari berdasarkan nama atau deskripsi..." />
        </div>
        <div class="field">
          <label for="saved-sort">Urutkan</label>
          <select id="saved-sort" name="sort">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name-asc">Nama A-Z</option>
          </select>
        </div>
        <div class="field field--checkbox">
          <label for="saved-location-filter">
            <input type="checkbox" id="saved-location-filter" name="hasLocation" />
            Hanya yang punya lokasi
          </label>
        </div>
      </form>

      <ul class="stories-list" id="saved-list" aria-label="Daftar story tersimpan"></ul>
    `;
  }

  async afterRender() {
    this.#listContainer = document.getElementById('saved-list');
    this.#statusRegion = document.getElementById('saved-status');
    this.#searchInput = document.getElementById('saved-search');
    this.#sortSelect = document.getElementById('saved-sort');
    this.#locationFilter = document.getElementById('saved-location-filter');

    this.#presenter = new SavedPresenter({ view: this, model: IdbRepository });

    this.#searchInput.addEventListener('input', () => this.#renderFilteredList());
    this.#sortSelect.addEventListener('change', () => this.#renderFilteredList());
    this.#locationFilter.addEventListener('change', () => this.#renderFilteredList());

    await this.#presenter.loadSavedStories();
  }

  showLoading() {
    this.#listContainer.innerHTML = '<li class="loading-state">Memuat story tersimpan...</li>';
  }

  hideLoading() {
    // status loading digantikan langsung oleh setStories/showEmpty/showError
  }

  showEmpty() {
    this.#allStories = [];
    this.#listContainer.innerHTML = '<li class="empty-state">Belum ada story tersimpan. Simpan story dari beranda untuk dibaca offline.</li>';
  }

  showError(message) {
    this.#listContainer.innerHTML = `<li class="alert alert--error">${message}</li>`;
  }

  showDeleteError(message) {
    this.#statusRegion.innerHTML = `<p class="alert alert--error">${message}</p>`;
  }

  setStories(stories) {
    this.#allStories = stories;
    this.#renderFilteredList();
  }

  storyDeleted(id) {
    this.#allStories = this.#allStories.filter((story) => story.id !== id);
    this.#statusRegion.innerHTML = '<p class="alert alert--success">Story tersimpan dihapus.</p>';
    if (this.#allStories.length === 0) {
      this.showEmpty();
      return;
    }
    this.#renderFilteredList();
  }

  // Interaktivitas: search + sort + filter lokasi, seluruhnya di sisi klien
  // terhadap data yang sudah dimuat dari IndexedDB (Kriteria 4 — Skilled).
  #renderFilteredList() {
    const keyword = this.#searchInput.value.trim().toLowerCase();
    const sortBy = this.#sortSelect.value;
    const onlyWithLocation = this.#locationFilter.checked;

    let filtered = this.#allStories.filter((story) => {
      const matchesKeyword = !keyword
        || story.name.toLowerCase().includes(keyword)
        || story.description.toLowerCase().includes(keyword);
      const matchesLocation = !onlyWithLocation
        || (typeof story.lat === 'number' && typeof story.lon === 'number');
      return matchesKeyword && matchesLocation;
    });

    filtered = filtered.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    this.#listContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.#listContainer.innerHTML = '<li class="empty-state">Tidak ada story tersimpan yang cocok dengan pencarian/filter ini.</li>';
      return;
    }

    filtered.forEach((story) => {
      this.#listContainer.appendChild(this.#createStoryCard(story));
    });
  }

  #createStoryCard(story) {
    const li = document.createElement('li');
    li.className = 'story-card';
    li.id = `saved-story-${story.id}`;

    const hasLocation = typeof story.lat === 'number' && typeof story.lon === 'number';

    li.innerHTML = `
      <img class="story-card__photo" src="${story.photoUrl}" alt="Foto story oleh ${story.name}" />
      <div class="story-card__body">
        <h2 class="story-card__name">${story.name}</h2>
        <time class="story-card__date" datetime="${story.createdAt}">${formatDate(story.createdAt)}</time>
        <p class="story-card__desc">${story.description}</p>
        ${hasLocation ? `<p class="story-card__location">Lokasi: ${story.lat.toFixed(3)}, ${story.lon.toFixed(3)}</p>` : ''}
        <button type="button" class="button button--ghost story-card__delete" data-id="${story.id}">Hapus dari tersimpan</button>
      </div>
    `;

    const deleteButton = li.querySelector('.story-card__delete');
    deleteButton.addEventListener('click', () => {
      deleteButton.disabled = true;
      deleteButton.textContent = 'Menghapus...';
      this.#presenter.deleteStory(story.id);
    });

    return li;
  }

  destroy() {
    // tidak ada resource (map/stream) yang perlu dibersihkan di halaman ini
  }
}
