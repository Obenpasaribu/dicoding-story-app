import { getActiveRoute } from '../routes/url-parser.js';
import { resolveRoute } from '../routes/routes.js';
import { transitionHelper } from '../utils/index.js';
import AuthRepository from '../data/auth-repository.js';
import {
  isPushNotificationSupported,
  getExistingSubscription,
  subscribePushNotification,
} from '../utils/push-notification.js';

export default class App {
  #content;
  #drawerButton;
  #navigationDrawer;
  #navList;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content, navList }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#navList = navList;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', String(isOpen));
    });

    document.body.addEventListener('click', (event) => {
      const clickInsideDrawer = this.#navigationDrawer.contains(event.target);
      const clickOnButton = this.#drawerButton.contains(event.target);
      if (!clickInsideDrawer && !clickOnButton) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  async #renderNav() {
    const isLoggedIn = AuthRepository.isLoggedIn();
    const userName = AuthRepository.getUserName();

    this.#navList.innerHTML = '';

    const items = isLoggedIn
      ? [
          { type: 'link', href: '#/', label: 'Beranda' },
          { type: 'link', href: '#/add', label: 'Tambah Story' },
          { type: 'link', href: '#/saved', label: 'Story Tersimpan' },
          { type: 'text', label: userName ? `Halo, ${userName}` : '' },
        ]
      : [
          { type: 'link', href: '#/login', label: 'Masuk' },
          { type: 'link', href: '#/register', label: 'Daftar' },
        ];

    if (isLoggedIn && isPushNotificationSupported()) {
      const subscription = await getExistingSubscription();
      if (!subscription) {
        items.push({ type: 'button', label: 'Aktifkan Notifikasi', action: 'subscribe-push' });
      }
    }

    if (isLoggedIn) {
      items.push({ type: 'button', label: 'Keluar', action: 'logout' });
    }

    items.forEach((item) => {
      if (!item.label) return;
      const li = document.createElement('li');
      if (item.type === 'link') {
        li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
      } else if (item.type === 'button') {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = item.label;
        if (item.action === 'subscribe-push') {
          button.addEventListener('click', () => this.#handleSubscribePush(button));
        } else {
          button.addEventListener('click', () => this.#handleLogout());
        }
        li.appendChild(button);
      } else {
        li.textContent = item.label;
        li.style.opacity = '0.75';
        li.style.padding = '0.8rem';
      }
      this.#navList.appendChild(li);
    });
  }

  async #handleSubscribePush(button) {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Memproses...';
    try {
      const token = AuthRepository.getAccessToken();
      await subscribePushNotification({ token });
      button.textContent = 'Notifikasi aktif';
    } catch (error) {
      button.disabled = false;
      button.textContent = originalLabel;
      window.alert(error.message || 'Gagal mengaktifkan notifikasi. Coba lagi.');
    }
  }

  #handleLogout() {
    AuthRepository.removeAccessToken();
    this.#navigationDrawer.classList.remove('open');
    location.hash = '#/login';
  }

  async renderPage() {
    const pathname = getActiveRoute();
    const { page: createPage, auth } = resolveRoute(pathname);
    const isLoggedIn = AuthRepository.isLoggedIn();

    if (auth === 'required' && !isLoggedIn) {
      location.hash = '#/login';
      return;
    }
    if (auth === 'guest-only' && isLoggedIn) {
      location.hash = '#/';
      return;
    }

    const page = createPage();

    const transition = transitionHelper({
      updateDOM: async () => {
        if (this.#currentPage && typeof this.#currentPage.destroy === 'function') {
          this.#currentPage.destroy();
        }
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this.#currentPage = page;
      },
    });

    transition.ready.catch(() => {
      /* browser tanpa View Transition API — fallback sudah ditangani di transitionHelper */
    });

    await transition.updateCallbackDone;
    await this.#renderNav();
  }
}
