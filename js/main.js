// ================= VARIABLES =================
let productos = [];
let productosFiltrados = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ================= DOM =================
const contenedorProductos = document.getElementById("productos-container");
const botonesFiltro = document.querySelectorAll(".filter-btn");
const buscador = document.getElementById("search-input");

const cartSidebar = document.getElementById("cart-sidebar");
const overlay = document.getElementById("overlay");
const cartCount = document.getElementById("cart-count");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartDiscount = document.getElementById("cart-discount");
const couponInput = document.getElementById('coupon-input');
const applyCouponBtn = document.getElementById('apply-coupon');
const clearCartBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout-btn");
const cartIcon = document.querySelector(".cart-icon");

// ================= FETCH =================
const loader = document.getElementById("loader");
// ================= VISUAL EFFECTS & DOM =================
const initEffects = () => {
    if (window.AOS) {
        AOS.init({ once: true, duration: 600 });
    }

    const hero = document.getElementById('hero-decor');
    if (hero) {
        // create a few subtle floating orbs
        for (let i = 0; i < 6; i++) {
            const orb = document.createElement('div');
            orb.className = 'hero-orb';
            orb.style.left = `${10 + i * 12}%`;
            orb.style.top = `${10 + (i % 3) * 6}%`;
            orb.style.opacity = (0.04 + i * 0.01).toString();
            hero.appendChild(orb);
        }
    }

    if (window.tsParticles && document.getElementById('hero-particles')) {
        tsParticles.load('hero-particles', {
            fpsLimit: 60,
            particles: {
                number: { value: 40, density: { enable: true, area: 800 } },
                color: { value: '#ff3c00' },
                shape: { type: 'circle' },
                opacity: { value: 0.08 },
                size: { value: { min: 1, max: 4 } },
                move: { enable: true, speed: 0.6, direction: 'none', outModes: { default: 'out' } }
            },
            interactivity: { detectsOn: 'canvas', events: { onHover: { enable: false }, onClick: { enable: false } } },
            detectRetina: true
        });
    }
};

// Attach product-related button handlers
const activarBotones = () => {
    const botonesAgregar = document.querySelectorAll(".add-to-cart");
    botonesAgregar.forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            agregarAlCarrito(id);
        });
    });

    const wishButtons = document.querySelectorAll('.wish-btn');
    wishButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleFavorite(id, btn);
        });
    });

    const detailsButtons = document.querySelectorAll('.details-btn');
    detailsButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const producto = productos.find(p=>p.id === id);
            if (!producto) return;
            Swal.fire({
                title: producto.nombre,
                html: `<img src="${producto.imagen}" alt="${producto.nombre}" style="width:100%;border-radius:8px;margin-bottom:8px;" onerror="this.src='./img/placeholder.svg'">
                       <p>${producto.descripcion}</p>
                       <p><strong>Categoria:</strong> ${producto.categoria}</p>
                       <p><strong>Stock:</strong> ${producto.stock}</p>
                       <p><strong>Precio:</strong> $${producto.precio.toLocaleString()}</p>`,
                showCloseButton: true,
                focusConfirm: false,
                confirmButtonText: 'Cerrar'
            });
        });
    });
};

// Toggle favorite
const toggleFavorite = (id, btn) => {
    const fav = JSON.parse(localStorage.getItem('favoritos') || '[]');
    const idx = fav.indexOf(id);
    if (idx === -1) {
        fav.push(id);
        if (btn) { btn.textContent = '♥'; btn.setAttribute('aria-pressed','true'); }
    } else {
        fav.splice(idx,1);
        if (btn) { btn.textContent = '♡'; btn.setAttribute('aria-pressed','false'); }
    }
    localStorage.setItem('favoritos', JSON.stringify(fav));
};

