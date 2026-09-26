export default class NotFoundPage {
  async render() {
    return `
      <section class="page-intro">
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat yang kamu tuju tidak tersedia. <a href="#/">Kembali ke beranda</a>.</p>
      </section>
    `;
  }

  async afterRender() {
    // tidak ada logika tambahan
  }
}
