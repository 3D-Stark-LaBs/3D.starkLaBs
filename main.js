// Main JavaScript for 3D Stark Labs Gallery

// ==============================================
// App State
// ==============================================
const appState = {
    // Theme state (default to system preference or 'light')
    theme: localStorage.getItem('theme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    
    // Static text content (English only)
    text: {
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
        copyright: ' 2025 3D Stark Labs. All rights reserved.',
        // Theme
        toggleTheme: 'Toggle Dark Mode',
    },
    
    // Gallery data will be loaded here
    galleryData: []
};

// ==============================================
// DOM Elements
// ==============================================
const galleryContainer = document.getElementById('gallery-container');
const themeToggle = document.getElementById('theme-toggle');

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

// Modal functionality
let currentProject = null;
let currentImageIndex = 0;

// Format price in EGP
function formatPrice(price) {
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price || 0);
}

// Carousel state
const carouselState = {
    currentIndex: 0,
    isDragging: false,
    startPos: 0,
    currentTranslate: 0,
    prevTranslate: 0,
    animationID: null,
    slides: []
};

// Initialize carousel
function initCarousel(images) {
    const carousel = document.getElementById('image-carousel');
    const slidesContainer = document.getElementById('carousel-slides');
    const loadingIndicator = document.getElementById('carousel-loading');
    const prevButton = document.getElementById('modal-prev-image');
    const nextButton = document.getElementById('modal-next-image');
    const indicators = document.getElementById('carousel-indicators');
    
    // Clear existing slides and indicators
    slidesContainer.innerHTML = '';
    indicators.innerHTML = '';
    
    if (!images || images.length === 0) {
        // No images to show
        slidesContainer.innerHTML = `
            <div class="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No images available
            </div>
        `;
        loadingIndicator.classList.add('hidden');
        return;
    }
    
    // Create slides
    carouselState.slides = [];
    images.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = 'min-w-full h-full flex-shrink-0 flex items-center justify-center';
        slide.innerHTML = `
            <img src="${image}" 
                 alt="${currentProject?.title || 'Project'} - Image ${index + 1}" 
                 class="max-w-full max-h-full w-auto h-auto object-contain"
                 loading="lazy"
                 onload="this.parentElement.classList.remove('opacity-0')"
                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOCAxM0g2Ii8+PHBhdGggZD0iTTEyIDZ2NiIvPjwvc3ZnPg=='; this.alt='Failed to load image'; this.parentElement.classList.remove('opacity-0')">
        `;
        slide.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        slidesContainer.appendChild(slide);
        carouselState.slides.push(slide);
        
        // Create indicator
        const indicator = document.createElement('button');
        indicator.className = 'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-400 transition-colors';
        indicator.setAttribute('aria-label', `Go to image ${index + 1}`);
        indicator.addEventListener('click', () => goToSlide(index));
        indicators.appendChild(indicator);
    });
    
    // Set up navigation
    prevButton.addEventListener('click', () => goToSlide(carouselState.currentIndex - 1));
    nextButton.addEventListener('click', () => goToSlide(carouselState.currentIndex + 1));
    
    // Touch events for mobile swipe
    carousel.addEventListener('touchstart', touchStart, { passive: true });
    carousel.addEventListener('touchend', touchEnd);
    carousel.addEventListener('touchmove', touchMove, { passive: false });
    
    // Mouse events for desktop drag
    carousel.addEventListener('mousedown', touchStart);
    carousel.addEventListener('mouseup', touchEnd);
    carousel.addEventListener('mouseleave', touchEnd);
    carousel.addEventListener('mousemove', touchMove);
    
    // Keyboard navigation
    carousel.setAttribute('tabindex', '0');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel.setAttribute('aria-label', 'Project image carousel');
    
    const handleKeyDown = (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                goToSlide(carouselState.currentIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                goToSlide(carouselState.currentIndex + 1);
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(carouselState.slides.length - 1);
                break;
        }
    };
    
    // Add event listener for keyboard navigation
    carousel.addEventListener('keydown', handleKeyDown);
    
    // Also add keyboard navigation to the document when modal is open
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.addEventListener('keydown', (e) => {
            // Only handle if the event target is not an input or textarea
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                handleKeyDown(e);
            }
        });
    }
    
    // Initial slide
    goToSlide(0);
    
    // Hide loading indicator after a short delay
    setTimeout(() => {
        loadingIndicator.classList.add('opacity-0');
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
        }, 300);
    }, 300);
}

