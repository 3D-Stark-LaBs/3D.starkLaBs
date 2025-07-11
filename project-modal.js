document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL ELEMENTS ---
    const modal = document.getElementById('project-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const closeButton = document.getElementById('modal-close-button');
    const prevButton = document.getElementById('modal-prev-image');
    const nextButton = document.getElementById('modal-next-image');
    const mainImage = document.getElementById('modal-main-image');
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
    function updateImageGallery() {
        if (!currentProject) return;

        const images = currentProject.images || [];
        const hasMultipleImages = images.length > 1;

        // Show or hide navigation buttons
        prevButton.style.display = hasMultipleImages ? 'flex' : 'none';
        nextButton.style.display = hasMultipleImages ? 'flex' : 'none';
        
        // Update the main image
        if (images.length > 0) {
            mainImage.src = images[currentImageIndex];
            mainImage.alt = `${currentProject.title} - Image ${currentImageIndex + 1}`;
            mainImage.removeAttribute('aria-hidden');
        } else {
            mainImage.src = ''; // Or a placeholder image
            mainImage.alt = 'No image available';
            mainImage.setAttribute('aria-hidden', 'true');
        }

        // Rebuild thumbnails
        thumbnailGallery.innerHTML = '';
        images.forEach((image, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            const isActive = index === currentImageIndex;
            button.className = `w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${isActive ? 'border-brand-indigo dark:border-brand-yellow' : 'border-transparent'}`;
            button.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover">`;
            button.setAttribute('aria-label', `View image ${index + 1}`);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            button.setAttribute('role', 'tab');
            
            button.addEventListener('click', () => {
                currentImageIndex = index;
                updateImageGallery();
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

    // Image navigation events
    prevButton.addEventListener('click', () => navigateImages(-1));
    nextButton.addEventListener('click', () => navigateImages(1));

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
    // This should be run once the page is loaded.
    initializeProjectCards();

    // If you load project cards dynamically (e.g., via fetch),
    // you will need to call initializeProjectCards() again after they are rendered.
    // For example:
    // fetch('/api/projects')
    //   .then(res => res.json())
    //   .then(projects => {
    //     renderProjectsToPage(projects); // Your function to add cards to the DOM
    //     initializeProjectCards();       // Re-run this to attach listeners to the new cards
    //   });
});