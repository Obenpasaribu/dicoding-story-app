import '../styles/styles.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import App from './pages/app.js';

// Perbaikan path ikon marker default Leaflet ketika di-bundle webpack.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

document.addEventListener('DOMContentLoaded', () => {
  const app = new App({
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    navigationDrawer: document.getElementById('navigation-drawer'),
    navList: document.getElementById('nav-list'),
  });

  window.addEventListener('hashchange', () => app.renderPage());
  window.addEventListener('load', () => app.renderPage());
});

// Kriteria 2 & 3 — daftarkan service worker untuk app-shell offline caching
// dan penanganan push notification.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .catch((error) => console.error('Pendaftaran service worker gagal:', error));
  });
}
