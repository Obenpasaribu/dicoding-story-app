import RegisterPresenter from './register-presenter.js';
import StoryApi from '../../data/story-api.js';

export default class RegisterPage {
  #presenter;
  #form;
  #submitButton;
  #statusRegion;

  async render() {
    return `
      <section class="page-intro">
        <h1>Daftar akun</h1>
        <p>Buat akun baru untuk mulai membagikan story-mu.</p>
      </section>

      <div class="form-card">
        <div id="register-status" aria-live="polite"></div>
        <form id="register-form" novalidate>
          <div class="field">
            <label for="name-input">Nama lengkap</label>
            <input type="text" id="name-input" name="name" autocomplete="name" required />
          </div>
          <div class="field">
            <label for="email-input">Email</label>
            <input type="email" id="email-input" name="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="password-input">Kata sandi</label>
            <input type="password" id="password-input" name="password" autocomplete="new-password" minlength="8" required />
            <small>Minimal 8 karakter.</small>
          </div>
          <button type="submit" class="button" id="register-submit">Daftar</button>
        </form>
        <p style="margin-top:1rem;">Sudah punya akun? <a href="#/login">Masuk di sini</a>.</p>
      </div>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({ view: this, model: StoryApi });
    this.#form = document.getElementById('register-form');
    this.#submitButton = document.getElementById('register-submit');
    this.#statusRegion = document.getElementById('register-status');

    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.#statusRegion.innerHTML = '';

      const name = document.getElementById('name-input').value.trim();
      const email = document.getElementById('email-input').value.trim();
      const password = document.getElementById('password-input').value;

      if (!name || !email || password.length < 8) {
        this.registerFailed('Lengkapi nama, email, dan kata sandi minimal 8 karakter.');
        return;
      }

      await this.#presenter.register({ name, email, password });
    });
  }

  showSubmitLoading() {
    this.#submitButton.disabled = true;
    this.#submitButton.textContent = 'Memproses...';
  }

  hideSubmitLoading() {
    this.#submitButton.disabled = false;
    this.#submitButton.textContent = 'Daftar';
  }

  registerSuccess() {
    this.#statusRegion.innerHTML = '<p class="alert alert--success">Pendaftaran berhasil! Silakan masuk.</p>';
    this.#form.reset();
    setTimeout(() => { location.hash = '#/login'; }, 900);
  }

  registerFailed(message) {
    this.#statusRegion.innerHTML = `<p class="alert alert--error">${message}</p>`;
  }
}
