// Main JavaScript for 3D Stark Labs Gallery

// ==============================================
// App State
// ==============================================
const appState = {
    // Language state (default to browser language or 'en')
    language: localStorage.getItem('language') || (navigator.language.startsWith('ar') ? 'ar' : 'en'),
    
    // Theme state (default to system preference or 'light')
    theme: localStorage.getItem('theme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    
    // Translation strings
    translations: {
        en: {
            // Navigation
            navGallery: 'Gallery',
            navAbout: 'About',
            navContact: 'Contact',
            // Hero
            heroTitle: '3D Printing & Design',
            heroSubtitle: 'Transforming ideas into physical reality',
            // Gallery
            galleryTitle: 'Our Work',
            viewDetails: 'View Details',
            noItems: 'No gallery items found. Please check back later.',
            // Footer
            copyright: '© 2025 3D Stark Labs. All rights reserved.',
            // Theme
            toggleTheme: 'Toggle Dark Mode',
            // Language
            toggleLanguage: 'عربي',
            currentLanguage: 'English'
        },
        ar: {
            // Navigation
            navGallery: 'المعرض',
            navAbout: 'من نحن',
            navContact: 'اتصل بنا',
            // Hero
            heroTitle: 'طباعة وتصميم ثلاثي الأبعاد',
            heroSubtitle: 'تحويل الأفكار إلى واقع ملموس',
            // Gallery
            galleryTitle: 'أعمالنا',
            viewDetails: 'عرض التفاصيل',
            noItems: 'لا توجد عناصر في المعرض. يرجى العودة لاحقاً.',
            // Footer
            copyright: '© 2025 3D ستارك لابس. جميع الحقوق محفوظة.',
            // Theme
            toggleTheme: 'تبديل الوضع المظلم',
            // Language
            toggleLanguage: 'English',
            currentLanguage: 'العربية'
        }
    }
};

// ==============================================
// DOM Elements
// ==============================================
const galleryContainer = document.getElementById('gallery-container');
const languageToggle = document.getElementById('language-toggle');
const themeToggle = document.getElementById('theme-toggle');
const languageCodeElements = document.querySelectorAll('.language-code');

// Fetch gallery data
async function fetchGalleryData() {
    try {
        const response = await fetch('./gallery.json');
        if (!response.ok) {
            throw new Error('Failed to fetch gallery data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading gallery data:', error);
        return [];
    }
}

// Create gallery item HTML
function createGalleryItem(item) {
    return `
        <article class="gallery-item">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
            <div class="gallery-item-info">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="gallery-item-meta">
                    <span>${new Date(item.date).toLocaleDateString()}</span>
                    <a href="${item.detailsLink}" class="btn">View Details</a>
                </div>
            </div>
        </article>
    `;
}

// Render gallery
async function renderGallery() {
    const galleryData = await fetchGalleryData();
    
    if (galleryData.length === 0) {
        galleryContainer.innerHTML = `
            <div class="no-items">
                <p>No gallery items found. Please check back later.</p>
            </div>
        `;
        return;
    }

    const galleryHTML = galleryData.map(createGalleryItem).join('');
    galleryContainer.innerHTML = galleryHTML;
}

// ==============================================
// Theme Management
// ==============================================
function initTheme() {
    // Check for saved theme preference or use system preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    let theme = 'light';
    
    // Determine the initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        theme = 'dark';
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        
        // Only save if we're not using system preference
        if (savedTheme === 'light') {
            localStorage.setItem('theme', 'light');
        }
    }
    
    // Update the UI
    updateThemeToggleUI(theme);
    
    // Listen for system theme changes (only if no explicit user preference is set)
    const handleSystemThemeChange = (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark', e.matches);
            document.documentElement.style.colorScheme = newTheme;
            updateThemeToggleUI(newTheme);
        }
    };
    
    prefersDarkScheme.addEventListener('change', handleSystemThemeChange);
    
    // Set up theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Cleanup function to remove event listener
    return () => {
        prefersDarkScheme.removeEventListener('change', handleSystemThemeChange);
    };
}

