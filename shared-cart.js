/**
 * Unified cart across all category pages (localStorage key: sharedCart)
 */
(function (global) {
    const CART_KEY = 'sharedCart';

    const CATEGORY_ORDER = [
        'ice-cream',
        'desserts',
        'pizza',
        'burgers',
        'combos',
        'snacks',
        'cooldrinks',
        'drinks',
        'other'
    ];

    const CATEGORY_LABELS = {
        'ice-cream': 'Ice Cream',
        desserts: 'Desserts',
        combos: 'Combos',
        burgers: 'Burgers',
        pizza: 'Pizza',
        snacks: 'Snacks',
        cooldrinks: 'Cool Drinks',
        drinks: 'Cool Drinks',
        other: 'Other'
    };

    function getItemQty(item) {
        const q = item.quantity ?? item.qty;
        return typeof q === 'number' && q > 0 ? q : 1;
    }

    function normalizeItem(item) {
        const img = item.img || item.image || '';
        const qty = getItemQty(item);
        return {
            name: item.name || 'Item',
            price: Number(item.price) || 0,
            img,
            image: img,
            id: item.id != null && item.id !== '' ? String(item.id) : (item.name || ''),
            category: item.category || 'other',
            quantity: qty,
            qty: qty
        };
    }

    function loadSharedCart() {
        try {
            const raw = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(raw) ? raw.map(normalizeItem) : [];
        } catch {
            return [];
        }
    }

    function saveSharedCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart.map(normalizeItem)));
        window.dispatchEvent(new CustomEvent('cart-updated'));
    }

    function getCategoryLabel(category) {
        if (!category || category === 'other') return CATEGORY_LABELS.other;
        return CATEGORY_LABELS[category] || category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function categoryBadgeHtml(category) {
        const label = getCategoryLabel(category);
        if (!label || label === 'Other') return '';
        return `<span class="cart-category-badge">${label}</span>`;
    }

    function groupCartByCategory(cart) {
        const buckets = {};
        cart.forEach((item, index) => {
            const cat = item.category || 'other';
            if (!buckets[cat]) buckets[cat] = [];
            buckets[cat].push({ item, index });
        });

        const groups = [];
        const used = new Set();

        CATEGORY_ORDER.forEach(cat => {
            if (buckets[cat]?.length) {
                groups.push({
                    category: cat,
                    label: getCategoryLabel(cat),
                    items: buckets[cat]
                });
                used.add(cat);
            }
        });

        Object.keys(buckets).forEach(cat => {
            if (!used.has(cat)) {
                groups.push({
                    category: cat,
                    label: getCategoryLabel(cat),
                    items: buckets[cat]
                });
            }
        });

        return groups;
    }

    function categorySectionOpenHtml(label) {
        return `<div class="cart-category-section"><div class="cart-category-section-title">${label}</div><div class="cart-category-section-items">`;
    }

    function categorySectionCloseHtml() {
        return '</div></div>';
    }

    function bindCartRefresh(refreshFn) {
        window.addEventListener('cart-updated', refreshFn);
        window.addEventListener('storage', e => {
            if (e.key === CART_KEY) refreshFn();
        });
        window.addEventListener('pageshow', refreshFn);
    }

    if (!document.getElementById('shared-cart-styles')) {
        const style = document.createElement('style');
        style.id = 'shared-cart-styles';
        style.textContent = `
            .cart-category-badge{display:inline-block;background:#ffd700;color:#000;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;margin-bottom:5px;text-transform:uppercase;}
            .cart-category-section{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.12);}
            .cart-category-section:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
            .cart-category-section-title{font-size:0.85rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ffd700;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid rgba(255,215,0,0.35);}
            .cart-category-section-items{display:flex;flex-direction:column;gap:12px;}
        `;
        document.head.appendChild(style);
    }

    global.SharedCart = {
        CART_KEY,
        loadSharedCart,
        saveSharedCart,
        normalizeItem,
        getItemQty,
        getCategoryLabel,
        categoryBadgeHtml,
        groupCartByCategory,
        categorySectionOpenHtml,
        categorySectionCloseHtml,
        bindCartRefresh
    };
})(window);
