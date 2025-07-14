
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const serviceTypeSelect = document.getElementById('serviceType');
    const servicePreview = document.getElementById('service-preview');
    const fileUpload = document.getElementById('file-upload');
    const fileUploadFilename = document.getElementById('file-upload-filename');
    const whatsappButton = document.getElementById('whatsapp-submit');
    
    // Update service preview when service type changes
    if (serviceTypeSelect && servicePreview) {
        serviceTypeSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            servicePreview.textContent = selectedOption.value ? selectedOption.text : 'Not selected';
            
            // Update estimated cost and delivery time based on service type
            updateServiceDetails(selectedOption.value);
        });
    }
    
    // Handle file upload preview
    if (fileUpload && fileUploadFilename) {
        fileUpload.addEventListener('change', function() {
            if (this.files.length > 0) {
                const fileNames = [];
                for (let i = 0; i < this.files.length; i++) {
                    fileNames.push(this.files[i].name);
                }
                fileUploadFilename.textContent = `${this.files.length} file(s) selected: ${fileNames.join(', ')}`;
            } else {
                fileUploadFilename.textContent = '';
            }
        });
        
        // Add drag and drop functionality
        const dropZone = fileUpload.closest('.group').querySelector('.border-dashed');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropZone.classList.add('border-brand-indigo', 'dark:border-brand-yellow', 'bg-indigo-50', 'dark:bg-indigo-900/20');
        }
        
        function unhighlight() {
            dropZone.classList.remove('border-brand-indigo', 'dark:border-brand-yellow', 'bg-indigo-50', 'dark:bg-indigo-900/20');
        }
        
        dropZone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileUpload.files = files;
            
            // Trigger change event
            const event = new Event('change');
            fileUpload.dispatchEvent(event);
        }
    }
    
    // Form submission
    if (orderForm) {
        // Handle form submission
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm('email');
        });
        
        // Handle WhatsApp button click
        if (whatsappButton) {
            whatsappButton.addEventListener('click', function() {
                submitForm('whatsapp');
            });
        }
    }
    
    // Function to update service details in the summary
    function updateServiceDetails(serviceType) {
        const costElement = document.querySelector('.flex.justify-between.items-center.py-2.border-b.border-white\/10:nth-child(2) .font-medium');
        const timeElement = document.querySelector('.flex.justify-between.items-center.py-2.border-b.border-white\/10:nth-child(3) .font-medium');
        
        if (!costElement || !timeElement) return;
        
        const serviceDetails = {
            'rapid-prototyping': { cost: '$50 - $200', time: '2-5 business days' },
            '3d-design': { cost: '$100 - $500', time: '5-10 business days' },
            'production': { cost: 'Custom Quote', time: 'Varies by quantity' },
            'custom': { cost: 'Custom Quote', time: 'Varies by project' },
            '': { cost: '-', time: '-' }
        };
        
        const details = serviceDetails[serviceType] || serviceDetails[''];
        costElement.textContent = details.cost;
        timeElement.textContent = details.time;
    }
    
    // Function to handle form submission
    function submitForm(submissionType) {
        // Basic form validation
        const requiredFields = orderForm.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('border-red-500', 'dark:border-red-400');
                isValid = false;
                
                // Add event listener to remove error class when user starts typing
                field.addEventListener('input', function() {
                    if (field.value.trim()) {
                        field.classList.remove('border-red-500', 'dark:border-red-400');
                    }
                });
            }
        });
        
        if (!isValid) {
            // Scroll to the first error
            const firstError = orderForm.querySelector('.border-red-500, .dark\:border-red-400');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Get form data
        const formData = new FormData(orderForm);
        const formObject = {};
        
        for (let [key, value] of formData.entries()) {
            formObject[key] = value;
        }
        
        // Handle files if any
        const files = fileUpload.files;
        if (files.length > 0) {
            formObject.files = [];
            for (let i = 0; i < files.length; i++) {
                formObject.files.push(files[i].name);
            }
        }
        
        // In a real application, you would send this data to your server
        console.log('Form data:', formObject);
        
        // Show success message
        showSuccessMessage(submissionType);
    }
    
    // Function to show success message
    function showSuccessMessage(submissionType) {
        // Create and show a success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up';
        
        const icon = document.createElement('div');
        icon.className = 'mr-3';
        icon.innerHTML = `
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        
        const message = document.createElement('div');
        message.textContent = submissionType === 'whatsapp' 
            ? 'Opening WhatsApp with your order details...' 
            : 'Your order has been submitted successfully!';
        
        successMessage.appendChild(icon);
        successMessage.appendChild(message);
        document.body.appendChild(successMessage);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            successMessage.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-300');
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 300);
        }, 5000);
        
        // In a real application, you would redirect to WhatsApp with the order details
        if (submissionType === 'whatsapp') {
            const phoneNumber = '+201234567890'; // Replace with your WhatsApp number
            const message = `New 3D Printing Order:%0A` +
                          `Name: ${document.getElementById('fullName').value}%0A` +
                          `Service: ${document.getElementById('serviceType').options[document.getElementById('serviceType').selectedIndex].text}%0A` +
                          `Project: ${document.getElementById('projectDescription').value.substring(0, 100)}...`;
            
            // Open WhatsApp in a new tab
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        }
        
        // Reset form
        orderForm.reset();
        fileUploadFilename.textContent = '';
        updateServiceDetails('');
    }
});
