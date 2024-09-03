// Definisci cart come variabile globale
let cart = {};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    showWelcomePopup();
});

function showWelcomePopup() {
    document.getElementById('welcomePopupOverlay').style.display = 'flex';
    document.getElementById('welcomePopup').style.display = 'block';
}

function closeWelcomePopup() {
    document.getElementById('welcomePopupOverlay').style.display = 'none';
    document.getElementById('welcomePopup').style.display = 'none';
}

// Aggiungi questo evento per chiudere il popup quando si clicca sull'overlay
document.getElementById('welcomePopupOverlay').addEventListener('click', closeWelcomePopup);

function initApp() {
    const categoriesContainer = document.getElementById('categories');
    const productGrid = document.getElementById('productGrid');
    const sendOrderBtn = document.getElementById('sendOrder');
    const confirmationScreen = document.getElementById('confirmationScreen');
    const sendWhatsAppBtn = document.getElementById('sendWhatsApp');

    // Rimuovi questa riga: let cart = {};

    function renderCategories() {
        const categories = [...new Set(products.map(p => p.category))];
        categoriesContainer.innerHTML = categories.map(category => 
            `<button class="category-btn" data-category="${category}">${category}</button>`
        ).join('');
        categoriesContainer.querySelector('.category-btn').classList.add('active');
    }

    function renderProductsForCategory(category) {
        const categoryProducts = products.filter(p => p.category === category);
        productGrid.innerHTML = categoryProducts.map(product => `
            <div class="product-card ${cart[product.id] > 0 ? 'selected' : ''}" data-id="${product.id}">
                <h4>${product.name}</h4>
                ${cart[product.id] > 0 ? `<span class="selected-quantity">${cart[product.id]}</span>` : ''}
            </div>
        `).join('');
    }

    function updateProductCard(productId, quantity) {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (productCard) {
            if (quantity > 0) {
                productCard.classList.add('selected');
                productCard.innerHTML = `
                    <h4>${products.find(p => p.id === productId).name}</h4>
                    <span class="selected-quantity">${quantity}</span>
                `;
            } else {
                productCard.classList.remove('selected');
                productCard.innerHTML = `<h4>${products.find(p => p.id === productId).name}</h4>`;
            }
        }
    }

    function updateCart(productId, quantity) {
        cart[productId] = quantity;
        if (cart[productId] <= 0) delete cart[productId];
        updateProductCard(productId, quantity);
    }

    function getOrderSummary() {
        const className = document.getElementById('className').value;
        let orderText = `Classe: ${className}\n\n`;
        Object.entries(cart).forEach(([id, quantity]) => {
            const product = products.find(p => p.id === parseInt(id));
            orderText += `${quantity}x ${product.name}\n`;
        });
        const total = calculateOrderTotal();
        orderText += `\nTotale: €${total.toFixed(2)}`;
        return orderText.trim();
    }

    function openProductPopup(product) {
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'popup-overlay';
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.innerHTML = `
            <div class="popup-content">
                <h3>${product.name}</h3>
                <p>Prezzo: €${product.price.toFixed(2)}</p>
                <div class="quantity-selector">
                    <button class="quantity-btn minus">-</button>
                    <span class="quantity">${cart[product.id] || 1}</span>
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="btn add-to-cart">Aggiungi al carrello</button>
            </div>
        `;
        popupOverlay.appendChild(popup);
        document.body.appendChild(popupOverlay);

        const quantityElement = popup.querySelector('.quantity');
        const minusBtn = popup.querySelector('.minus');
        const plusBtn = popup.querySelector('.plus');
        const addToCartBtn = popup.querySelector('.add-to-cart');

        minusBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityElement.textContent);
            if (quantity > 1) {
                quantityElement.textContent = quantity - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityElement.textContent);
            quantityElement.textContent = quantity + 1;
        });

        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityElement.textContent);
            updateCart(product.id, quantity);
            closeProductPopup();
        });

        function closeProductPopup() {
            document.body.removeChild(popupOverlay);
        }

        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closeProductPopup();
            }
        });

        popupOverlay.style.display = 'flex';
        popup.style.display = 'block';
    }

    categoriesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            categoriesContainer.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderProductsForCategory(e.target.dataset.category);
        }
    });

    productGrid.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = parseInt(productCard.dataset.id);
            const product = products.find(p => p.id === productId);
            if (product) {
                openProductPopup(product);
            }
        }
    });

    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000); // Il messaggio scomparirà dopo 3 secondi
    }

    function validateClass(className) {
        // Verifica che la classe abbia almeno 1 numero e 3 lettere
        const regex = /^(?=.*\d)(?=.*[A-Za-z]{3,})[A-Za-z\d]{4,}$/;
        return regex.test(className);
    }

    sendOrderBtn.addEventListener('click', () => {
        const className = document.getElementById('className').value.trim();
        if (!className) {
            showError('Per favore, inserisci la tua classe prima di inviare l\'ordine.');
            return;
        }
        
        if (!validateClass(className)) {
            showError('Classe non valida');
            return;
        }
        
        // Verifica se il carrello è vuoto
        if (Object.keys(cart).length === 0) {
            showError('Seleziona almeno un prodotto per inviare il tuo ordine.');
            return;
        }
        
        showConfirmationScreen();
    });

    sendWhatsAppBtn.addEventListener('click', () => {
        const orderSummary = getOrderSummary();
        const encodedMessage = encodeURIComponent(orderSummary);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    });

    renderCategories();
    renderProductsForCategory(products[0].category);

    // Modifica questa parte
    const developerLink = document.getElementById('developerLink');
    if (developerLink) {
        developerLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://www.instagram.com/alessio.durbano/', '_blank');
        });
    } else {
        console.error("Elemento 'developerLink' non trovato");
    }
}

