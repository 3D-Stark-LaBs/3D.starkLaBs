document.addEventListener('DOMContentLoaded', () => {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartToggleButton = document.getElementById('cart-toggle-button');
    const mobileCartToggle = document.getElementById('mobile-cart-toggle');
    const closeCartButton = document.getElementById('close-cart-button');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const body = document.body;
    
    function openCart() {
        if (!cartSidebar || !cartBackdrop) return;
    
        // 🔒 قفل السكرول عن باقي الصفحة
        document.body.style.overflow = 'hidden';
    
        // 🟢 إظهار السلة والبلور
        cartSidebar.classList.remove('hidden');
        cartBackdrop.classList.remove('hidden');
    
        // 🟢 تأكد من إنها فعلاً قابلة للعرض (display: flex مثلاً)
        cartSidebar.classList.add('flex'); // أو grid أو whatever تستخدمه
        cartSidebar.classList.add('transition-all', 'duration-300'); // لو مش موجودين
    
        // ✅ تأكد من الحالة الأولية
        cartSidebar.classList.add('translate-x-full');
        cartBackdrop.classList.add('opacity-0');
    
        // Enable smooth scrolling داخل السلة
        if (cartItemsContainer) {
            cartItemsContainer.style.overflowY = 'auto';
        }
    
        // 🧠 شغل الأنميشن بعد دخولها DOM
        setTimeout(() => {
            cartSidebar.classList.remove('translate-x-full');  // Slide in
            cartBackdrop.classList.remove('opacity-0');         // Fade in
            cartBackdrop.classList.add('opacity-100');
        }, 20);
    }
    

    if (cartToggleButton) {
        cartToggleButton.addEventListener('click', openCart);
    }

    if (mobileCartToggle) {
        mobileCartToggle.addEventListener('click', openCart);
    }

    
    function closeCart() {
        if (!cartSidebar || !cartBackdrop) return;
    
        // Reset scroll position
        if (cartItemsContainer) {
            cartItemsContainer.scrollTop = 0;
        }
    
        // 🛠️ Remove active/show classes (ده المهم جداً)
        cartSidebar.classList.remove('flex'); // أو whatever you're using to show it
        cartSidebar.classList.remove('translate-x-0'); // لو بتظهر بالسلايد من اليمين
    
        // Animate out
        cartSidebar.classList.add('translate-x-full');
        cartBackdrop.classList.add('opacity-0');
    
        // Hide after animation
        const onTransitionEnd = () => {
            cartSidebar.classList.add('hidden');
            cartBackdrop.classList.add('hidden');
            document.body.style.overflow = ''; // رجّع الاسكرول للموقع
            cartSidebar.removeEventListener('transitionend', onTransitionEnd);
        };
    
        cartSidebar.addEventListener('transitionend', onTransitionEnd, { once: true });
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
