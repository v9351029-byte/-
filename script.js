// script.js - Логика магазина

// Инициализация корзины из localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Обновление иконки корзины в шапке на всех страницах
function updateCartIcon() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        countEl.textContent = totalItems;
    }
}

// Сохранение корзины
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
}

// Добавление товара в корзину
function addToCart(productId, qty = 1) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, img: product.images[0], qty: qty });
    }
    saveCart();
    alert(`${product.name} добавлен в корзину!`);
}

// Удаление товара из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartPage(); // Перерисовываем корзину
}

// Изменение количества в корзине
function changeQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            renderCartPage();
        }
    }
}

// Рендер карточки товара (используется на главной и в каталоге)
function renderProductCard(product, isCatalog = false) {
    const stars = '★'.repeat(Math.floor(product.rating)) + (product.rating % 1 ? '☆' : '');
    return `
        <div class="card">
            <div class="card-img">${product.images[0]}</div>
            <div class="card-body">
                <h3>${product.name}</h3>
                <div class="rating">${stars} (${product.rating})</div>
                <div class="price">${product.price} ₽</div>
                ${isCatalog ? 
                    `<a href="product.html?id=${product.id}" class="btn" style="text-align:center; display:block; background:var(--primary); color:var(--secondary); margin-bottom:0.5rem;">Подробнее</a>` : 
                    ''}
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">В корзину</button>
            </div>
        </div>
    `;
}

// ================== ГЛАВНАЯ СТРАНИЦА ==================
function initIndex() {
    const popularGrid = document.getElementById('popular-products');
    if (!popularGrid) return;
    
    // Выводим 6 случайных популярных товаров
    const popular = productsData.sort(() => 0.5 - Math.random()).slice(0, 6);
    popularGrid.innerHTML = popular.map(p => renderProductCard(p, false)).join('');
}

// ================== КАТАЛОГ ==================
let catalogState = {
    category: 'all',
    minPrice: 0,
    maxPrice: 99999,
    sort: 'default',
    page: 1
};

function initCatalog() {
    if (!document.getElementById('catalog-grid')) return;
    
    // Обработчики фильтров
    document.querySelectorAll('.sidebar a[data-cat]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            catalogState.category = e.target.dataset.cat;
            catalogState.page = 1;
            renderCatalog();
        });
    });

    document.getElementById('apply-filter').addEventListener('click', () => {
        catalogState.minPrice = parseInt(document.getElementById('min-price').value) || 0;
        catalogState.maxPrice = parseInt(document.getElementById('max-price').value) || 99999;
        catalogState.page = 1;
        renderCatalog();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
        catalogState.sort = e.target.value;
        catalogState.page = 1;
        renderCatalog();
    });

    renderCatalog();
}

