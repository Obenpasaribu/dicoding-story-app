import L from 'leaflet';
import HomePresenter from './home-presenter.js';
import StoryApi from '../../data/story-api.js';
import AuthRepository from '../../data/auth-repository.js';
import IdbRepository from '../../data/idb-repository.js';
import { formatDate } from '../../utils/index.js';

export default class HomePage {
  #presenter;
  #map;
  #markers = new Map();
  #listContainer;
  #mapContainer;

  async render() {
    return `
      <section class="page-intro">
        <h1>Story dari komunitas</h1>
        <p>Jelajahi cerita seputar Dicoding lengkap dengan lokasinya di peta.</p>
      </section>

      <div class="stories-layout">
        <ul class="stories-list" id="stories-list" aria-label="Daftar story"></ul>
        <div
          id="stories-map"
          class="stories-map"
          tabindex="0"
          role="group"
          aria-label="Peta lokasi story"
        ></div>
      </div>
    `;
  }

  async afterRender() {
    this.#listContainer = document.getElementById('stories-list');
    this.#mapContainer = document.getElementById('stories-map');

    this.#initializeMap();

    this.#presenter = new HomePresenter({
      view: this,
      model: StoryApi,
      authModel: AuthRepository,
    });
    await this.#presenter.loadStories();
  }

  #initializeMap() {
    this.#map = L.map(this.#mapContainer, {
      center: [-2.5489, 118.0149], // tengah Indonesia sebagai default
      zoom: 5,
    });

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.#map);

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      },
    );

    // Kriteria 2 — Advance: layer control dengan 2+ tile layer.
    L.control.layers(
      { 'Peta Jalan': osmLayer, 'Citra Satelit': satelliteLayer },
      {},
      { collapsed: true },
    ).addTo(this.#map);
  }

  showLoading() {
    this.#listContainer.innerHTML = '<li class="loading-state">Memuat story...</li>';
  }

  hideLoading() {
    // status loading digantikan langsung oleh populateStories/showEmpty/showError
  }

  showEmpty() {
    this.#listContainer.innerHTML = '<li class="empty-state">Belum ada story. Jadilah yang pertama membagikan story!</li>';
  }

  showError(message) {
    this.#listContainer.innerHTML = `<li class="alert alert--error">${message}</li>`;
  }

  populateStories(stories) {
    this.#listContainer.innerHTML = '';
    this.#markers.clear();

    const bounds = [];

    stories.forEach((story) => {
      this.#listContainer.appendChild(this.#createStoryCard(story));

      if (typeof story.lat === 'number' && typeof story.lon === 'number') {
        const marker = L.marker([story.lat, story.lon]).addTo(this.#map);
        marker.bindPopup(this.#createPopupContent(story));
        this.#markers.set(story.id, marker);
        bounds.push([story.lat, story.lon]);
      }
    });

    if (bounds.length > 0) {
      this.#map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
    }
  }

  #createPopupContent(story) {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.src = story.photoUrl;
    img.alt = `Foto story oleh ${story.name}`;
    img.width = 180;
    const desc = document.createElement('p');
    desc.style.margin = '0';
    desc.textContent = story.description;
    container.appendChild(img);
    container.appendChild(desc);
    return container;
  }

  #createStoryCard(story) {
    const li = document.createElement('li');
    li.className = 'story-card';
    li.id = `story-${story.id}`;

    const hasLocation = typeof story.lat === 'number' && typeof story.lon === 'number';

    li.innerHTML = `
      <img class="story-card__photo" src="${story.photoUrl}" alt="Foto story oleh ${story.name}" />
      <div class="story-card__body">
        <h2 class="story-card__name">${story.name}</h2>
        <time class="story-card__date" datetime="${story.createdAt}">${formatDate(story.createdAt)}</time>
        <p class="story-card__desc">${story.description}</p>
        <div class="story-card__actions">
          ${hasLocation ? `<button type="button" class="button button--ghost story-card__locate" data-id="${story.id}">Lihat di peta</button>` : ''}
          <button type="button" class="button button--ghost story-card__save" data-id="${story.id}">Simpan offline</button>
        </div>
      </div>
    `;

    if (hasLocation) {
      const locateButton = li.querySelector('.story-card__locate');
      locateButton.addEventListener('click', () => this.#focusStoryOnMap(story.id));
    }

    const saveButton = li.querySelector('.story-card__save');
    saveButton.addEventListener('click', () => this.#handleSaveOffline(story, saveButton));

    return li;
  }

  // Kriteria 4 — menyimpan story pilihan ke IndexedDB agar bisa dibaca
  // ulang secara offline lewat halaman "Story Tersimpan".
  async #handleSaveOffline(story, button) {
    button.disabled = true;
    button.textContent = 'Menyimpan...';
    try {
      await IdbRepository.saveStory(story);
      button.textContent = 'Tersimpan ✓';
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Simpan offline';
      window.alert('Gagal menyimpan story secara offline.');
    }
  }

  // Kriteria 2 — fitur interaktif: sinkronisasi antara list dan peta + highlight marker aktif.
  #focusStoryOnMap(storyId) {
    const marker = this.#markers.get(storyId);
    if (!marker) return;

    this.#map.flyTo(marker.getLatLng(), 13, { duration: 0.75 });
    marker.openPopup();

    this.#listContainer.querySelectorAll('.story-card').forEach((card) => {
      card.classList.remove('story-card--active');
    });
    const activeCard = document.getElementById(`story-${storyId}`);
    if (activeCard) {
      activeCard.classList.add('story-card--active');
    }

    this.#mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  destroy() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
  }
}
