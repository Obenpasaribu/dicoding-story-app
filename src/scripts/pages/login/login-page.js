import LoginPresenter from './login-presenter.js';
import StoryApi from '../../data/story-api.js';
import AuthRepository from '../../data/auth-repository.js';

export default class LoginPage {
  #presenter;
  #form;
  #submitButton;
  #statusRegion;

  async render() {
    return `
      <section class="page-intro">
        <h1>Masuk</h1>
        <p>Masuk untuk melihat dan membagikan story seputar Dicoding.</p>
      </section>

      <div class="form-card">
        <div id="login-status" aria-live="polite"></div>
        <form id="login-form" novalidate>
          <div class="field">
            <label for="email-input">Email</label>
            <input type="email" id="email-input" name="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="password-input">Kata sandi</label>
            <input type="password" id="password-input" name="password" autocomplete="current-password" minlength="8" required />
            <small>Minimal 8 karakter.</small>
          </div>
          <button type="submit" class="button" id="login-submit">Masuk</button>
        </form>
        <p style="margin-top:1rem;">Belum punya akun? <a href="#/register">Daftar di sini</a>.</p>
      </div>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({ view: this, model: StoryApi, authModel: AuthRepository });
    this.#form = document.getElementById('login-form');
    this.#submitButton = document.getElementById('login-submit');
    this.#statusRegion = document.getElementById('login-status');

    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.#statusRegion.innerHTML = '';

      const email = document.getElementById('email-input').value.trim();
      const password = document.getElementById('password-input').value;

      if (!email || password.length < 8) {
        this.loginFailed('Isi email dengan benar dan kata sandi minimal 8 karakter.');
        return;
      }

      await this.#presenter.login({ email, password });
    });
  }

  showSubmitLoading() {
    this.#submitButton.disabled = true;
    this.#submitButton.textContent = 'Memproses...';
  }

  hideSubmitLoading() {
    this.#submitButton.disabled = false;
    this.#submitButton.textContent = 'Masuk';
  }

  loginSuccess() {
    this.#statusRegion.innerHTML = '<p class="alert alert--success">Berhasil masuk, mengalihkan...</p>';
    location.hash = '#/';
  }

  loginFailed(message) {
    this.#statusRegion.innerHTML = `<p class="alert alert--error">${message}</p>`;
  }
}