function renderCatalog() {
    let filtered = productsData.filter(p => {
        const catMatch = catalogState.category === 'all' || p.category === catalogState.category || p.subcategory === catalogState.category;
        const priceMatch = p.price >= catalogState.minPrice && p.price <= catalogState.maxPrice;
        return catMatch && priceMatch;
    });

    // Сортировка
    if (catalogState.sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (catalogState.sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (catalogState.sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

    // Пагинация (по 6)
    const perPage = 6;
    const totalPages = Math.ceil(filtered.length / perPage);
    const pageItems = filtered.slice((catalogState.page - 1) * perPage, catalogState.page * perPage);

    
    const grid = document.getElementById('catalog-grid');
    if(pageItems.length === 0) {
        grid.innerHTML = "<p>Товары не найдены.</p>";
    } else {
        grid.innerHTML = pageItems.map(p => renderProductCard(p, true)).join('');
    }

    // Рендер пагинации
    const pagEl = document.getElementById('pagination');
    pagEl.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        pagEl.innerHTML += `<button class="${i === catalogState.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
}

function goToPage(page) {
    catalogState.page = page;
    renderCatalog();
    window.scrollTo(0, 0);
}

// ================== СТРАНИЦА ТОВАРА ==================
function initProduct() {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const product = productsData.find(p => p.id === id);

    if (!product) {
        container.innerHTML = "<h1>Товар не найден</h1>";
        return;
    }

    document.title = `${product.name} - Медовая пасека`;

    // Рендер характеристики
    let charRows = Object.entries(product.characteristics).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

    container.innerHTML = `
        <div class="gallery">
            <div class="main-image" id="main-img">${product.images[0]}</div>
            <div class="thumbnails">
                ${product.images.map((img, i) => `<div class="thumb ${i===0?'active':''}" onclick="changeImg(this, '${img}')">${img}</div>`).join('')}
            </div>
        </div>
        <div class="detail-info">
            <h1>${product.name}</h1>
            <div class="rating">${'★'.repeat(Math.floor(product.rating))} (${product.rating})</div>
            <div class="price">${product.price} ₽</div>
            <p>${product.description}</p>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="changeDetailQty(-1)">-</button>
                <input type="number" id="qty-input" value="1" min="1" class="qty-input" readonly>
                <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
            </div>
            <button class="btn" onclick="addToCartFromDetail(${product.id})">Добавить в корзину</button>
            <h3 style="margin-top:2rem;">Характеристики</h3>
            <table class="char-table">${charRows}</table>
        </div>
    `;

    // Похожие товары (той же категории)
    const similar = productsData.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    const simGrid = document.getElementById('similar-grid');
    if (simGrid && similar.length > 0) {
        simGrid.innerHTML = similar.map(p => renderProductCard(p, true)).join('');
    }
}

function changeImg(el, img) {
    document.getElementById('main-img').textContent = img;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function changeDetailQty(delta) {
    const input = document.getElementById('qty-input');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    input.value = val;
}

function addToCartFromDetail(id) {
    const qty = parseInt(document.getElementById('qty-input').value);
    addToCart(id, qty);
}

// ================== КОРЗИНА ==================
let promoApplied = false;

function initCart() {
    if (!document.getElementById('cart-container')) return;
    renderCartPage();
}

function renderCartPage() {
    const container = document.getElementById('cart-container');
    const summary = document.getElementById('cart-summary');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty">Ваша корзина пуста 🍯</div>';
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'block';
    
    container.innerHTML = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Товар</th>
                    <th>Цена</th>
                    <th>Количество</th>
                    <th>Сумма</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${cart.map(item => `
                    <tr>
                        <td data-label="Товар"><span class="cart-item-img">${item.img}</span> ${item.name}</td>
                        <td data-label="Цена">${item.price} ₽</td>
                        <td data-label="Количество">
                            <div class="cart-qty">
                                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                                <span>${item.qty}</span>
                                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                            </div>
                        </td>
                        <td data-label="Сумма"><strong>${item.price * item.qty} ₽</strong></td>
                        <td><button class="cart-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    calculateTotal();
}

function applyPromo() {
    const code = document.getElementById('promo-input').value.trim();
    if (code === 'HONEY10') {
        promoApplied = true;
        alert('Промокод применен! Скидка 10%');
        calculateTotal();
    } else {
        alert('Неверный промокод');
    }
}

function calculateTotal() {
    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (promoApplied) total = total * 0.9; // Скидка 10%
    document.getElementById('total-price').textContent = `${Math.round(total)} ₽`;
}

// Оформление заказа
function checkout() {
    document.getElementById('checkout-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('checkout-modal').classList.remove('active');
}

function submitOrder(event) {
    event.preventDefault();
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    
    // Валидация
    if (!name || !phone || !address) {
        alert('Заполните все обязательные поля!');
        return;
    }
    if (!/^[\d\+\-\(\)\s]+$/.test(phone)) {
        alert('Неверный формат телефона');
        return;
    }

    alert(`Спасибо за заказ, ${name}! Мы свяжемся с вами по телефону ${phone}.`);
    cart = [];
    promoApplied = false;
    saveCart();
    closeModal();
    renderCartPage();
}

// ================== КОНТАКТЫ И ВАЛИДАЦИЯ ==================
function initContacts() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let valid = true;
        
        // Очистка ошибок
        form.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
        
        const name = document.getElementById('c-name').value;
        const phone = document.getElementById('c-phone').value;
        const msg = document.getElementById('c-msg').value;

        if (!name) {
            document.getElementById('err-name').style.display = 'block';
            valid = false;
        }
        if (!phone || !/^[\d\+\-\(\)\s]+$/.test(phone)) {
            document.getElementById('err-phone').style.display = 'block';
            valid = false;
        }
        if (!msg) {
            document.getElementById('err-msg').style.display = 'block';
            valid = false;
        }

        if (valid) {
            alert('Сообщение отправлено! Мы ответим вам в ближайшее время.');
            form.reset();
        }
    });
}

// ================== ОБЩАЯ ИНИЦИАЛИЗАЦИЯ ==================
document.addEventListener('DOMContentLoaded', () => {
    // Меню гамбургер
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Обновление иконки корзины при загрузке любой страницы
    updateCartIcon();

    // Определение текущей страницы и запуск нужных скриптов
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/')) initIndex();
    if (path.includes('catalog.html')) initCatalog();
    if (path.includes('product.html')) initProduct();
    if (path.includes('cart.html')) initCart();
    if (path.includes('contacts.html')) initContacts();
});