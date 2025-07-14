document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL ELEMENTS ---
    const modal = document.getElementById('project-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const closeButton = document.getElementById('modal-close-button');
    const prevButton = document.getElementById('modal-prev-image');
    const nextButton = document.getElementById('modal-next-image');
    const carouselSlides = document.getElementById('carousel-slides');
    const thumbnailGallery = document.getElementById('modal-thumbnail-gallery');
    const downloadButton = document.getElementById('modal-download-stl');
    const addToCartButton = document.getElementById('modal-add-to-cart');

    // --- STATE ---
    let currentProject = null;
    let currentImageIndex = 0;

    // --- FUNCTIONS ---

    /**
     * Opens the modal and populates it with project data.
     * @param {object} project - The project data object.
     */
    function openModal(project) {
        currentProject = project;
        currentImageIndex = 0;

        // Update modal text content with fallbacks for missing data
        document.getElementById('modal-project-title').textContent = project.title || 'Untitled Project';
        document.getElementById('modal-project-description').textContent = project.description || 'No description available.';
        document.getElementById('modal-project-material').textContent = project.material || 'PLA';
        document.getElementById('modal-project-weight').textContent = project.weight || 'N/A';
        document.getElementById('modal-project-resolution').textContent = project.resolution || '0.2mm';
        document.getElementById('modal-project-print-time').textContent = project.printTime || 'N/A';
        document.getElementById('modal-project-price').textContent = project.price || 'Contact for price';

        // Set up the image gallery
        updateImageGallery();

        // Configure the download button
        if (project.stlFile) {
            downloadButton.href = project.stlFile;
            downloadButton.style.display = 'flex';
        } else {
            downloadButton.style.display = 'none';
        }

        // Show the modal and prevent background scrolling
        document.body.style.overflow = 'hidden';
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Focus the close button for accessibility
        closeButton.focus();
    }

    /**
     * Closes the modal.
     */
    function closeModal() {
        document.body.style.overflow = '';
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }

    /**
     * Updates the main image and thumbnails in the modal gallery.
     */
    function updateImageGallery(animate = true) {
        if (!currentProject) return;

        const images = currentProject.images || [];
        const hasMultipleImages = images.length > 1;

        // Show or hide navigation buttons
        prevButton.style.display = hasMultipleImages ? 'flex' : 'none';
        nextButton.style.display = hasMultipleImages ? 'flex' : 'none';
        
        if (images.length === 0) {
            console.warn('No images available for this project');
            carouselSlides.innerHTML = '';
            return;
        }

        // Update current slide
        const currentSlide = carouselSlides.querySelector('.slide-current');
        if (currentSlide) {
            currentSlide.classList.remove('slide-current');
            currentSlide.classList.add('slide-previous');
            
            // Remove previous slide after animation
            setTimeout(() => {
                if (currentSlide.parentNode === carouselSlides) {
                    carouselSlides.removeChild(currentSlide);
                }
            }, 300);
        }

        // Create new slide
        const slide = document.createElement('div');
        slide.className = 'min-w-full h-full flex-shrink-0 slide-current';
        if (animate) {
            slide.style.animation = 'fadeIn 0.3s ease-in-out';
        }
        
        const img = document.createElement('img');
        img.src = images[currentImageIndex];
        img.alt = currentProject.title || 'Project image';
        img.className = 'w-full h-full object-cover';
        
        // Preload image before showing
        img.style.opacity = '0';
        img.onload = () => {
            img.style.opacity = '1';
            img.style.transition = 'opacity 0.3s ease-in-out';
        };
        
        slide.appendChild(img);
        
        // Add to beginning to maintain z-index order
        carouselSlides.insertBefore(slide, carouselSlides.firstChild);

        // Update thumbnails
        updateThumbnails();
    }

    /**
     * Updates the thumbnail gallery.
     */
    function updateThumbnails() {
        if (!currentProject) return;
        
        const images = currentProject.images || [];
        thumbnailGallery.innerHTML = '';
        
        images.forEach((image, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            const isActive = index === currentImageIndex;
            button.className = `w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                isActive 
                    ? 'border-brand-indigo dark:border-brand-yellow scale-105' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105'
            }`;
            button.innerHTML = `
                <img 
                    src="${image}" 
                    alt="Thumbnail ${index + 1}" 
                    class="w-full h-full object-cover  transition-transform duration-200 hover:scale-110"
                >
            `;
            button.setAttribute('aria-label', `View image ${index + 1}`);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            button.setAttribute('role', 'tab');
            
            button.addEventListener('click', () => {
                if (index !== currentImageIndex) {
                    currentImageIndex = index;
                    updateImageGallery();
                }
            });

            thumbnailGallery.appendChild(button);
        });
    }

    /**
     * Navigates the image gallery using arrow keys or buttons.
     * @param {number} direction - -1 for previous, 1 for next.
     */
    function navigateImages(direction) {
        if (!currentProject?.images?.length) return;
        const numImages = currentProject.images.length;
        currentImageIndex = (currentImageIndex + direction + numImages) % numImages;
        updateImageGallery();
    }

    /**
     * Attaches click listeners to all '.project-card' elements on the page.
     */
    function initializeProjectCards() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Do not open modal if a link or button inside the card was clicked
                if (e.target.closest('a, button')) return;

                // Construct project data from data-* attributes on the card
                const project = {
                    id: card.dataset.projectId,
                    title: card.dataset.title,
                    description: card.dataset.description,
                    images: JSON.parse(card.dataset.images || '[]'),
                    material: card.dataset.material,
                    weight: card.dataset.weight,
                    resolution: card.dataset.resolution,
                    printTime: card.dataset.printTime,
                    price: card.dataset.price,
                    stlFile: card.dataset.stlFile
                };

                openModal(project);
            });
        });
    }

    // --- EVENT LISTENERS ---

    // Modal closing events
    modalBackdrop.addEventListener('click', closeModal);
    closeButton.addEventListener('click', closeModal);

    // Image navigation events with debouncing
    let isAnimating = false;
    
    const handleNavigation = (direction) => {
        if (isAnimating) return;
        
        isAnimating = true;
        navigateImages(direction);
        
        // Prevent rapid clicking during animation
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    };
    
    // prevButton.addEventListener('click', () => handleNavigation(-1));
    // nextButton.addEventListener('click', () => handleNavigation(1));

    // Add to cart button
    addToCartButton.addEventListener('click', () => {
        if (!currentProject) return;
        console.log('Added to cart:', currentProject.title);
        // Add visual feedback or cart update logic here
        closeModal(); // Optionally close modal after adding to cart
    });

    // Keyboard navigation for the modal
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('hidden')) return;

        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navigateImages(-1);
        if (e.key === 'ArrowRight') navigateImages(1);
    });

    // --- INITIALIZATION ---

    // Find all project cards on the page and make them clickable.
    // Initialize the modal when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize any project cards that are already in the DOM
        initializeProjectCards();
        
        // Initialize carousel styles
        if (carouselSlides) {
            carouselSlides.style.display = 'flex';
            carouselSlides.style.position = 'relative';
            carouselSlides.style.overflow = 'hidden';
            carouselSlides.style.width = '100%';
            carouselSlides.style.height = '100%';
        }
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
            }
            .slide-current {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 1;
                transition: opacity 0.3s ease-in-out;
            }
            .slide-previous {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    });
});