function showConfirmationScreen() {
    const total = calculateOrderTotal();
    document.getElementById('orderTotal').textContent = `Totale: €${total.toFixed(2)}`;
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('confirmationScreen').style.display = 'block';
}

function calculateOrderTotal() {
    let total = 0;
    Object.entries(cart).forEach(([id, quantity]) => {
        const product = products.find(p => p.id === parseInt(id));
        total += product.price * quantity;
    });
    return total;
}

const products = [
    { id: 1, name: 'Panino semplice Salame', price: 1.30, category: 'Panini semplici' },
    { id: 2, name: 'Panino semplice Cotto', price: 1.30, category: 'Panini semplici' },
    { id: 3, name: 'Panino semplice Crudo', price: 1.30, category: 'Panini semplici' },
    { id: 4, name: 'Panino semplice Ventricina', price: 1.30, category: 'Panini semplici' },
    { id: 5, name: 'Panino semplice Mortadella', price: 1.30, category: 'Panini semplici' },
    { id: 6, name: 'Panino semplice Tacchino', price: 1.30, category: 'Panini semplici' },

    { id: 7, name: 'Panino maxi Salame', price: 1.50, category: 'Panini maxi' },
    { id: 8, name: 'Panino maxi Cotto', price: 1.50, category: 'Panini maxi' },
    { id: 9, name: 'Panino maxi Crudo', price: 1.50, category: 'Panini maxi' },
    { id: 10, name: 'Panino maxi Ventricina', price: 1.50, category: 'Panini maxi' },
    { id: 11, name: 'Panino maxi Tonno', price: 1.50, category: 'Panini maxi' },

    { id: 12, name: 'Panino speciale Salame', price: 1.50, category: 'Panini speciali' },
    { id: 13, name: 'Panino speciale Cotto', price: 1.50, category: 'Panini speciali' },
    { id: 14, name: 'Panino speciale Crudo', price: 1.50, category: 'Panini speciali' },
    { id: 15, name: 'Panino speciale Ventricina', price: 1.50, category: 'Panini speciali' },
    { id: 16, name: 'Panino speciale Tonno', price: 1.50, category: 'Panini speciali' },

    { id: 17, name: 'Tramezzino Salame', price: 1.20, category: 'Tramezzini' },
    { id: 18, name: 'Tramezzino Cotto', price: 1.20, category: 'Tramezzini' },
    { id: 19, name: 'Tramezzino Crudo', price: 1.20, category: 'Tramezzini' },
    { id: 20, name: 'Tramezzino Ventricina', price: 1.20, category: 'Tramezzini' },
    { id: 21, name: 'Tramezzino Tonno', price: 1.20, category: 'Tramezzini' },
    { id: 22, name: 'Tramezzino Wurstel', price: 1.20, category: 'Tramezzini' },

    { id: 23, name: 'Pizza Pomodoro', price: 1.00, category: 'Pizze' },
    { id: 24, name: 'Pizza Patate', price: 1.00, category: 'Pizze' },
    { id: 25, name: 'Pizza Farcita', price: 1.70, category: 'Pizze' },
    { id: 26, name: 'Cornetto', price: 1.30, category: 'Pizze' },

    { id: 27, name: 'Focaccia semplice Salame', price: 1.50, category: 'Focacce semplici' },
    { id: 28, name: 'Focaccia semplice Cotto', price: 1.50, category: 'Focacce semplici' },
    { id: 29, name: 'Focaccia semplice Crudo', price: 1.50, category: 'Focacce semplici' },
    { id: 30, name: 'Focaccia semplice Ventricina', price: 1.50, category: 'Focacce semplici' },
    { id: 31, name: 'Focaccia semplice Mortadella', price: 1.50, category: 'Focacce semplici' },
    { id: 32, name: 'Focaccia semplice Tacchino', price: 1.50, category: 'Focacce semplici' },

    { id: 33, name: 'Focaccia maxi Salame', price: 1.70, category: 'Focacce maxi' },
    { id: 34, name: 'Focaccia maxi Cotto', price: 1.70, category: 'Focacce maxi' },
    { id: 35, name: 'Focaccia maxi Crudo', price: 1.70, category: 'Focacce maxi' },
    { id: 36, name: 'Focaccia maxi Ventricina', price: 1.70, category: 'Focacce maxi' },

    { id: 37, name: 'Focaccia speciale Salame', price: 1.70, category: 'Focacce speciali' },
    { id: 38, name: 'Focaccia speciale Cotto', price: 1.70, category: 'Focacce speciali' },
    { id: 39, name: 'Focaccia speciale Crudo', price: 1.70, category: 'Focacce speciali' },
    { id: 40, name: 'Focaccia speciale Ventricina', price: 1.70, category: 'Focacce speciali' },
    { id: 41, name: 'Focaccia speciale Tonno', price: 1.70, category: 'Focacce speciali' },

    { id: 42, name: 'Panino al wurstel', price: 2.00, category: 'Panini farciti' },
    { id: 43, name: 'Panino biondo', price: 2.00, category: 'Panini farciti' },
    { id: 44, name: 'Primavera', price: 2.00, category: 'Panini farciti' },
    { id: 45, name: 'Cotoletta', price: 3.00, category: 'Panini farciti' },
    { id: 46, name: 'Kebab', price: 3.00, category: 'Panini farciti' },
    { id: 47, name: 'Panino con tacchino', price: 1.70, category: 'Panini farciti' },
    { id: 48, name: 'Calzone', price: 1.50, category: 'Panini farciti' },
    { id: 49, name: 'Calzone farcito', price: 1.80, category: 'Panini farciti' },
];

document.addEventListener('DOMContentLoaded', function() {
    const productSearchInput = document.getElementById('productSearch');
    productSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const productElements = document.querySelectorAll('#productGrid .product-card');
        
        productElements.forEach(function(product) {
            const productName = product.querySelector('h4').textContent.toLowerCase();
            if (productName.includes(searchTerm)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    });
});