function enableDarkMode(savePreference = true) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    if (savePreference) {
        localStorage.setItem('theme', 'dark');
    }
    updateThemeToggleUI('dark');
}

function enableLightMode(savePreference = true) {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    if (savePreference) {
        localStorage.setItem('theme', 'light');
    }
    updateThemeToggleUI('light');
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        enableLightMode();
    } else {
        enableDarkMode();
    }
}

function updateThemeToggleUI(theme) {
    if (!themeToggle) return;
    
    // Update ARIA label and toggle state
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('aria-pressed', isDark);
    
    // Update the icon based on the current theme
    const icons = themeToggle.querySelectorAll('span');
    if (icons.length === 2) {
        const [moonIcon, sunIcon] = icons;
        if (isDark) {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }
}

// ==============================================
// Language Management
// ==============================================
function initLanguage() {
    // Apply saved language or default to browser language
    applyLanguage(appState.language);
    
    // Set up language toggle
    if (languageToggle) {
        languageToggle.addEventListener('click', toggleLanguage);
        updateLanguageToggle();
    } else {
        console.warn('Language toggle button not found');
    }
}

function applyLanguage(lang) {
    // Update app state
    appState.language = lang;
    
    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Save to localStorage
    localStorage.setItem('language', lang);
    
    // Apply translations
    applyTranslations();
    
    // Update any language-specific UI elements
    updateLanguageToggle();
}

function toggleLanguage() {
    const newLang = appState.language === 'en' ? 'ar' : 'en';
    applyLanguage(newLang);
}

function updateLanguageToggle() {
    if (!languageToggle) return;
    
    // Update toggle button text
    const toggleText = languageToggle.querySelector('.language-toggle-text');
    if (toggleText) {
        toggleText.textContent = appState.translations[appState.language].toggleLanguage;
    }
    
    // Update language code highlights
    languageCodeElements.forEach(el => {
        const isActive = (appState.language === 'en' && el.textContent === 'EN') ||
                        (appState.language === 'ar' && el.textContent === 'AR');
        el.classList.toggle('active', isActive);
    });
}

function applyTranslations() {
    // Get all translatable elements
    const translatables = document.querySelectorAll('[data-i18n]');
    
    // Update each element with translation
    translatables.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (appState.translations[appState.language][key]) {
            element.textContent = appState.translations[appState.language][key];
        }
    });
    
    // Update any dynamic content
    updateDynamicContent();
}

function updateDynamicContent() {
    // Update any dynamically generated content that needs translation
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero p');
    const galleryTitle = document.querySelector('.gallery h2');
    const footer = document.querySelector('footer p');
    
    if (heroTitle) heroTitle.textContent = appState.translations[appState.language].heroTitle;
    if (heroSubtitle) heroSubtitle.textContent = appState.translations[appState.language].heroSubtitle;
    if (galleryTitle) galleryTitle.textContent = appState.translations[appState.language].galleryTitle;
    if (footer) footer.textContent = appState.translations[appState.language].copyright;
}

