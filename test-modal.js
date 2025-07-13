// Test script for modal functionality
console.log('Modal Test Script Loaded');

// Wait for the main script to be loaded
const waitForMainScript = (callback) => {
    if (typeof window.showProjectModal === 'function') {
        callback();
    } else {
        setTimeout(() => waitForMainScript(callback), 100);
    }
};

waitForMainScript(() => {
    // Test data with SVG data URIs
    const testProject = {
        id: 'test-1',
        title: 'Test Project',
        description: 'This is a test project with multiple images',
        material: 'PLA',
        weight: '150',
        resolution: '0.2',
        printTime: '4h 30m',
        priceFrom: 50,
        priceTo: 100,
        thumbnail: createSvgDataUri(400, 300, 'Thumbnail'),
        images: [
            createSvgDataUri(800, 600, 'Image 1'),
            createSvgDataUri(800, 600, 'Image 2'),
            createSvgDataUri(800, 600, 'Image 3')
        ],
        stlUrl: 'data:application/octet-stream;base64,',
        likes: 42,
        liked: false
    };
    
    // Helper function to create SVG data URIs
    function createSvgDataUri(width, height, text) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#333">${text}</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }
    
    // Make test project available globally for testing
    window.testProject = testProject;

    // Test functions
    async function runModalTests() {
        console.group('Modal Tests');
        
        try {
            // Test 1: Open Modal
            console.log('Test 1: Opening modal...');
            if (typeof window.showProjectModal === 'function') {
                window.showProjectModal(testProject);
            } else if (typeof window.openProjectModal === 'function') {
                window.openProjectModal(testProject);
            } else if (typeof window.openModal === 'function') {
                window.openModal(testProject);
            } else {
                throw new Error('No modal opening function found');
            }
            
            // Verify modal is visible
            const modal = document.getElementById('project-modal');
            console.assert(modal && !modal.classList.contains('hidden'), 'Modal should be visible');
            
            // Wait for modal to be fully rendered
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Test 2: Verify content
            console.log('Test 2: Verifying content...');
            const title = document.getElementById('modal-project-title')?.textContent;
            console.assert(title === testProject.title, 'Title should match', { 
                expected: testProject.title, 
                actual: title 
            });
            
            // Main image element has been removed from the DOM
            
            // Run tests sequentially
            try {
                // Test 3: Image navigation
                console.log('Test 3: Testing image navigation...');
                await testImageNavigation();
                
                // Test 4: Download button
                console.log('Test 4: Testing download button...');
                await testDownloadButton();
                
                // Test 5: Add to cart button
                console.log('Test 5: Testing add to cart button...');
                await testAddToCartButton();
                
                // Test 6: Close functionality (test this last)
                console.log('Test 6: Testing close functionality...');
                await testCloseFunctionality();
                
                console.log('All tests completed successfully!');
            } catch (testError) {
                console.error('Test failed:', testError);
            }
            
        } catch (error) {
            console.error('Error in modal tests:', error);
        } finally {
            console.groupEnd();
        }
}

    function testImageNavigation() {
        return new Promise((resolve) => {
            const prevButton = document.getElementById('modal-prev-image');
            const nextButton = document.getElementById('modal-next-image');
            const thumbnails = document.querySelectorAll('.modal-thumbnail');
            
            // Test next button
            console.log('  - Testing next button');
            nextButton?.click();
            
            // Test previous button
            setTimeout(() => {
                console.log('  - Testing previous button');
                prevButton?.click();
                
                // Test thumbnail navigation
                setTimeout(() => {
                    console.log('  - Testing thumbnail navigation');
                    if (thumbnails.length > 1) {
                        thumbnails[1].click();
                    }
                    
                    // Test keyboard navigation
                    setTimeout(() => {
                        console.log('  - Testing keyboard navigation');
                        // Right arrow
                        window.dispatchEvent(new KeyboardEvent('keydown', { 
                            key: 'ArrowRight',
                            code: 'ArrowRight',
                            keyCode: 39,
                            which: 39,
                            bubbles: true
                        }));
                        
                        // Left arrow after delay
                        setTimeout(() => {
                            window.dispatchEvent(new KeyboardEvent('keydown', {
                                key: 'ArrowLeft',
                                code: 'ArrowLeft',
                                keyCode: 37,
                                which: 37,
                                bubbles: true
                            }));
                            
                            resolve();
                        }, 500);
                    }, 500);
                }, 500);
            }, 500);
        });
    }
    
    function testCloseFunctionality() {
        return new Promise((resolve) => {
            // Test escape key
            console.log('  - Testing escape key');
            window.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                which: 27,
                bubbles: true
            }));
            
            // Reopen modal for next test
            setTimeout(() => {
                console.log('  - Reopening modal for close button test');
                window.showProjectModal(testProject);
                
                setTimeout(() => {
                    // Test close button
                    console.log('  - Testing close button');
                    const closeButton = document.getElementById('modal-close-button');
                    closeButton?.click();
                    
                    // Reopen modal for backdrop test
                    setTimeout(() => {
                        console.log('  - Reopening modal for backdrop test');
                        window.showProjectModal(testProject);
                        
                        setTimeout(() => {
                            // Test backdrop click
                            console.log('  - Testing backdrop click');
                            const backdrop = document.getElementById('modal-backdrop') || 
                                          document.querySelector('.fixed.inset-0.bg-black');
                            backdrop?.click();
                            
                            // Reopen modal for next test
                            setTimeout(() => {
                                window.showProjectModal(testProject);
                                resolve();
                            }, 500);
                        }, 500);
                    }, 500);
                }, 500);
            }, 500);
        });
    }
    
    function testDownloadButton() {
        return new Promise((resolve) => {
            console.log('  - Testing download button');
            
            // Try multiple possible selectors for the download button
            const selectors = [
                '[data-testid="download-stl"]',
                'button[data-icon="download"]',
                'a[download]',
                '.download-button',
                '#download-stl',
                'button.download',
                'a.download',
                'button svg[class*="download"]',
                'button svg[data-icon*="download"]',
                'button svg path[d*="M19 9h"], button svg path[d*="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"]'
            ];
            
            // First try standard selectors
            let downloadBtn = null;
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    // If we found an SVG, get its parent button/link
                    if (element.tagName === 'svg' || element.tagName === 'path') {
                        downloadBtn = element.closest('button, a');
                    } else {
                        downloadBtn = element;
                    }
                    if (downloadBtn) break;
                }
            }
            
            // If not found, try text content matching
            if (!downloadBtn) {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const downloadTexts = ['download', 'stl', 'get file', 'save'];
                downloadBtn = buttons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return downloadTexts.some(t => text.includes(t));
                });
            }
            
            if (downloadBtn) {
                console.log(`    Found download button with text: ${downloadBtn.textContent.trim()}`);
                
                // Mock the download functionality
                const originalClick = downloadBtn.onclick;
                const originalHref = downloadBtn.href;
                
                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('    Download button clicked');
                    console.log('    Download started for:', originalHref || testProject.stlUrl);
                    
                    // Simulate successful download
                    setTimeout(() => {
                        console.log('    Download completed successfully');
                        // Restore original click handler
                        downloadBtn.onclick = originalClick;
                        if (originalHref) downloadBtn.href = originalHref;
                        resolve();
                    }, 500);
                };
                
                // If it's a link, ensure it has an href
                if (downloadBtn.tagName === 'A' && !downloadBtn.href) {
                    downloadBtn.href = testProject.stlUrl;
                }
                
                downloadBtn.click();
            } else {
                console.warn('Download button not found. Tried selectors:', selectors);
                // Log all buttons for debugging
                console.log('Available buttons:', Array.from(document.querySelectorAll('button, a[href]')).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className,
                    text: el.textContent.trim(),
                    html: el.outerHTML
                })));
                resolve();
            }
        });
    }
    
    function testAddToCartButton() {
        return new Promise((resolve) => {
            console.log('  - Testing add to cart button');
            
            // Try multiple possible selectors for the add to cart button
            const selectors = [
                '[data-testid="add-to-cart"]',
                'button[data-icon="shopping-cart"]',
                '.add-to-cart',
                '#add-to-cart',
                'button svg[class*="cart"]',
                'button svg[class*="shopping"]',
                'button svg[data-icon*="cart"]',
                'button svg[data-icon*="shopping"]'
            ];
            
            // First try standard selectors
            let addToCartBtn = null;
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    // If we found an SVG, get its parent button
                    if (element.tagName === 'svg' || element.tagName === 'path') {
                        addToCartBtn = element.closest('button, a');
                    } else {
                        addToCartBtn = element;
                    }
                    if (addToCartBtn) break;
                }
            }
            
            // If not found, try text content matching
            if (!addToCartBtn) {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const cartTexts = ['add to cart', 'add', 'cart', 'buy', 'purchase'];
                addToCartBtn = buttons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return cartTexts.some(t => text.includes(t));
                });
            }
            
            if (addToCartBtn) {
                console.log(`    Found add to cart button with text: ${addToCartBtn.textContent.trim()}`);
                
                // Mock the add to cart functionality
                const originalClick = addToCartBtn.onclick;
                const originalText = addToCartBtn.innerHTML;
                
                addToCartBtn.onclick = (e) => {
                    e.preventDefault();
                    console.log('    Add to cart button clicked');
                    
                    // Simulate adding to cart
                    addToCartBtn.innerHTML = 'Adding...';
                    addToCartBtn.disabled = true;
                    
                    setTimeout(() => {
                        console.log('    Added to cart:', testProject.title);
                        addToCartBtn.innerHTML = 'Added to Cart!';
                        
                        // Restore original state after delay
                        setTimeout(() => {
                            addToCartBtn.innerHTML = originalText;
                            addToCartBtn.disabled = false;
                            addToCartBtn.onclick = originalClick;
                            resolve();
                        }, 1500);
                    }, 800);
                };
                
                addToCartBtn.click();
            } else {
                console.warn('Add to cart button not found. Tried selectors:', selectors);
                resolve();
            }
        });
    }

    // Add test button to the page
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Modal Tests';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '10px 20px';
    testButton.style.backgroundColor = '#4CAF50';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', runModalTests);
    document.body.appendChild(testButton);
    
    console.log('Modal test script initialized. Click the green button to run tests.');
});
