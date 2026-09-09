document.addEventListener('DOMContentLoaded', () => {
  const money = (n) => "$" + Number(n).toLocaleString("es-AR");

  const loginView = document.getElementById('loginView');
  const panelView = document.getElementById('panelView');
  const adminPass = document.getElementById('adminPass');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  const grid = document.getElementById('adminGrid');
  const filtersEl = document.getElementById('adminFilters');
  const newProductBtn = document.getElementById('newProductBtn');

  const overlay = document.getElementById('adminOverlay');
  const modal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const productForm = document.getElementById('productForm');
  const modalTitle = document.getElementById('modalTitle');
  const productError = document.getElementById('productError');
  const saveProductBtn = document.getElementById('saveProductBtn');

  const pId = document.getElementById('productId');
  const pName = document.getElementById('pName');
  const pDesc = document.getElementById('pDesc');
  const pPrice = document.getElementById('pPrice');
  const pCategory = document.getElementById('pCategory');
  const pImage = document.getElementById('pImage');
  const pImagePreview = document.getElementById('pImagePreview');
  const pActive = document.getElementById('pActive');

  let PRODUCTS = [];
  let activeCategory = 'todos';
  /* photoItems: lista ordenada de las fotos del producto que se está
     editando. Cada item es { type: 'url', value } para una foto que
     ya existía, o { type: 'file', value } (dataURL) para una foto
     nueva recién elegida. */
  let photoItems = [];

  /* ---------------------------------------------------------
     Toast simple (este panel no depende de main.js)
     --------------------------------------------------------- */
  function showToast(text) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  /* ---------------------------------------------------------
     Sesión (contraseña guardada en este navegador)
     --------------------------------------------------------- */
  const getPassword = () => sessionStorage.getItem('jfv-admin-pass') || '';
  const setPassword = (p) => sessionStorage.setItem('jfv-admin-pass', p);
  const clearPassword = () => sessionStorage.removeItem('jfv-admin-pass');

  /* ---------------------------------------------------------
     Categorías del <select>
     --------------------------------------------------------- */
  (typeof CATALOG_CATEGORIES !== 'undefined' ? CATALOG_CATEGORIES : []).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    pCategory.appendChild(opt);
  });

  /* ---------------------------------------------------------
     Llamadas a la API (Apps Script)
     --------------------------------------------------------- */
  async function apiGet() {
    const url = `${CATALOG_SHEET_URL}?admin=1&pass=${encodeURIComponent(getPassword())}&_=${Date.now()}`;
    const res = await fetch(url);
    return res.json();
  }
  async function apiPost(payload) {
    const res = await fetch(CATALOG_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, password: getPassword() })
    });
    return res.json();
  }

  /* ---------------------------------------------------------
     Login / logout
     --------------------------------------------------------- */
  function showPanel() {
    loginView.style.display = 'none';
    panelView.style.display = 'block';
    loadProducts();
  }
  function showLogin(msg) {
    panelView.style.display = 'none';
    loginView.style.display = 'flex';
    if (msg) {
      loginError.textContent = msg;
      loginError.classList.add('is-visible');
    }
  }

  loginBtn.addEventListener('click', async () => {
    const pass = adminPass.value.trim();
    if (!pass) return;
    setPassword(pass);
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando…';
    try {
      const data = await apiGet();
      if (Array.isArray(data)) {
        loginError.classList.remove('is-visible');
        showPanel();
      } else {
        clearPassword();
        showLogin('Contraseña incorrecta.');
      }
    } catch (err) {
      showLogin('No pudimos conectar. Revisá la URL configurada en js/products.js.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  });
  adminPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginBtn.click(); });

  logoutBtn.addEventListener('click', () => {
    clearPassword();
    showLogin();
  });

  /* ---------------------------------------------------------
     Listado de productos
     --------------------------------------------------------- */
  async function loadProducts() {
    grid.innerHTML = `<p style="padding:2em 0;color:var(--ink-soft);">Cargando productos…</p>`;
    try {
      const data = await apiGet();
      if (!Array.isArray(data)) { showLogin('Tu sesión expiró, ingresá de nuevo.'); return; }
      PRODUCTS = data;
      buildFilters();
      renderGrid();
    } catch (err) {
      grid.innerHTML = `<p style="padding:2em 0;color:var(--coral-deep);">No pudimos cargar los productos.</p>`;
    }
  }

  function buildFilters() {
    const present = new Set(PRODUCTS.map(p => p.category));
    const ordered = (typeof CATALOG_CATEGORIES !== 'undefined' ? CATALOG_CATEGORIES : []).filter(c => present.has(c));
    const extra = [...present].filter(c => !ordered.includes(c));
    const categories = ['todos', ...ordered, ...extra];

    filtersEl.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'chip' + (cat === activeCategory ? ' is-active' : '');
      btn.textContent = cat === 'todos' ? 'Todos' : cat;
      btn.addEventListener('click', () => {
        activeCategory = cat;
        filtersEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === btn));
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  function renderGrid() {
    const items = activeCategory === 'todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

    if (!items.length) {
      grid.innerHTML = `<p style="padding:2em 0;color:var(--ink-soft);">No hay productos acá todavía.</p>`;
      return;
    }

    grid.innerHTML = items.map(p => `
      <div class="product-card admin-card ${p.active ? '' : 'is-hidden-product'}" data-id="${p.id}">
        <div class="product-photo">
          <span class="product-cat">${p.category}</span>
          ${p.active ? '' : '<span class="hidden-badge">Oculto</span>'}
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}">`
            : `<div class="photo-slot"><span>Sin foto</span></div>`}
        </div>
        <div class="product-body">
          <h3>${p.name}</h3>
          <p class="desc">${p.desc || ''}</p>
          <p class="product-price">${money(p.price)}</p>
          <div class="admin-card-actions">
            <button class="btn btn-ghost btn-small edit-btn">Editar</button>
            <button class="btn btn-ghost btn-small toggle-btn">${p.active ? 'Ocultar' : 'Mostrar'}</button>
            <button class="btn btn-danger btn-small delete-btn">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.admin-card').forEach(card => {
      const id = card.dataset.id;
      const product = PRODUCTS.find(p => p.id === id);
      card.querySelector('.edit-btn').addEventListener('click', () => openModal(product));
      card.querySelector('.toggle-btn').addEventListener('click', () => toggleActive(product));
      card.querySelector('.delete-btn').addEventListener('click', () => deleteProductConfirm(product));
    });
  }

  /* ---------------------------------------------------------
     Modal de alta / edición
     --------------------------------------------------------- */
  function renderPhotoPreview() {
    if (!photoItems.length) {
      pImagePreview.innerHTML = '';
      return;
    }
    pImagePreview.innerHTML = photoItems.map((item, i) => `
      <div class="admin-photo-thumb" data-index="${i}">
        <img src="${item.value}" alt="">
        <button type="button" class="admin-photo-remove" aria-label="Quitar foto">✕</button>
      </div>
    `).join('');
    pImagePreview.querySelectorAll('.admin-photo-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.closest('.admin-photo-thumb').dataset.index);
        photoItems.splice(i, 1);
        renderPhotoPreview();
      });
    });
  }

  function openModal(product) {
    productError.classList.remove('is-visible');
    pImage.value = '';

    if (product) {
      modalTitle.textContent = 'Editar producto';
      pId.value = product.id;
      pName.value = product.name;
      pDesc.value = product.desc || '';
      pPrice.value = product.price;
      pCategory.value = product.category;
      pActive.checked = product.active;
      const images = (Array.isArray(product.images) && product.images.length)
        ? product.images
        : (product.image ? [product.image] : []);
      photoItems = images.map(url => ({ type: 'url', value: url }));
    } else {
      modalTitle.textContent = 'Nuevo producto';
      productForm.reset();
      pId.value = '';
      photoItems = [];
      pActive.checked = true;
    }
    renderPhotoPreview();
    modal.classList.add('is-open');
    overlay.classList.add('is-open');
  }
  function closeModal() {
    modal.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }
  newProductBtn.addEventListener('click', () => openModal(null));
  closeProductModal.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  pImage.addEventListener('change', () => {
    const files = Array.from(pImage.files || []);
    if (!files.length) return;

    let pending = files.length;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        photoItems.push({ type: 'file', value: reader.result });
        pending--;
        if (pending === 0) renderPhotoPreview();
      };
      reader.readAsDataURL(file);
    });

    pImage.value = ''; // permite elegir más fotos después sin perder las ya agregadas
  });

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    productError.classList.remove('is-visible');
    saveProductBtn.disabled = true;
    saveProductBtn.textContent = 'Guardando…';

    const payload = {
      action: pId.value ? 'update' : 'create',
      name: pName.value.trim(),
      desc: pDesc.value.trim(),
      price: Number(pPrice.value) || 0,
      category: pCategory.value,
      active: pActive.checked,
      imageUrls: photoItems.filter(i => i.type === 'url').map(i => i.value),
      imagesBase64: photoItems.filter(i => i.type === 'file').map(i => i.value),
    };
    if (pId.value) payload.id = pId.value;

    try {
      const res = await apiPost(payload);
      if (res.ok) {
        closeModal();
        await loadProducts();
        showToast('Producto guardado ✓');
      } else {
        productError.textContent = res.error || 'No pudimos guardar el producto.';
        productError.classList.add('is-visible');
      }
    } catch (err) {
      productError.textContent = 'Error de conexión. Probá de nuevo.';
      productError.classList.add('is-visible');
    } finally {
      saveProductBtn.disabled = false;
      saveProductBtn.textContent = 'Guardar producto';
    }
  });

  async function toggleActive(product) {
    await apiPost({ action: 'update', id: product.id, active: !product.active });
    showToast(product.active ? 'Producto ocultado' : 'Producto publicado');
    loadProducts();
  }

  async function deleteProductConfirm(product) {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    await apiPost({ action: 'delete', id: product.id });
    showToast('Producto eliminado');
    loadProducts();
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  if (getPassword()) {
    showPanel();
  } else {
    showLogin();
  }
});