// Go to specific slide
function goToSlide(index) {
    const slides = carouselState.slides;
    if (!slides || slides.length === 0) return;
    
    const indicators = document.querySelectorAll('#carousel-indicators button');
    const thumbnails = document.querySelectorAll('.thumbnail-btn');
    
    // Clamp index to valid range
    index = Math.max(0, Math.min(index, slides.length - 1));
    
    // Update current index
    carouselState.currentIndex = index;
    
    // Update slide position with smooth transition
    const slideWidth = slides[0]?.offsetWidth || 0;
    carouselState.currentTranslate = -index * slideWidth;
    
    // Apply transform with smooth transition
    updateSliderPosition();
    
    // Update active indicator
    indicators.forEach((indicator, i) => {
        if (i === index) {
            indicator.classList.add('bg-brand-indigo', 'w-4', 'dark:bg-brand-purple');
            indicator.classList.remove('bg-gray-300', 'dark:bg-gray-600');
        } else {
            indicator.classList.remove('bg-brand-indigo', 'w-4', 'dark:bg-brand-purple');
            indicator.classList.add('bg-gray-300', 'dark:bg-gray-600');
        }
    });
    
    // Update thumbnail selection if exists
    if (thumbnails.length > 0) {
        thumbnails.forEach((thumb, i) => {
            const img = thumb.querySelector('img');
            if (i === index) {
                thumb.classList.add('ring-2', 'ring-brand-indigo', 'ring-offset-2');
                thumb.setAttribute('aria-selected', 'true');
                if (img) img.classList.remove('opacity-50');
                // Scroll thumbnail into view if needed
                thumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
                thumb.setAttribute('aria-current', 'true');
            } else {
                thumb.classList.remove('ring-2', 'ring-brand-indigo', 'ring-offset-2');
                thumb.removeAttribute('aria-current');
            }
        });
    }
}

// Update slider position with animation
function updateSliderPosition() {
    const slidesContainer = document.getElementById('carousel-slides');
    if (!slidesContainer) return;
    
    slidesContainer.style.transform = `translateX(${carouselState.currentTranslate}px)`;
}

// Touch event handlers
function touchStart(e) {
    if (e.type === 'mousedown' && e.button !== 0) return; // Only left mouse button
    
    carouselState.isDragging = true;
    carouselState.startPos = getPositionX(e);
    carouselState.animationID = requestAnimationFrame(animation);
    
    // Add grab cursor
    document.getElementById('image-carousel').classList.add('cursor-grabbing');
    
    // Stop any transitions
    document.getElementById('carousel-slides').style.transition = 'none';
}

function touchEnd() {
    if (!carouselState.isDragging) return;
    
    carouselState.isDragging = false;
    cancelAnimationFrame(carouselState.animationID);
    
    // Restore transition
    const slidesContainer = document.getElementById('carousel-slides');
    slidesContainer.style.transition = 'transform 0.3s ease-out';
    
    // Remove grab cursor
    document.getElementById('image-carousel').classList.remove('cursor-grabbing');
    
    // Calculate if we should change slide
    const movedBy = carouselState.currentTranslate - carouselState.prevTranslate;
    const slideWidth = carouselState.slides[0]?.offsetWidth || 0;
    
    if (Math.abs(movedBy) > slideWidth * 0.1) { // 10% threshold
        if (movedBy > 0 && carouselState.currentIndex > 0) {
            goToSlide(carouselState.currentIndex - 1);
        } else if (movedBy < 0 && carouselState.currentIndex < carouselState.slides.length - 1) {
            goToSlide(carouselState.currentIndex + 1);
        } else {
            goToSlide(carouselState.currentIndex);
        }
    } else {
        goToSlide(carouselState.currentIndex);
    }
}

function touchMove(e) {
    if (!carouselState.isDragging) return;
    
    const currentPosition = getPositionX(e);
    const diff = currentPosition - carouselState.startPos;
    
    // Prevent page scroll when swiping
    if (e.cancelable && Math.abs(diff) > 10) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    carouselState.currentTranslate = carouselState.prevTranslate + diff;
}

function getPositionX(e) {
    return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
}

function animation() {
    updateSliderPosition();
    if (carouselState.isDragging) {
        carouselState.animationID = requestAnimationFrame(animation);
    }
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const slidesContainer = document.getElementById('carousel-slides');
        if (slidesContainer) {
            const slideWidth = slidesContainer.offsetWidth;
            carouselState.currentTranslate = -carouselState.currentIndex * slideWidth;
            updateSliderPosition();
        }
    }, 250);
});

