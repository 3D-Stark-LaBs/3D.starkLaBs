document.addEventListener('DOMContentLoaded', () => {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartToggleButton = document.getElementById('cart-toggle-button');
    const closeCartButton = document.getElementById('close-cart-button');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const body = document.body;

    function openCart() {
        if (!cartSidebar || !cartBackdrop) return;
        body.style.overflow = 'hidden';
        cartSidebar.classList.remove('hidden');
        cartBackdrop.classList.remove('hidden');
        // Animate in
        setTimeout(() => {
            cartSidebar.classList.remove('translate-x-full');
            cartBackdrop.classList.remove('opacity-0');
        }, 20);
    }

    function closeCart() {
        if (!cartSidebar || !cartBackdrop) return;
        body.style.overflow = '';
        // Animate out
        cartSidebar.classList.add('translate-x-full');
        cartBackdrop.classList.add('opacity-0');
        // Hide after animation
        cartSidebar.addEventListener('transitionend', () => {
            cartSidebar.classList.add('hidden');
            cartBackdrop.classList.add('hidden');
        }, { once: true });
    }

    if (cartToggleButton) {
        cartToggleButton.addEventListener('click', openCart);
    }

    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCart);
    }

    if (cartBackdrop) {
        cartBackdrop.addEventListener('click', closeCart);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !cartSidebar.classList.contains('hidden')) {
            closeCart();
        }
    });
});
