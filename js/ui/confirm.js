// Sayfa içi onay penceresi. Tarayıcının confirm() penceresi bazı gömülü tarayıcılarda ve
// mobil web görünümlerinde engellenip anında "hayır" döndürdüğü için kendi penceremizi kullanıyoruz.
export function askConfirm(text, { ok = 'Evet', cancel = 'Vazgeç', danger = false } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'confirm';
    el.innerHTML = `<div class="confirm-box" role="dialog" aria-modal="true"><p></p>
      <div class="actions"><button class="btn" data-no></button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes></button></div></div>`;
    el.querySelector('p').textContent = text;
    el.querySelector('[data-no]').textContent = cancel;
    el.querySelector('[data-yes]').textContent = ok;
    const key = (e) => {
      if (e.key === 'Escape') done(false);
      else if (e.key === 'Enter') done(true);
    };
    const done = (v) => {
      el.remove();
      document.removeEventListener('keydown', key);
      resolve(v);
    };
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === el || e.target.closest('[data-no]')) done(false);
      else if (e.target.closest('[data-yes]')) done(true);
    });
    document.addEventListener('keydown', key);
    document.body.appendChild(el);
    el.querySelector('[data-yes]').focus();
  });
}