// ==============================================
// Initialize Application
// ==============================================// SPA Navigation
class SPANavigator {
    constructor() {
        this.sections = document.querySelectorAll('.section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.currentSection = 'home';
        this.isTransitioning = false;
        this.transitionDuration = 300; // ms
        
        this.init();
    }
    
    init() {
        // Load saved section from localStorage or default to 'home'
        const savedSection = localStorage.getItem('currentSection');
        if (savedSection && document.getElementById(savedSection)) {
            this.currentSection = savedSection;
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show the current section
        this.showSection(this.currentSection, false);
        
        // Hide loading overlay after a short delay
        setTimeout(() => {
            this.hideLoading();
        }, 500);
    }
    
    setupEventListeners() {
        // Handle nav link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                if (sectionId !== this.currentSection) {
                    this.navigateTo(sectionId);
                }
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const sectionId = window.location.hash.substring(1) || 'home';
            if (sectionId !== this.currentSection) {
                this.showSection(sectionId, false);
            }
        });
    }
    
    navigateTo(sectionId) {
        if (this.isTransitioning) return;
        
        // Update URL without page reload
        history.pushState({}, '', `#${sectionId}`);
        
        // Show the new section
        this.showSection(sectionId);
    }
    
    showSection(sectionId, animate = true) {
        if (this.isTransitioning) return;
        
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;
        
        this.isTransitioning = true;
        
        // Update current section
        const prevSection = this.currentSection;
        this.currentSection = sectionId;
        
        // Save to localStorage
        localStorage.setItem('currentSection', sectionId);
        
        // Update active nav link
        this.updateActiveNavLink(sectionId);
        
        if (animate) {
            // Show loading overlay
            this.showLoading();
            
            // Fade out current section
            const currentSection = document.getElementById(prevSection);
            if (currentSection) {
                currentSection.classList.add('opacity-0');
                
                // Wait for the fade out transition to complete
                setTimeout(() => {
                    currentSection.classList.add('hidden');
                    currentSection.classList.remove('active');
                    
                    // Show new section
                    this.showNewSection(targetSection);
                    
                    // Hide loading overlay after the new section is shown
                    setTimeout(() => {
                        this.hideLoading();
                    }, this.transitionDuration);
                    
                }, this.transitionDuration);
            } else {
                this.showNewSection(targetSection);
                // Hide loading overlay after the new section is shown
                setTimeout(() => {
                    this.hideLoading();
                }, this.transitionDuration);
            }
        } else {
            // Hide all sections
            this.sections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('active', 'opacity-0');
            });
            
            // Show target section
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            targetSection.scrollIntoView({ behavior: 'instant' });
            this.isTransitioning = false;
        }
    }
    
    showNewSection(section) {
        // Show the new section
        section.classList.remove('hidden');
        section.classList.add('active');
        
        // Force reflow to ensure the transition works
        void section.offsetWidth;
        
        // Start fade in
        section.classList.remove('opacity-0');
        
        // Update document title
        document.title = `3D Stark Labs - ${section.querySelector('h1, h2')?.textContent || 'Home'}`;
        
        // Re-enable transitions after they complete
        setTimeout(() => {
            this.isTransitioning = false;
            
            // Ensure loading overlay is hidden
            if (this.loadingOverlay) {
                this.loadingOverlay.style.opacity = '0';
                this.loadingOverlay.style.visibility = 'hidden';
            }
        }, this.transitionDuration);
    }
    
    updateActiveNavLink(sectionId) {
        this.navLinks.forEach(link => {
            const linkSection = link.getAttribute('href').substring(1);
            if (linkSection === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
            this.loadingOverlay.style.visibility = 'visible';
            // Force reflow to ensure the transition works
            void this.loadingOverlay.offsetWidth;
            this.loadingOverlay.style.opacity = '1';
        }
    }
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            
            // Wait for the fade out transition to complete
            setTimeout(() => {
                if (this.loadingOverlay) {
                    this.loadingOverlay.style.visibility = 'hidden';
                    this.loadingOverlay.style.display = 'none';
                }
            }, 300);
        }
    }
}

// Initialize SPA navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize SPA navigation
    const spaNav = new SPANavigator();
    
    // Handle initial hash if present
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        if (sectionId && sectionId !== spaNav.currentSection) {
            spaNav.showSection(sectionId, false);
        }
    }
    console.log('3D Stark Labs - Gallery initialized');
    
    try {
        // Initialize theme first (as it affects the entire UI)
        initTheme();
        
        // Then initialize language
        initLanguage();
        
        // Finally, initialize the gallery
        renderGallery();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
    
    // Add smooth transitions after initial load to prevent flash of unstyled content
    setTimeout(() => {
        document.body.classList.add('transition-colors');
    }, 100);
});

// Handle page visibility changes to ensure language is applied correctly
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Re-apply language settings when page becomes visible again
        initLanguage();
    }
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Account for fixed header
                behavior: 'smooth'
            });
        }
    });
});
