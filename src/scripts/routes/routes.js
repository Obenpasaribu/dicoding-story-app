import HomePage from '../pages/home/home-page.js';
import LoginPage from '../pages/login/login-page.js';
import RegisterPage from '../pages/register/register-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';
import SavedStoriesPage from '../pages/saved/saved-page.js';
import NotFoundPage from '../pages/not-found/not-found-page.js';

/**
 * `auth` menentukan aturan akses:
 * - 'required'  : hanya bisa diakses jika sudah login
 * - 'guest-only': hanya bisa diakses jika BELUM login (login/register)
 * - 'public'    : bebas diakses
 */
const routes = {
  '/': { page: () => new HomePage(), auth: 'required' },
  '/login': { page: () => new LoginPage(), auth: 'guest-only' },
  '/register': { page: () => new RegisterPage(), auth: 'guest-only' },
  '/add': { page: () => new AddStoryPage(), auth: 'required' },
  '/saved': { page: () => new SavedStoriesPage(), auth: 'required' },
};

export function resolveRoute(pathname) {
  return routes[pathname] ?? { page: () => new NotFoundPage(), auth: 'public' };
}

export default routes;