const obtenerProductos = async () => {
    try {
        const response = await fetch("./data/productos.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        productos = await response.json();
        productosFiltrados = productos;

        renderProductos(productosFiltrados);
        actualizarTotal();

        loader.style.display = "none";
    } catch (error) {
        loader.style.display = "none";

        Swal.fire({ icon: "error", title: "Error cargando productos", text: error.message || 'Revise conexión' });
        productos = [];
        productosFiltrados = [];
        renderProductos(productosFiltrados);
    }
};

// ================= RENDER PRODUCTOS =================
function renderProductos(array) {
    contenedorProductos.innerHTML = "";
    if (array.length === 0) {
        contenedorProductos.innerHTML = `
            <p style="text-align:center; grid-column: 1/-1;">
                ❌ No se encontraron productos
            </p>
        `;
        return;
    }

    array.forEach(producto => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-once', 'true');
        card.setAttribute('tabindex', '0');

        const favList = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const isFav = favList.includes(producto.id);

        card.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='./img/placeholder.svg'">
            <div class="product-info">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <p class="stock ${producto.stock <= 5 ? "low" : ""}">${producto.stock <= 5 ? "⚠️ Poco stock" : "Disponible"}</p>
                <p class="product-price">$${producto.precio.toLocaleString()}</p>
                <div style="display:flex; gap:8px; margin-top:8px;">
                    <button class="add-to-cart" data-id="${producto.id}" ${producto.stock <= 0 ? 'disabled aria-disabled="true" title="Sin stock"' : ''}>Agregar al carrito</button>
                    <button class="wish-btn" data-id="${producto.id}" aria-pressed="${isFav}">${isFav ? '♥' : '♡'}</button>
                    <button class="details-btn" data-id="${producto.id}">Detalles</button>
                </div>
            </div>
        `;

        contenedorProductos.appendChild(card);
        if (window.VanillaTilt) VanillaTilt.init(card, { max: 6, speed: 400, glare: true, 'max-glare': 0.12 });
    });

    activarBotones();

    if (window.AOS) AOS.refresh();

}

// Agregar producto
const agregarAlCarrito = (id) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) {
        Swal.fire({
            icon: "warning",
            title: "Producto no encontrado",
            text: "El producto no existe en la base de datos"
        });
        return;
    }
    const existe = carrito.find(p => p.id === id);
    const qtyInCart = existe ? existe.cantidad : 0;
    if (qtyInCart + 1 > (producto.stock || 0)) {
        Toastify({ text: `No hay stock suficiente (${producto.stock} disponibles)`, duration: 2500, gravity: 'top', position: 'right', style: { background: 'linear-gradient(to right, #333, #555)' } }).showToast();
        return;
    }

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen, cantidad: 1 });
    }

    guardarCarrito();
    renderCarrito();

    Toastify({
    text: `🔥 ${producto.nombre} agregado`,
    duration: 2000,
    gravity: "top",
    position: "right",
    style: {
        background: "linear-gradient(to right, #ff3c00, #ff7a00)"
    }
}).showToast();
};

// Render carrito
const renderCarrito = () => {
    cartItemsContainer.innerHTML = "";

    carrito.forEach(producto => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        const prodData = productos.find(p => p.id === producto.id) || {};
        const plusDisabled = prodData.stock && producto.cantidad >= prodData.stock ? 'disabled aria-disabled="true" title="Máximo stock"' : '';
        div.innerHTML = `
            <div class="cart-thumb">
                <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='./img/placeholder.svg'">
            </div>
            <div class="item-details">
                <h4>${producto.nombre}</h4>
                <p class="product-price">$${producto.precio.toLocaleString()}</p>
                <p class="item-subtotal">Subtotal: $${(producto.precio * producto.cantidad).toLocaleString()}</p>
            </div>
            <div class="item-actions">
                <div class="qty-controls">
                    <button class="qty-btn minus" data-id="${producto.id}" aria-label="disminuir cantidad">-</button>
                    <span class="qty">${producto.cantidad}</span>
                    <button class="qty-btn plus" data-id="${producto.id}" aria-label="aumentar cantidad" ${plusDisabled}>+</button>
                </div>
                <button class="remove-btn" data-id="${producto.id}" aria-label="eliminar producto">Eliminar</button>
            </div>
        `;

        cartItemsContainer.appendChild(div);
    });

    // Botones eliminar y cantidad
    const botonesEliminar = document.querySelectorAll(".remove-btn");
    botonesEliminar.forEach(btn => {
        btn.addEventListener("click", () => {
            eliminarProducto(parseInt(btn.dataset.id));
        });
    });

    const botonesMas = document.querySelectorAll(".qty-btn.plus");
    botonesMas.forEach(btn => {
        btn.addEventListener("click", () => {
            cambiarCantidad(parseInt(btn.dataset.id), 1);
        });
    });

    const botonesMenos = document.querySelectorAll(".qty-btn.minus");
    botonesMenos.forEach(btn => {
        btn.addEventListener("click", () => {
            cambiarCantidad(parseInt(btn.dataset.id), -1);
        });
    });

    actualizarTotal();
};

const cambiarCantidad = (id, cambio) => {
    const item = carrito.find(p => p.id === id);
    if (!item) return;
    const producto = productos.find(p => p.id === id);
    if (cambio > 0 && producto && item.cantidad + cambio > (producto.stock || 0)) {
        Toastify({ text: `No puedes agregar más. Stock: ${producto.stock}`, duration: 2200, gravity: 'top', position: 'right', style: { background: 'linear-gradient(to right, #333, #555)' } }).showToast();
        return;
    }
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
        eliminarProducto(id);
        return;
    }
    guardarCarrito();
    renderCarrito();
};

// Eliminar producto
const eliminarProducto = (id) => {
    carrito = carrito.filter(p => p.id !== id);
    guardarCarrito();
    renderCarrito();
};

// Vaciar carrito
clearCartBtn.addEventListener("click", () => {
    carrito = [];
    guardarCarrito();
    renderCarrito();

    Swal.fire({
        icon: "warning",
        title: "Carrito vaciado"
    });
});

// Total + contador
const actualizarTotal = () => {
    const subtotal = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    const coupon = JSON.parse(localStorage.getItem('cartCoupon') || 'null');
    let discount = 0;
    if (coupon && coupon.code === 'FLAMAGAMER10') {
        discount = Math.round(subtotal * 0.10);
    }
    const total = Math.max(0, subtotal - discount);

    if (cartSubtotal) cartSubtotal.textContent = subtotal.toLocaleString();
    if (cartDiscount) cartDiscount.textContent = discount.toLocaleString();
    if (cartTotal) cartTotal.textContent = total.toLocaleString();

    const cantidad = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    if (cartCount) cartCount.textContent = cantidad;
};

// Coupon apply
const applyCoupon = () => {
    const code = couponInput ? couponInput.value.trim().toUpperCase() : '';
    if (code === 'FLAMAGAMER10') {
        localStorage.setItem('cartCoupon', JSON.stringify({ code: 'FLAMAGAMER10', appliedAt: Date.now() }));
        showToast('Cupón aplicado: 10% OFF');
    } else {
        localStorage.removeItem('cartCoupon');
        showToast('Cupón inválido', 'linear-gradient(to right,#333,#555)');
    }
    actualizarTotal();
};

if (applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);
if (couponInput) couponInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') applyCoupon(); });

// Guardar en localStorage
const guardarCarrito = () => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
};

// ================= CHECKOUT =================
checkoutBtn.addEventListener("click", async () => {
    if (carrito.length === 0) {
        Swal.fire({ icon: "info", title: "El carrito está vacío" });
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: 'Checkout',
        html:
            '<input id="swal-name" class="swal2-input" placeholder="Nombre completo">' +
            '<input id="swal-email" class="swal2-input" placeholder="Email">' +
            '<input id="swal-address" class="swal2-input" placeholder="Dirección de envío">' +
            '<input id="swal-card" class="swal2-input" placeholder="Tarjeta (XXXX-XXXX-XXXX-XXXX)">',
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            const name = document.getElementById('swal-name').value.trim();
            const email = document.getElementById('swal-email').value.trim();
            const address = document.getElementById('swal-address').value.trim();
            const card = document.getElementById('swal-card').value.trim();

            if (!name || !email || !address || !card) {
                Swal.showValidationMessage('Completa todos los campos');
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.showValidationMessage('Ingresa un email válido');
                return false;
            }
            return { name, email, address, card };
        }
    });

    if (formValues) {
        // save order
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const total = carrito.reduce((acc,p)=>acc + p.precio * p.cantidad,0);
        const order = { id: Date.now(), items: carrito, total, customer: formValues, date: new Date().toISOString() };
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        carrito = [];
        guardarCarrito();
        renderCarrito();

        Swal.fire({ icon: 'success', title: 'Compra realizada 🔥', text: 'Tu orden fue procesada.' });
    }
});

// ================= UI CARRITO =================
cartIcon.addEventListener("click", () => {
    cartSidebar.classList.add("active");
    overlay.classList.add("active");
});

overlay.addEventListener("click", () => {
    cartSidebar.classList.remove("active");
    overlay.classList.remove("active");
});

// ================= FILTROS =================
botonesFiltro.forEach(boton => {
    boton.addEventListener("click", () => {
        // marcar activo y limpiar buscador
        botonesFiltro.forEach(b => b.classList.remove("active"));
        boton.classList.add("active");
        buscador.value = '';

        const categoria = boton.dataset.categoria;

        if (categoria === "todos") {
            productosFiltrados = productos;
        } else {
            productosFiltrados = productos.filter(p => p.categoria === categoria);
        }

        renderProductos(productosFiltrados);
    });
});

// ================= BUSCADOR =================
buscador.addEventListener("input", (e) => {
    const valor = e.target.value.toLowerCase();

    productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(valor)
    );

    renderProductos(productosFiltrados);
});

// ================= INIT =================
// Header controls: sorting, favorites and theme
const sortSelect = document.getElementById('sort-select');
if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'price-asc') productosFiltrados.sort((a,b)=>a.precio-b.precio);
        else if (val === 'price-desc') productosFiltrados.sort((a,b)=>b.precio-a.precio);
        else if (val === 'alpha') productosFiltrados.sort((a,b)=>a.nombre.localeCompare(b.nombre));
        else productosFiltrados = productos.slice();
        renderProductos(productosFiltrados);
    });
}

const openFavBtn = document.getElementById('open-favorites');
if (openFavBtn) openFavBtn.addEventListener('click', ()=> window.location.href = './favorites.html');

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) themeToggle.addEventListener('click', ()=>{
    const root = document.documentElement;
    const palette = [
        {accent:'#ff3c00', hover:'#ff5c2b'}, // red
        {accent:'#28b463', hover:'#23a455'}, // green
        {accent:'#00e5ff', hover:'#00bcd4'}  // blue
    ];
    const current = (root.style.getPropertyValue('--accent') || getComputedStyle(root).getPropertyValue('--accent')).trim();
    let idx = palette.findIndex(p => p.accent.toLowerCase() === current.toLowerCase());
    if (idx === -1) idx = 0;
    idx = (idx + 1) % palette.length;
    root.style.setProperty('--accent', palette[idx].accent);
    root.style.setProperty('--accent-hover', palette[idx].hover);
});

initEffects();
obtenerProductos();
renderCarrito();