// Create thumbnail elements
function createThumbnails(project) {
    const container = document.getElementById('image-thumbnails');
    container.innerHTML = ''; // Clear existing thumbnails
    
    if (!project.images || project.images.length <= 1) return;
    
    project.images.forEach((img, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'thumbnail-btn group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-indigo transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:ring-offset-2';
        button.setAttribute('aria-label', `View image ${index + 1} of ${project.images.length}`);
        
        // Highlight first thumbnail by default
        if (index === 0) {
            button.classList.add('ring-2', 'ring-brand-indigo', 'ring-offset-2');
            button.setAttribute('aria-current', 'true');
        }
        
        button.innerHTML = `
            <img src="${img}" alt="" class="w-20 h-20 object-cover" loading="lazy">
            <span class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></span>
        `;
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            currentImageIndex = index;
            updateMainImage(project, index);
        });
        
        container.appendChild(button);
    });
}

// Update the main image display when a thumbnail is clicked
function updateMainImage(project, index) {
    // Update the carousel to show the selected image
    goToSlide(index);
    
    // Update the active thumbnail
    const thumbnails = document.querySelectorAll('.thumbnail-btn');
    thumbnails.forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('ring-2', 'ring-brand-indigo', 'ring-offset-2');
            thumb.setAttribute('aria-current', 'true');
        } else {
            thumb.classList.remove('ring-2', 'ring-brand-indigo', 'ring-offset-2');
            thumb.removeAttribute('aria-current');
        }
    });
}

// Update like button state
function updateLikeButton(projectId, liked) {
    const likeButton = document.querySelector(`#like-btn-${projectId}`);
    const likeCount = document.querySelector(`#like-count-${projectId}`);
    const modalLikeButton = document.querySelector('#modal-like-button');
    const modalLikeCount = document.querySelector('#modal-likes');
    
    if (likeButton && likeCount) {
        const currentLikes = parseInt(likeCount.textContent, 10);
        const newLikes = liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        likeCount.textContent = newLikes;
        likeButton.classList.toggle('text-red-500', liked);
        likeButton.classList.toggle('text-gray-400', !liked);
    }
    
    if (modalLikeButton && modalLikeCount) {
        const currentLikes = parseInt(modalLikeCount.textContent, 10);
        const newLikes = liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        modalLikeCount.textContent = newLikes;
        modalLikeButton.classList.toggle('text-red-500', liked);
        modalLikeButton.classList.toggle('text-gray-400', !liked);
    }
    
    // Update local storage
    const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '{}');
    if (liked) {
        likedProjects[projectId] = true;
    } else {
        delete likedProjects[projectId];
    }
    localStorage.setItem('likedProjects', JSON.stringify(likedProjects));
}

// Handle like button click
function handleLikeClick(projectId) {
    const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '{}');
    const isLiked = !likedProjects[projectId];
    updateLikeButton(projectId, isLiked);
}

// Open modal with project details
// Legacy openModal function for backward compatibility
function openModal(project) {
    console.warn('openModal() is deprecated. Use openProjectModal() instead.');
    if (project) {
        openProjectModal(project);
    } else {
        console.error('No project data provided to openModal');
    }
}

// Make showProjectModal available globally for testing
window.showProjectModal = showProjectModal;

function openProjectModal(project) {
    if (!project) {
        console.error('No project data provided');
        return;
    }
    showProjectModal(project);
}

