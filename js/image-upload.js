document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('file-upload');
    const imageStrip = document.getElementById('image-strip-container');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const mainImagePreview = document.getElementById('main-image-preview');
    const mainPreview = document.getElementById('main-preview');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRight = document.getElementById('scroll-right');
    
    // Store uploaded images
    let uploadedImages = [];
    
    // Handle file selection
    fileUpload.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        // Filter only image files
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) return;
        
        // Add new images to the array
        imageFiles.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                uploadedImages.push(imageUrl);
                
                // Create thumbnail
                const thumbnail = document.createElement('div');
                thumbnail.className = 'flex-shrink-0 relative group';
                thumbnail.innerHTML = `
                    <img src="${imageUrl}" alt="Preview" class="w-20 h-20 object-cover rounded-lg border-2 border-transparent group-hover:border-brand-indigo dark:group-hover:border-brand-yellow cursor-pointer transition-colors">
                    <button type="button" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-index="${uploadedImages.length - 1}">
                        ×
                    </button>
                `;
                
                // Add click handler to set as main preview
                thumbnail.querySelector('img').addEventListener('click', () => {
                    setMainPreview(imageUrl);
                });
                
                // Add click handler to remove image
                thumbnail.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(e.target.getAttribute('data-index'));
                    removeImage(index);
                });
                
                imageStrip.appendChild(thumbnail);
                
                // Show preview container if hidden
                if (imageStrip.children.length > 0) {
                    imagePreviewContainer.classList.remove('hidden');
                    
                    // If this is the first image, set it as main preview
                    if (uploadedImages.length === 1) {
                        setMainPreview(imageUrl);
                    }
                }
            };
            
            reader.readAsDataURL(file);
        });
    });
    
    // Set main preview image
    function setMainPreview(imageUrl) {
        mainPreview.src = imageUrl;
        mainImagePreview.classList.remove('hidden');
        
        // Update active state on thumbnails
        document.querySelectorAll('#image-strip-container img').forEach((img, index) => {
            if (img.src === imageUrl) {
                img.classList.add('border-brand-indigo', 'dark:border-brand-yellow');
                img.classList.remove('border-transparent');
            } else {
                img.classList.remove('border-brand-indigo', 'dark:border-brand-yellow');
                img.classList.add('border-transparent');
            }
        });
    }
    
    // Remove image from preview
    function removeImage(index) {
        // Remove from array
        uploadedImages.splice(index, 1);
        
        // Remove from DOM
        const thumbnails = document.querySelectorAll('#image-strip-container > div');
        if (thumbnails[index]) {
            thumbnails[index].remove();
        }
        
        // Update data-index attributes
        document.querySelectorAll('#image-strip-container [data-index]').forEach((btn, i) => {
            btn.setAttribute('data-index', i);
        });
        
        // Hide preview container if no images left
        if (uploadedImages.length === 0) {
            imagePreviewContainer.classList.add('hidden');
            mainImagePreview.classList.add('hidden');
        } 
        // If we removed the currently displayed image, show the first one
        else if (mainPreview.src === uploadedImages[index]) {
            setMainPreview(uploadedImages[0]);
        }
    }
    
    // Scroll buttons
    scrollLeftBtn.addEventListener('click', () => {
        imageStrip.scrollBy({ left: -150, behavior: 'smooth' });
    });
    
    scrollRight.addEventListener('click', () => {
        imageStrip.scrollBy({ left: 150, behavior: 'smooth' });
    });
    
    // Drag and drop support
    const dropArea = fileUpload.closest('div[class*="border-dashed"]');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('border-brand-indigo', 'dark:border-brand-yellow', 'bg-opacity-50');
    }
    
    function unhighlight() {
        dropArea.classList.remove('border-brand-indigo', 'dark:border-brand-yellow', 'bg-opacity-50');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileUpload.files = files;
        
        // Trigger change event
        const event = new Event('change');
        fileUpload.dispatchEvent(event);
    }
});
