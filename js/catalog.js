document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     CONFIGURACIÓN — reemplazá por el número real del negocio
     en formato internacional, sin +, espacios ni guiones.
     Ej: Argentina, código de área 342, número 4123456 -> 5493424123456
     ========================================================= */
  const WHATSAPP_NUMBER = "3426396371";

  const money = (n) => "$" + Number(n).toLocaleString("es-AR");

  /* ---------------------------------------------------------
     Estado
     --------------------------------------------------------- */
  let cart = JSON.parse(localStorage.getItem("jfv-cart") || "{}");
  let PRODUCTS = [];
  let activeCategory = "todos";

  const saveCart = () => localStorage.setItem("jfv-cart", JSON.stringify(cart));
  const cartCount = () => Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = () => Object.values(cart).reduce((sum, item) => sum + item.qty * item.price, 0);

  const grid = document.getElementById('productGrid');
  const filtersEl = document.getElementById('filters');

  /* ---------------------------------------------------------
     Traer productos desde la Google Sheet
     --------------------------------------------------------- */
  function skeletonHTML() {
    return Array(6).fill(`
      <div class="skeleton-card">
        <div class="skeleton-photo"></div>
        <div class="skeleton-line" style="width:70%"></div>
        <div class="skeleton-line" style="width:40%"></div>
      </div>`).join('');
  }

  async function loadProducts() {
    grid.innerHTML = skeletonHTML();
    try {
      const res = await fetch(CATALOG_SHEET_URL);
      if (!res.ok) throw new Error('Respuesta no válida');
      const data = await res.json();
      PRODUCTS = Array.isArray(data) ? data : [];
      buildFilters();
      renderProducts();
    } catch (err) {
      grid.innerHTML = `<p style="color:var(--coral-deep); padding:2em 0;">
        No pudimos cargar el catálogo en este momento. Probá recargar la página en un rato.
      </p>`;
      console.error('Error cargando catálogo:', err);
    }
  }

  /* ---------------------------------------------------------
     Filtros por categoría (se arman solos según lo que haya
     cargado el dueño en la planilla)
     --------------------------------------------------------- */
  function buildFilters() {
    const present = new Set(PRODUCTS.map(p => p.category));
    const ordered = (typeof CATALOG_CATEGORIES !== 'undefined' ? CATALOG_CATEGORIES : []).filter(c => present.has(c));
    const extra = [...present].filter(c => !ordered.includes(c));
    const categories = ["todos", ...ordered, ...extra];
    filtersEl.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'chip' + (cat === 'todos' ? ' is-active' : '');
      btn.textContent = cat === 'todos' ? 'Todos' : cat;
      btn.dataset.cat = cat;
      btn.addEventListener('click', () => {
        activeCategory = cat;
        filtersEl.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === btn));
        renderProducts();
      });
      filtersEl.appendChild(btn);
    });
  }

  /* ---------------------------------------------------------
     Grilla de productos
     --------------------------------------------------------- */
  function productPhoto(p) {
    const images = (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []);

    if (!images.length) {
      return `<div class="photo-slot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>
        <span>Foto pendiente</span>
      </div>`;
    }

    if (images.length === 1) {
      return `<img src="${images[0]}" alt="${p.name}">`;
    }

    const slides = images.map(img => `<div class="photo-slide"><img src="${img}" alt="${p.name}"></div>`).join('');
    const dots = images.map((_, i) => `<span class="photo-dot${i === 0 ? ' is-active' : ''}"></span>`).join('');

    return `
      <div class="photo-carousel">
        <div class="photo-track">${slides}</div>
        <button type="button" class="photo-arrow prev" aria-label="Foto anterior">‹</button>
        <button type="button" class="photo-arrow next" aria-label="Foto siguiente">›</button>
        <div class="photo-dots">${dots}</div>
      </div>`;
  }

  function initCarousel(card) {
    const carousel = card.querySelector('.photo-carousel');
    if (!carousel) return;
    const track = carousel.querySelector('.photo-track');
    const slides = carousel.querySelectorAll('.photo-slide');
    const dots = carousel.querySelectorAll('.photo-dot');
    const total = slides.length;
    let index = 0;

    function go(i) {
      index = (i + total) % total;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
    }

    carousel.querySelector('.photo-arrow.prev').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(index - 1);
    });
    carousel.querySelector('.photo-arrow.next').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(index + 1);
    });
  }

  function renderProducts() {
    const items = activeCategory === 'todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

    if (!items.length) {
      grid.innerHTML = `<p style="color:var(--ink-soft); padding:2em 0;">No hay productos cargados todavía en esta categoría.</p>`;
      return;
    }

    grid.innerHTML = items.map(p => {
      const qty = cart[p.id]?.qty || 0;
      return `
      <div class="product-card reveal is-visible" data-id="${p.id}">
        <div class="product-photo">
          <span class="product-cat">${p.category}</span>
          ${productPhoto(p)}
        </div>
        <div class="product-body">
          <h3>${p.name}</h3>
          <p class="desc">${p.desc}</p>
          <p class="product-price">${money(p.price)}</p>
          <div class="product-actions">
            <div class="qty">
              <button class="qty-minus" aria-label="Restar">–</button>
              <span class="qty-value">${qty || 1}</span>
              <button class="qty-plus" aria-label="Sumar">+</button>
            </div>
            <button class="btn btn-primary btn-small add-btn">${qty ? 'Actualizar' : 'Agregar'}</button>
          </div>
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      const id = card.dataset.id;
      const product = PRODUCTS.find(p => p.id === id);
      const qtyEl = card.querySelector('.qty-value');
      let localQty = cart[id]?.qty || 1;

      card.querySelector('.qty-plus').addEventListener('click', () => {
        localQty++;
        qtyEl.textContent = localQty;
      });
      card.querySelector('.qty-minus').addEventListener('click', () => {
        localQty = Math.max(1, localQty - 1);
        qtyEl.textContent = localQty;
      });
      card.querySelector('.add-btn').addEventListener('click', () => {
        cart[id] = { id, name: product.name, price: product.price, image: product.image, qty: localQty };
        saveCart();
        flyToCart(card);
        window.JFV?.showToast(`Agregado: ${product.name}`);
        bounceBadge();
        renderCart();
        setTimeout(openCart, 350);
        card.querySelector('.add-btn').textContent = 'Actualizar';
      });

      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        window.JFV?.attachTilt(card, { max: 5, scale: 1.015 });
      }

      initCarousel(card);
    });
  }

  /* ---------------------------------------------------------
     Efecto "vuela al carrito"
     --------------------------------------------------------- */
  function flyToCart(cardEl) {
    const source = cardEl.querySelector('.product-photo img') || cardEl.querySelector('.product-photo');
    const fab = document.getElementById('cartFab');
    if (!source || !fab) return;
    const startRect = source.getBoundingClientRect();
    const endRect = fab.getBoundingClientRect();

    const clone = document.createElement('div');
    clone.className = 'fly-clone';
    clone.style.left = startRect.left + 'px';
    clone.style.top = startRect.top + 'px';
    clone.style.width = startRect.width + 'px';
    clone.style.height = startRect.height + 'px';
    clone.style.background = 'var(--coral)';
    clone.style.overflow = 'hidden';
    if (source.tagName === 'IMG') {
      const img = document.createElement('img');
      img.src = source.src;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      clone.appendChild(img);
    }
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
      const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(.12)`;
      clone.style.opacity = '0.3';
    });
    setTimeout(() => clone.remove(), 720);
  }

  function bounceBadge() {
    const badgeEl = document.getElementById('cartBadge');
    const fabEl = document.getElementById('cartFab');
    badgeEl && badgeEl.classList.remove('is-bouncing');
    fabEl && fabEl.classList.remove('is-pulsing');
    void badgeEl?.offsetWidth;
    badgeEl && badgeEl.classList.add('is-bouncing');
    fabEl && fabEl.classList.add('is-pulsing');
  }

  /* ---------------------------------------------------------
     Carrito (drawer)
     --------------------------------------------------------- */
  const cartFab = document.getElementById('cartFab');
  const cartBadge = document.getElementById('cartBadge');
  const cartDrawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function renderCart() {
    cartBadge.textContent = cartCount();
    const items = Object.values(cart);
    if (!items.length) {
      cartItemsEl.innerHTML = `<div class="cart-empty">Todavía no agregaste nada.<br>Elegí algo del catálogo ✂️</div>`;
      checkoutBtn.disabled = true;
    } else {
      cartItemsEl.innerHTML = items.map(item => `
        <div class="cart-line" data-id="${item.id}">
          <div class="thumb">${item.image ? `<img src="${item.image}" alt="${item.name}">` : '🖨️'}</div>
          <div class="info">
            <h4>${item.name}</h4>
            <div class="unit">${item.qty} x ${money(item.price)}</div>
          </div>
          <button class="remove" aria-label="Quitar">✕</button>
        </div>
      `).join('');
      checkoutBtn.disabled = false;

      cartItemsEl.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.closest('.cart-line').dataset.id;
          delete cart[id];
          saveCart();
          renderCart();
          renderProducts();
        });
      });
    }
    cartTotalEl.textContent = money(cartTotal());
  }

  function openCart() {
    cartDrawer.classList.add('is-open');
    overlay.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
  }
  function closeCart() {
    cartDrawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
  }

  cartFab.addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  overlay.addEventListener('click', () => { closeCart(); closeModal(); });

  /* ---------------------------------------------------------
     Modal de pedido
     --------------------------------------------------------- */
  const modal = document.getElementById('orderModal');
  const formView = document.getElementById('formView');
  const successView = document.getElementById('successView');
  const orderForm = document.getElementById('orderForm');
  const formError = document.getElementById('formError');

  function openModal() {
    closeCart();
    modal.classList.add('is-open');
    overlay.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('is-open');
    overlay.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    formView.style.display = 'block';
    successView.style.display = 'none';
    orderForm.reset();
    document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('is-selected'));
    formError.classList.remove('is-visible');
  }

  checkoutBtn.addEventListener('click', openModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('closeSuccess').addEventListener('click', closeModal);

  document.querySelectorAll('.pay-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('is-selected'));
      opt.classList.add('is-selected');
      opt.querySelector('input').checked = true;
    });
  });

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(orderForm);
    const firstName = data.get('firstName')?.trim();
    const lastName = data.get('lastName')?.trim();
    const phone = data.get('phone')?.trim();
    const email = data.get('email')?.trim();
    const payment = data.get('payment');

    if (!firstName || !lastName || !phone || !email || !payment) {
      formError.classList.add('is-visible');
      return;
    }
    formError.classList.remove('is-visible');

    const lines = Object.values(cart).map(i => `• ${i.qty} x ${i.name} — ${money(i.price * i.qty)}`).join('%0A');
    const message =
      `¡Hola JFV! Quiero hacer este pedido:%0A%0A${lines}%0A%0A` +
      `*Total:* ${money(cartTotal())}%0A%0A` +
      `*Nombre:* ${firstName} ${lastName}%0A` +
      `*Teléfono:* ${phone}%0A` +
      `*Email:* ${email}%0A` +
      `*Pago:* ${payment}`;

    formView.style.display = 'none';
    successView.style.display = 'block';

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');

    cart = {};
    saveCart();
    renderCart();
    renderProducts();
  });

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  loadProducts();
  renderCart();
});