function showProjectModal(project) {
    if (!project) {
        console.error('No project data provided to showProjectModal');
        return;
    }

    const modal = document.getElementById('project-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const closeButton = document.getElementById('modal-close-button');
    const thumbnailGallery = document.getElementById('modal-thumbnail-gallery');
    const prevButton = document.getElementById('modal-prev-image');
    const nextButton = document.getElementById('modal-next-image');
    const downloadStlBtn = document.getElementById('modal-download-stl');
    const addToCartBtn = document.getElementById('modal-add-to-cart');
    const carouselSlides = document.getElementById('carousel-slides');
    
    if (!modal || !backdrop || !closeButton || !thumbnailGallery || !carouselSlides) {
        console.error('Required modal elements not found');
        return;
    }
    
    // Store current project for keyboard events
    window.currentModalProject = project;
    
    // Get all images for the gallery (use thumbnail as first image if available)
    const projectImages = [project.thumbnail, ...(project.images || [])].filter(Boolean);
    let currentImageIndex = 0;
    
    // Helper function to safely set text content
    const setTextContent = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element with ID '${id}' not found`);
        }
    };
    
    // Set modal content with null checks
    setTextContent('modal-project-title', project.title || 'Project Title');
    setTextContent('modal-project-description', project.description || 'No description available');
    setTextContent('modal-project-material', project.material || 'PLA');
    setTextContent('modal-project-weight', project.weight ? `${project.weight}g` : 'N/A');
    setTextContent('modal-project-resolution', project.resolution ? `${project.resolution}mm` : 'N/A');
    setTextContent('modal-project-print-time', project.printTime || 'N/A');
    
    // Set price range
    const priceRange = project.priceFrom && project.priceTo 
        ? `${formatPrice(project.priceFrom)} - ${formatPrice(project.priceTo)}` 
        : 'Contact for quote';
    setTextContent('modal-project-price', priceRange);
    
    // Initialize the carousel with project images
    if (projectImages.length > 0) {
        // Initialize the carousel with all images
        initCarousel(projectImages);
        
        // Set up the thumbnail gallery
        thumbnailGallery.innerHTML = '';
        projectImages.forEach((image, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'thumbnail-btn relative rounded-md overflow-hidden transition-all duration-200 focus:outline-none';
            button.setAttribute('aria-label', `View image ${index + 1} of ${projectImages.length}`);
            button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = '';
            img.className = 'w-16 h-16 object-cover' + (index === 0 ? ' opacity-100' : ' opacity-50');
            img.loading = 'lazy';
            
            button.appendChild(img);
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
                // Update thumbnail states
                updateThumbnailStates(index);
                // Focus the button for better keyboard navigation
                button.focus();
            });
            
            // Add keyboard navigation for thumbnails
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToSlide(index);
                    updateThumbnailStates(index);
                }
            });
            
            thumbnailGallery.appendChild(button);
        });
    } else {
        // No images available
        carouselSlides.innerHTML = `
            <div class="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No images available
            </div>
        `;
    }
    
    // Update thumbnail active states
    function updateThumbnailStates(activeIndex) {
        const thumbnails = thumbnailGallery.querySelectorAll('button');
        thumbnails.forEach((thumb, index) => {
            const isActive = index === activeIndex;
            thumb.setAttribute('aria-selected', isActive ? 'true' : 'false');
            
            const img = thumb.querySelector('img');
            if (img) {
                img.classList.toggle('opacity-100', isActive);
                img.classList.toggle('opacity-50', !isActive);
            }
        });
    }
    
    // Initialize thumbnails
    function initThumbnails() {
        thumbnailGallery.innerHTML = ''; // Clear existing thumbnails
        
        if (projectImages.length <= 1) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            return;
        }
        
        prevButton.style.display = 'flex';
        nextButton.style.display = 'flex';
        
        projectImages.forEach((image, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                index === currentImageIndex 
                    ? 'ring-2 ring-brand-indigo dark:ring-brand-yellow ring-offset-2' 
                    : 'border-transparent'
            }`;
            button.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover">`;
            button.addEventListener('click', () => updateMainImage(index));
            button.setAttribute('aria-label', `View image ${index + 1}`);
            button.setAttribute('aria-selected', index === currentImageIndex);
            button.setAttribute('role', 'tab');
            thumbnailGallery.appendChild(button);
        });
    }
    
    // Set like button state
    const likeButton = document.querySelector('.like-button');
    const likeCount = document.getElementById('modal-likes');
    
    if (likeButton && likeCount) {
        likeButton.setAttribute('data-liked', project.liked || 'false');
        likeCount.textContent = project.likes || '0';
        
        // Update heart icon based on liked state
        const heartIcon = likeButton.querySelector('span:first-child');
        if (heartIcon) {
            heartIcon.className = project.liked === 'true' 
                ? 'text-red-500 text-xl' 
                : 'text-gray-500 dark:text-gray-400 text-xl';
        }
    } else {
        console.warn('Like button or like count element not found');
    }
    
    if (likeCount) {
        likeCount.textContent = project.likes || '0';
    }
    
    // Only set up click handler if like button exists
    if (likeButton && likeCount) {
        likeButton.onclick = (e) => {
            e.stopPropagation();
            
            // Prevent multiple rapid clicks
            if (likeButton.classList.contains('pointer-events-none')) return;
            
            // Disable button temporarily
            likeButton.classList.add('pointer-events-none');
            
            const isLiked = likeButton.getAttribute('data-liked') === 'true';
            const currentLikes = parseInt(likeCount.textContent) || 0;
            const newLikeCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
            
            // Update like count immediately
            likeCount.textContent = newLikeCount;
            
            // Toggle like state
            likeButton.setAttribute('data-liked', (!isLiked).toString());
            likeButton.innerHTML = !isLiked
                ? '<svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>'
                : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>';
            
            // Add animation
            likeButton.classList.add('animate-pulse');
            likeCount.classList.add('scale-110');
            
            // Update the project data
            if (window.currentModalProject) {
                window.currentModalProject.likes = newLikeCount;
                window.currentModalProject.liked = (!isLiked).toString();
            }
            
            // Remove animation classes after they complete
            setTimeout(() => {
                likeButton.classList.remove('animate-pulse');
                likeCount.classList.remove('scale-110');
                likeButton.classList.remove('pointer-events-none');
                
                // Update the project data after animation
                project.liked = (!isLiked).toString();
                project.likes = newLikeCount;
                
                // Save to local storage or API in a real app
                handleLikeClick(project.id);
            }, 300);
        };
    
    } // Close the like button click handler
    
    // Set up STL download link
    if (downloadStlBtn) {
        if (project.model) {
            // Set up download with proper filename
            const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.stl`;
            downloadStlBtn.href = project.model;
            downloadStlBtn.download = filename;
            downloadStlBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            
            // Add click handler for better feedback and error handling
            downloadStlBtn.onclick = async (e) => {
                e.preventDefault();
                const originalHtml = downloadStlBtn.innerHTML;
                
                try {
                    // Show downloading state
                    downloadStlBtn.innerHTML = `
                        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                    `;
                    downloadStlBtn.classList.add('cursor-wait');
                    
                    // Trigger the download
                    const response = await fetch(project.model);
                    if (!response.ok) throw new Error('Failed to fetch STL file');
                    
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    // Create a temporary anchor element to trigger download
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(a);
                    
                    // Show success feedback
                    downloadStlBtn.innerHTML = `
                        <svg class="-ml-1 mr-2 h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        Download Complete
                    `;
                    
                } catch (error) {
                    console.error('Error downloading STL:', error);
                    
                    // Show error state
                    downloadStlBtn.innerHTML = `
                        <svg class="-ml-1 mr-2 h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                        Download Failed
                    `;
                } finally {
                    // Revert to original state after a delay
                    setTimeout(() => {
                        downloadStlBtn.innerHTML = originalHtml;
                        downloadStlBtn.classList.remove('cursor-wait');
                    }, 2000);
                }
            };
        } else {
            // No model available
            downloadStlBtn.classList.add('opacity-50', 'cursor-not-allowed');
            downloadStlBtn.onclick = (e) => e.preventDefault();
            downloadStlBtn.title = 'No STL file available for this project';
        }
    }
    
    // Initialize the modal
    function initModal() {
        // Initialize the image gallery
        initThumbnails();
        
        // Set initial image with proper error handling
        if (projectImages.length > 0) {
            const currentSlide = carouselSlides.querySelector('.slide:first-child');
            if (currentSlide) {
                const img = currentSlide.querySelector('img');
                if (img) {
                    img.onload = () => {
                        img.style.opacity = '1';
                        img.classList.remove('opacity-0');
                    };
                    img.onerror = () => {
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOCAxM0g2Ii8+PHBhdGggZD0iTTEyIDZ2NiIvPjwvc3ZnPg==';
                        img.alt = 'Image failed to load';
                        img.classList.add('opacity-30');
                    };
                }
            }
            updateMainImage(0);
        } else {
            // Show placeholder if no images
            mainImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOCAxM0g2Ii8+PHBhdGggZD0iTTEyIDZ2NiIvPjwvc3ZnPg==';
            mainImage.alt = 'No image available';
            mainImage.classList.add('opacity-30');
        }
        
        // Set up navigation buttons with proper event delegation
        const handlePrevClick = (e) => {
            e.stopPropagation();
            updateMainImage(currentImageIndex - 1);
        };
        
        const handleNextClick = (e) => {
            e.stopPropagation();
            updateMainImage(currentImageIndex + 1);
        };
        
        prevButton.removeEventListener('click', handlePrevClick); // Remove existing to prevent duplicates
        nextButton.removeEventListener('click', handleNextClick);
        
        prevButton.addEventListener('click', handlePrevClick);
        nextButton.addEventListener('click', handleNextClick);
        
        // Set up keyboard navigation
        const handleKeyDown = (e) => {
            if (!modal || modal.classList.contains('hidden')) return;
            
            switch (e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    updateMainImage(currentImageIndex - 1);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    updateMainImage(currentImageIndex + 1);
                    e.preventDefault();
                    break;
            }
        };
        
        // Remove existing keydown listener to prevent duplicates
        document.removeEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleKeyDown);
        
        // Add to cart functionality
        if (addToCartBtn) {
            addToCartBtn.onclick = (e) => {
                e.preventDefault();
                // Add to cart logic here
                console.log('Added to cart:', project);
                // You can add a notification or cart update logic here
                
                // Visual feedback
                const originalText = addToCartBtn.innerHTML;
                addToCartBtn.innerHTML = `
                    <svg class="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Added to Cart
                `;
                
                setTimeout(() => {
                    addToCartBtn.innerHTML = originalText;
                }, 2000);
            };
        }
        
        // Initialize the carousel with the first image
        if (projectImages.length > 0) {
            updateMainImage(0);
        }
        
        // Close modal function
        const closeModal = () => {
            modal.classList.add('opacity-0', 'scale-95');
            backdrop.classList.add('opacity-0');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
                document.body.style.overflow = ''; // Re-enable scrolling
                document.removeEventListener('keydown', handleKeyDown);
                
                // Clean up event listeners
                prevButton.onclick = null;
                nextButton.onclick = null;
                if (addToCartBtn) addToCartBtn.onclick = null;
            }, 200);
        };
        
        // Set up close button with proper event handling
        const handleCloseButtonClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        };
        
        const handleBackdropClick = (e) => {
            if (e.target === backdrop) {
                closeModal();
            }
        };
        
        // Add event listeners
        closeButton.addEventListener('click', handleCloseButtonClick);
        backdrop.addEventListener('click', handleBackdropClick);
        
        // Prevent modal from closing when clicking inside content
        const modalContent = modal.querySelector('.bg-white, .dark\\:bg-dark-800');
        if (modalContent) {
            modalContent.onclick = (e) => e.stopPropagation();
        }
        
        // Show modal with animation
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        modal.classList.add('flex');
        modal.classList.remove('hidden');
        
        // Force reflow to ensure the element is in the DOM before starting animation
        void modal.offsetHeight;
        
        // Start animation
        requestAnimationFrame(() => {
            modal.classList.add('opacity-100');
            backdrop.classList.add('opacity-100');
            
            // Focus the close button for better keyboard navigation
            closeButton.focus();
            
            // Set focus trap for better accessibility
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            // Handle keyboard navigation
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'ArrowLeft') {
                    // Navigate to previous image
                    const newIndex = (currentImageIndex - 1 + projectImages.length) % projectImages.length;
                    updateMainImage(newIndex);
                } else if (e.key === 'ArrowRight') {
                    // Navigate to next image
                    const newIndex = (currentImageIndex + 1) % projectImages.length;
                    updateMainImage(newIndex);
                } else if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            };
            
            // Add event listeners for keyboard navigation
            modal.addEventListener('keydown', handleKeyDown);
            
            // Add event listeners for previous/next buttons
            if (prevButton) {
                prevButton.onclick = () => {
                    const newIndex = (currentImageIndex - 1 + projectImages.length) % projectImages.length;
                    updateMainImage(newIndex);
                };
            }
            
            if (nextButton) {
                nextButton.onclick = () => {
                    const newIndex = (currentImageIndex + 1) % projectImages.length;
                    updateMainImage(newIndex);
                };
            }
        });
    }
    
    // Initialize the modal
    initModal();
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('project-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    if (!modal || !backdrop) return;
    
    // Start close animation
    modal.classList.remove('opacity-100');
    backdrop.classList.remove('opacity-100');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Re-enable scrolling
        
        // Clean up any modal-specific event listeners
        const prevButton = document.getElementById('modal-prev-image');
        const nextButton = document.getElementById('modal-next-image');
        const closeButton = document.getElementById('modal-close-button');
        
        if (prevButton) prevButton.onclick = null;
        if (nextButton) nextButton.onclick = null;
        if (closeButton) closeButton.onclick = null;
        
        // Reset modal state
        const mainImage = document.getElementById('modal-main-image');
        if (mainImage) {
            mainImage.src = '';
            mainImage.onload = null;
            mainImage.onerror = null;
        }
        
        // Clear the current project reference
        window.currentModalProject = null;
    }, 200);
}

// Add event listeners for modal
function setupModalListeners() {
    // Close modal when clicking on the backdrop
    const modalBackdrop = document.getElementById('modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            // Only close if clicking directly on the backdrop, not on modal content
            if (e.target === modalBackdrop) {
                closeModal();
            }
        });
    }
    
    // Close button
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Handle like button clicks in the gallery
    document.addEventListener('click', (e) => {
        const likeButton = e.target.closest('.like-button');
        if (likeButton && window.currentProject) {
            e.preventDefault();
            handleLikeClick(window.currentProject.id);
        }
    });
}

// Handle project card clicks and like button clicks using event delegation
document.addEventListener('click', (e) => {
    // Handle View Project button clicks
    const viewProjectBtn = e.target.closest('.view-project-btn');
    if (viewProjectBtn) {
        e.preventDefault();
        e.stopPropagation();
        const projectId = viewProjectBtn.getAttribute('data-project-id');
        if (!appState.galleryData || !Array.isArray(appState.galleryData)) {
            console.error('Gallery data not loaded yet');
            return;
        }
        const project = appState.galleryData.find(p => p && p.id === projectId);
        if (project) {
            openProjectModal(project);
        } else {
            console.error('Project not found:', projectId, 'Available projects:', appState.galleryData.map(p => p.id));
        }
        return;
    }

    // Handle like button clicks
    const likeButton = e.target.closest('.like-button');
    if (likeButton && likeButton.getAttribute('data-liked') === 'false') {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to the card
        
        // Get elements
        const heartIcon = likeButton.querySelector('.heart-icon');
        const likeCount = likeButton.querySelector('.like-count');
        const currentLikes = parseInt(likeCount.textContent.replace(/,/g, ''));
        
        // Update like count
        const newLikes = currentLikes + 1;
        likeCount.textContent = newLikes.toLocaleString('en-US');
        
        // Update button state
        likeButton.setAttribute('data-liked', 'true');
        likeButton.classList.add('pointer-events-none'); // Disable further clicks
        
        // Add animation classes
        heartIcon.classList.add('animate-ping', 'scale-150');
        likeCount.classList.add('font-bold', 'text-red-500', 'dark:text-red-400');
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            heartIcon.classList.remove('animate-ping');
            setTimeout(() => {
                heartIcon.classList.remove('scale-150');
            }, 150);
        }, 500);
        
        return;
    }
    
    // Handle project card clicks
    const projectCard = e.target.closest('.group.bg-white, .group.bg-dark-800');
    if (projectCard && !e.target.closest('a, button')) {
        e.preventDefault();
        const projectId = projectCard.getAttribute('data-project-id') || projectCard.id.replace('project-', '');
        const project = appState.galleryData.find(p => p.id === projectId);
        if (project) {
            openProjectModal(project);
        } else {
            console.error('Project not found:', projectId);
        }
    }
});

// Initialize modal listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupModalListeners();
});

// Create gallery item HTML
function createGalleryItem(item) {
        // Format price range with EGP currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    // Format date
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Get like count from item data or use a random value if not provided
    const likeCount = item.likes !== undefined ? item.likes : Math.floor(Math.random() * 251) + 50;
    const formattedLikeCount = new Intl.NumberFormat('en-US').format(likeCount);
    
    // Generate a unique ID for the like button to handle multiple cards
    const likeButtonId = `like-btn-${item.id || Math.random().toString(36).substr(2, 9)}`;

    // Create specifications data
    const specifications = [
        { icon: '📦', label: 'Material', value: item.material },
        { icon: '⚖️', label: 'Weight', value: item.weight ? item.weight.toString() : '' },
        { icon: '📏', label: 'Resolution', value: item.resolution ? `${item.resolution}mm` : '' }
    ].filter(spec => spec.value);
    
    // Add print time as a separate section
    const printTime = item.printTime ? `Print Time: ${item.printTime}` : '';

    return `
        <div id="project-${item.id}" class="group bg-white dark:bg-dark-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-dark-700">
                <!-- Thumbnail with hover effect -->
                <div class="relative overflow-hidden h-48 bg-gray-100 dark:bg-dark-700 cursor-pointer" data-project-id="${item.id}">
                    <img 
                        src="${item.thumbnail}" 
                        alt="${item.title}" 
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    >
                    <!-- Hover overlay with quick view -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <button class="view-project-btn w-full py-2 px-4 bg-white/90 text-gray-900 rounded-lg font-medium hover:bg-white transition-colors duration-200" data-project-id="${item.id}">
                            View Project
                        </button>
                    </div>
                </div>

            <!-- Card Content -->
            <div class="p-5">
                <!-- Title and Price Range -->
                <div class="mb-3">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">${item.title}</h3>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center bg-gray-100 dark:bg-dark-700 px-3 py-1 rounded-full">
                            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">${formatPrice(item.priceFrom)}</span>
                            <span class="mx-1 text-gray-400">-</span>
                            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">${formatPrice(item.priceTo)}</span>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    ${item.description}
                </p>

                <!-- Specifications -->
                <div class="space-y-2 mb-4">
                    ${specifications.map(spec => `
                        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span class="mr-2 text-gray-500">${spec.icon}</span>
                            <span class="font-medium text-gray-700 dark:text-gray-300 mr-1">${spec.label}:</span>
                            <span>${spec.label === 'Weight' ? `${spec.value}g` : spec.value}</span>
                        </div>
                    `).join('')}
                    
                    ${printTime ? `
                    <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-dark-700 mt-2">
                        <span class="mr-2 text-gray-500">⏱️</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">${printTime}</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer with date and likes -->
                <div class="pt-3 border-t border-gray-100 dark:border-dark-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>${formattedDate}</span>
                        </div>
                        <button id="${likeButtonId}" 
                                class="like-button flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 focus:outline-none"
                                data-original-likes="${likeCount}"
                                data-liked="false"
                                aria-label="Like this project">
                            <span class="heart-icon text-red-500 mr-1 transform transition-transform duration-200 hover:scale-125">♥</span>
                            <span class="like-count">${formattedLikeCount}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render gallery
async function renderGallery() {
    try {
        // Show loading state
        galleryContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-indigo mx-auto"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
        `;

        const galleryData = await fetchGalleryData();
        // Store the gallery data in appState and window for modal triggers
        appState.galleryData = galleryData;
        window.projectData = galleryData; // Make project data globally available
        
        if (!galleryData || galleryData.length === 0) {
            galleryContainer.innerHTML = `
                <div class="col-span-full text-center py-12 px-4">
                    <div class="max-w-md mx-auto">
                        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Projects Found</h3>
                        <p class="mt-2 text-gray-500 dark:text-gray-400">No projects found. Please add new ones using the form above.</p>
                        <div class="mt-6">
                            <a href="/admin" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-indigo hover:bg-brand-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo dark:bg-brand-yellow dark:text-gray-900 dark:hover:bg-brand-yellow/90 dark:focus:ring-brand-yellow">
                                Go to Admin Panel
                            </a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        const sortedData = [...galleryData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Generate gallery HTML
        const galleryHTML = sortedData.map(createGalleryItem).join('');
        galleryContainer.innerHTML = galleryHTML;
        
        // Add click handlers for view project buttons using event delegation
        document.addEventListener('click', function(e) {
            const viewProjectBtn = e.target.closest('.view-project-btn');
            if (viewProjectBtn) {
                e.preventDefault();
                const projectId = viewProjectBtn.dataset.projectId;
                const project = window.projectData.find(p => p.id === projectId);
                if (project) {
                    openProjectModal(project);
                }
            }
        });

    } catch (error) {
        console.error('Error rendering gallery:', error);
        galleryContainer.innerHTML = `
            <div class="col-span-full text-center py-12 px-4">
                <div class="max-w-md mx-auto">
                    <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading Projects</h3>
                    <p class="mt-2 text-gray-500 dark:text-gray-400">We couldn't load the projects. Please try again later.</p>
                    <div class="mt-6 space-x-3">
                        <button onclick="renderGallery()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-indigo hover:bg-brand-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo dark:bg-brand-yellow dark:text-gray-900 dark:hover:bg-brand-yellow/90 dark:focus:ring-brand-yellow">
                            <svg class="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>
                        <a href="/admin" class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo dark:focus:ring-offset-dark-800">
                            Go to Admin
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
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
// Text Content Management
// ==============================================
function updateTextContent() {
    // Update all elements with data-text attributes
    Object.entries(appState.text).forEach(([key, value]) => {
        const elements = document.querySelectorAll(`[data-text="${key}"]`);
        elements.forEach(element => {
            element.textContent = value;
        });
    });
    
    // Update dynamic content
    updateDynamicContent();
}

function updateDynamicContent() {
    // Update any dynamic content (like current year)
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('[data-current-year]');
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
}

// ==============================================
// Initialize Application
// ==============================================
// SPA Navigation
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
            this.loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('active');
        }
    }
}

// Make openModal globally available
window.openModal = openModal;

// Initialize SPA navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize SPA navigation
    const spaNav = new SPANavigator();
    
    // Setup modal event listeners
    setupModalListeners();
    
    // Initialize gallery if on the gallery page
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        renderGallery();
    }
    
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
        
        // Initialize text content
        updateTextContent();
        
        // Initialize gallery
        fetchGalleryData().then(() => {
            renderGallery();
        });
    } catch (error) {
        console.error('Error initializing application:', error);
    }
    
    // Add smooth transitions after initial load to prevent flash of unstyled content
    setTimeout(() => {
        document.body.classList.add('transition-colors');
    }, 100);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Re-apply theme when page becomes visible again
        const theme = localStorage.getItem('theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'dark') {
            enableDarkMode(false);
        } else {
            enableLightMode(false);
        }
    }
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        try {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Only process if it's a valid element ID (starts with # followed by a letter)
            if (!targetId || !/^#[a-zA-Z][\w-]*$/.test(targetId)) {
                return;
            }
            
            const targetElement = document.querySelector(targetId);
            if (targetElement && typeof targetElement.offsetTop === 'number') {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Account for fixed header
                    behavior: 'smooth'
                });
            }
        } catch (error) {
            console.error('Error in smooth scrolling:', error);
        }
    });
});

