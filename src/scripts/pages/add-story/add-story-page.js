import L from 'leaflet';
import AddStoryPresenter from './add-story-presenter.js';
import StoryApi from '../../data/story-api.js';
import AuthRepository from '../../data/auth-repository.js';
import { isValidImageFile, dataURLtoFile } from '../../utils/index.js';

export default class AddStoryPage {
  #presenter;
  #form;
  #submitButton;
  #statusRegion;
  #descriptionInput;
  #fileInput;
  #preview;
  #videoElement;
  #cameraButton;
  #captureButton;
  #stopCameraButton;
  #stream = null;
  #photoFile = null;
  #pickerMap = null;
  #pickerMarker = null;
  #coordsText;
  #lat = null;
  #lon = null;

  async render() {
    return `
      <section class="page-intro">
        <h1>Tambah story baru</h1>
        <p>Ceritakan momenmu bersama Dicoding, lengkap dengan foto dan lokasi.</p>
      </section>

      <div id="add-story-status" aria-live="polite"></div>

      <form id="add-story-form" class="add-story-layout" novalidate>
        <div>
          <div class="field">
            <label for="description-input">Deskripsi</label>
            <textarea id="description-input" name="description" required aria-describedby="description-help"></textarea>
            <small id="description-help">Ceritakan apa yang terjadi di foto ini.</small>
          </div>

          <fieldset class="photo-input">
            <legend>Foto story</legend>

            <div class="field">
              <label for="photo-file-input">Unggah dari perangkat</label>
              <input type="file" id="photo-file-input" name="photo" accept="image/*" />
              <small>Format gambar, maksimum 1MB.</small>
            </div>

            <p style="margin: 0.4rem 0; color: var(--color-ink-soft);">atau</p>

            <div class="photo-input__actions">
              <button type="button" class="button button--ghost" id="camera-button">Buka kamera</button>
              <button type="button" class="button button--ghost hidden" id="capture-button">Ambil gambar</button>
              <button type="button" class="button button--ghost hidden" id="stop-camera-button">Tutup kamera</button>
            </div>

            <video id="camera-preview" class="photo-input__video hidden" autoplay playsinline muted aria-label="Pratinjau kamera langsung"></video>
            <img id="photo-preview" class="photo-input__preview hidden" alt="" />
          </fieldset>

          <button type="submit" class="button" id="add-story-submit">Kirim story</button>
        </div>

        <div>
          <div class="field">
            <label for="picker-map">Pilih lokasi di peta (opsional)</label>
            <div id="picker-map" class="picker-map" tabindex="0" role="group" aria-label="Klik peta untuk memilih lokasi story"></div>
            <p class="picker-map__coords" id="picker-coords">Belum ada lokasi dipilih.</p>
          </div>
        </div>
      </form>
    `;
  }

  async afterRender() {
    this.#presenter = new AddStoryPresenter({ view: this, model: StoryApi, authModel: AuthRepository });

    this.#form = document.getElementById('add-story-form');
    this.#submitButton = document.getElementById('add-story-submit');
    this.#statusRegion = document.getElementById('add-story-status');
    this.#descriptionInput = document.getElementById('description-input');
    this.#fileInput = document.getElementById('photo-file-input');
    this.#preview = document.getElementById('photo-preview');
    this.#videoElement = document.getElementById('camera-preview');
    this.#cameraButton = document.getElementById('camera-button');
    this.#captureButton = document.getElementById('capture-button');
    this.#stopCameraButton = document.getElementById('stop-camera-button');
    this.#coordsText = document.getElementById('picker-coords');

    this.#setupPhotoUpload();
    this.#setupCamera();
    this.#setupPickerMap();
    this.#setupFormSubmit();
  }

  #setupPhotoUpload() {
    this.#fileInput.addEventListener('change', () => {
      const file = this.#fileInput.files[0];
      if (!file) return;

      if (!isValidImageFile(file)) {
        this.submitFailed('Berkas harus berupa gambar dengan ukuran maksimum 1MB.');
        this.#fileInput.value = '';
        return;
      }

      this.#stopCamera();
      this.#photoFile = file;
      this.#showPreview(URL.createObjectURL(file));
    });
  }

  #setupCamera() {
    this.#cameraButton.addEventListener('click', async () => {
      try {
        this.#stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        this.#videoElement.srcObject = this.#stream;
        this.#videoElement.classList.remove('hidden');
        this.#preview.classList.add('hidden');
        this.#captureButton.classList.remove('hidden');
        this.#stopCameraButton.classList.remove('hidden');
      } catch (error) {
        this.submitFailed('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
      }
    });

    this.#captureButton.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = this.#videoElement.videoWidth;
      canvas.height = this.#videoElement.videoHeight;
      canvas.getContext('2d').drawImage(this.#videoElement, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      this.#photoFile = dataURLtoFile(dataUrl, `camera-${Date.now()}.jpg`);
      this.#fileInput.value = '';
      this.#showPreview(dataUrl);
      this.#stopCamera();
    });

    this.#stopCameraButton.addEventListener('click', () => this.#stopCamera());
  }

  #showPreview(src) {
    this.#preview.src = src;
    this.#preview.alt = 'Pratinjau foto story yang akan diunggah';
    this.#preview.classList.remove('hidden');
  }

  #stopCamera() {
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
      this.#stream = null;
    }
    this.#videoElement.classList.add('hidden');
    this.#captureButton.classList.add('hidden');
    this.#stopCameraButton.classList.add('hidden');
  }

  #setupPickerMap() {
    const container = document.getElementById('picker-map');
    this.#pickerMap = L.map(container).setView([-2.5489, 118.0149], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.#pickerMap);

    this.#pickerMap.on('click', (event) => {
      const { lat, lng } = event.latlng;
      this.#lat = lat;
      this.#lon = lng;

      if (this.#pickerMarker) {
        this.#pickerMarker.setLatLng(event.latlng);
      } else {
        this.#pickerMarker = L.marker(event.latlng).addTo(this.#pickerMap);
      }

      this.#coordsText.textContent = `Lokasi dipilih: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });
  }

  #setupFormSubmit() {
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.#statusRegion.innerHTML = '';

      const description = this.#descriptionInput.value.trim();

      if (!description) {
        this.submitFailed('Deskripsi tidak boleh kosong.');
        return;
      }
      if (!this.#photoFile) {
        this.submitFailed('Pilih foto dari perangkat atau ambil melalui kamera terlebih dahulu.');
        return;
      }

      await this.#presenter.submitStory({
        description,
        photo: this.#photoFile,
        lat: this.#lat,
        lon: this.#lon,
      });
    });
  }

  showSubmitLoading() {
    this.#submitButton.disabled = true;
    this.#submitButton.textContent = 'Mengirim...';
  }

  hideSubmitLoading() {
    this.#submitButton.disabled = false;
    this.#submitButton.textContent = 'Kirim story';
  }

  submitSuccess() {
    this.#statusRegion.innerHTML = '<p class="alert alert--success">Story berhasil dikirim! Mengalihkan ke beranda...</p>';
    setTimeout(() => { location.hash = '#/'; }, 900);
  }

  submitFailed(message) {
    this.#statusRegion.innerHTML = `<p class="alert alert--error">${message}</p>`;
  }

  destroy() {
    this.#stopCamera();
    if (this.#pickerMap) {
      this.#pickerMap.remove();
      this.#pickerMap = null;
    }
  }
}
