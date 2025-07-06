document.addEventListener('DOMContentLoaded', () => {
    const featuredList = document.querySelector('.featured-list');
    const tableBody = featuredList ? featuredList.querySelector('.table-list tbody') : null;
    const mainContentArea = document.querySelector('.col-9.page-content');
    const sidebar = document.querySelector('aside.col-3');

    if (!tableBody || !mainContentArea || !sidebar) {
        console.error('Could not find essential elements (torrent list table, main content area, or sidebar). Make sure the HTML structure is as expected.');
        return;
    }

    // Create the new container for the horizontal sidebar content
    const horizontalSidebarContainer = document.createElement('div');
    horizontalSidebarContainer.classList.add('horizontal-sidebar-container');

    // Move the content from the sidebar to the new horizontal container
    Array.from(sidebar.children).forEach(child => {
        horizontalSidebarContainer.appendChild(child);
    });
    
    // Insert the new horizontal sidebar container at the top of the main content wrapper
    const mainWrapper = document.querySelector('main.container');
    if (mainWrapper) {
        mainWrapper.insertBefore(horizontalSidebarContainer, mainContentArea.closest('.row') || mainContentArea);
    } else {
        mainContentArea.parentNode.insertBefore(horizontalSidebarContainer, mainContentArea);
    }

    const cardsContainer = document.createElement('div');
    cardsContainer.classList.add('torrent-cards-container');
    featuredList.appendChild(cardsContainer);

    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    featuredList.appendChild(spinner);

    // --- Infinite Scrolling Variables ---
    let currentPage = 1;
    let lastPage = 1;
    let isLoadingMore = false;

    // Ensure the original table is NOT hidden by previous styles
    const originalTableWrap = featuredList.querySelector('.table-list-wrap');
    if (originalTableWrap) {
        originalTableWrap.style.display = 'block';
    }
    const originalPagination = featuredList.querySelector('.pagination');
    if (originalPagination) {
        originalPagination.style.display = 'block';
        featuredList.appendChild(originalPagination);
    }

    // --- Global Modal Elements Setup ---
    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('image-modal-overlay');
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    modalOverlay.setAttribute('aria-hidden', 'true');

    const modalContent = document.createElement('div');
    modalContent.classList.add('image-modal-content');
    modalContent.setAttribute('role', 'document');

    const modalImage = document.createElement('img');
    modalImage.setAttribute('alt', 'Expanded image');
    modalContent.appendChild(modalImage);

    const modalImageSpinner = document.createElement('div');
    modalImageSpinner.classList.add('modal-image-spinner');
    modalContent.appendChild(modalImageSpinner);

    const modalPrevBtn = document.createElement('button');
    modalPrevBtn.classList.add('modal-nav-btn', 'prev');
    modalPrevBtn.innerHTML = '&leftarrow;';
    modalPrevBtn.setAttribute('aria-label', 'Previous image');
    modalContent.appendChild(modalPrevBtn);

    const modalNextBtn = document.createElement('button');
    modalNextBtn.classList.add('modal-nav-btn', 'next');
    modalNextBtn.innerHTML = '&rightarrow;';
    modalNextBtn.setAttribute('aria-label', 'Next image');
    modalContent.appendChild(modalNextBtn);

    const closeModalBtn = document.createElement('button');
    closeModalBtn.classList.add('image-modal-close-btn');
    closeModalBtn.innerHTML = '&times;';
    closeModalBtn.setAttribute('aria-label', 'Close image modal');
    modalContent.appendChild(closeModalBtn);

    const modalIndicatorsContainer = document.createElement('div');
    modalIndicatorsContainer.classList.add('modal-carousel-indicators');
    modalContent.appendChild(modalIndicatorsContainer);

    const modalProgressBar = document.createElement('div');
    modalProgressBar.classList.add('modal-carousel-progress');
    const modalProgressBarFill = document.createElement('div');
    modalProgressBarFill.classList.add('modal-carousel-progress-fill');
    modalProgressBar.appendChild(modalProgressBarFill);
    modalContent.appendChild(modalProgressBar);

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Global state for modal navigation
    let currentModalImages = [];
    let currentModalIndex = 0;
    let autoScrollInterval;
    const AUTO_SCROLL_DURATION = 5000;

    const startAutoScroll = () => {
        stopAutoScroll();
        if (currentModalImages.length <= 1) return;

        let startTime;
        const animateProgressBar = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = (elapsed / AUTO_SCROLL_DURATION) * 100;
            modalProgressBarFill.style.width = `${progress}%`;

            if (elapsed < AUTO_SCROLL_DURATION) {
                autoScrollInterval = requestAnimationFrame(animateProgressBar);
            } else {
                modalNextBtn.click();
                startAutoScroll();
            }
        };
        autoScrollInterval = requestAnimationFrame(animateProgressBar);
    };

    const stopAutoScroll = () => {
        if (autoScrollInterval) {
            cancelAnimationFrame(autoScrollInterval);
            autoScrollInterval = null;
        }
        modalProgressBarFill.style.transition = 'none';
        modalProgressBarFill.style.width = '0%';
        setTimeout(() => {
            modalProgressBarFill.style.transition = 'width linear';
        }, 50);
    };

    const loadImageInModal = (index) => {
        if (index < 0 || index >= currentModalImages.length) {
            console.warn("Invalid image index for modal.");
            return;
        }

        modalImage.classList.add('loading');
        modalImage.style.opacity = '0.5';

        const imageUrlToLoad = currentModalImages[index];

        const img = new Image();
        img.src = imageUrlToLoad;
        img.onload = () => {
            modalImage.src = imageUrlToLoad;
            modalImage.setAttribute('alt', `Image ${index + 1} of ${currentModalImages.length}`);
            modalImage.classList.remove('loading');
            modalImage.style.opacity = '1';
            startAutoScroll();
        };
        img.onerror = () => {
            console.error('Failed to load modal image:', imageUrlToLoad);
            modalImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="16" fill="%23555">Error</text></svg>';
            modalImage.setAttribute('alt', 'Error loading image');
            modalImage.classList.remove('loading');
            modalImage.style.opacity = '1';
            startAutoScroll();
        };

        if (currentModalImages.length > 1) {
            const nextIndex = (index + 1) % currentModalImages.length;
            const prevIndex = (index - 1 + currentModalImages.length) % currentModalImages.length;
            new Image().src = currentModalImages[nextIndex];
            new Image().src = currentModalImages[prevIndex];
        }

        updateIndicators();
    };

    const updateModalDisplay = () => {
        if (currentModalImages.length > 0) {
            loadImageInModal(currentModalIndex);

            if (currentModalImages.length <= 1) {
                modalPrevBtn.classList.add('hidden');
                modalNextBtn.classList.add('hidden');
                modalIndicatorsContainer.innerHTML = '';
                modalProgressBar.style.display = 'none';
                stopAutoScroll();
            } else {
                modalPrevBtn.classList.remove('hidden');
                modalNextBtn.classList.remove('hidden');
                modalProgressBar.style.display = 'block';
                createIndicators();
            }
        }
    };

    const createIndicators = () => {
        modalIndicatorsContainer.innerHTML = '';
        currentModalImages.forEach((_, index) => {
            const indicator = document.createElement('span');
            indicator.classList.add('modal-carousel-indicator');
            indicator.setAttribute('role', 'button');
            indicator.setAttribute('aria-label', `View image ${index + 1}`);
            indicator.setAttribute('tabindex', '0');
            if (index === currentModalIndex) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            } else {
                indicator.setAttribute('aria-current', 'false');
            }
            indicator.addEventListener('click', () => {
                stopAutoScroll();
                currentModalIndex = index;
                updateModalDisplay();
            });
            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    indicator.click();
                }
            });
            modalIndicatorsContainer.appendChild(indicator);
        });
    };

    const updateIndicators = () => {
        const indicators = modalIndicatorsContainer.querySelectorAll('.modal-carousel-indicator');
        indicators.forEach((indicator, index) => {
            if (index === currentModalIndex) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            } else {
                indicator.classList.remove('active');
                indicator.setAttribute('aria-current', 'false');
            }
        });
    };

    modalPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopAutoScroll();
        currentModalIndex = (currentModalIndex > 0) ? currentModalIndex - 1 : currentModalImages.length - 1;
        updateModalDisplay();
    });

    modalNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopAutoScroll();
        currentModalIndex = (currentModalIndex < currentModalImages.length - 1) ? currentModalIndex + 1 : 0;
        updateModalDisplay();
    });

    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('visible');
        modalOverlay.setAttribute('aria-hidden', 'true');
        stopAutoScroll();
    });
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('visible');
            modalOverlay.setAttribute('aria-hidden', 'true');
            stopAutoScroll();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (modalOverlay.classList.contains('visible')) {
            if (e.key === 'Escape') {
                modalOverlay.classList.remove('visible');
                modalOverlay.setAttribute('aria-hidden', 'true');
                stopAutoScroll();
            } else if (e.key === 'ArrowLeft') {
                modalPrevBtn.click();
            } else if (e.key === 'ArrowRight') {
                modalNextBtn.click();
            }
        }
    });

    modalContent.addEventListener('mouseenter', stopAutoScroll);
    modalContent.addEventListener('mouseleave', () => {
        if (modalOverlay.classList.contains('visible') && currentModalImages.length > 1) {
            startAutoScroll();
        }
    });

    const getHighResImageUrl = (url) => {
        if (!url) return null;
        let highResUrl = url;

        if (highResUrl.includes('photobucket.com') && highResUrl.includes('?width=')) {
            highResUrl = highResUrl.split('?')[0];
        }

        if (highResUrl.includes('imgtraffic.com')) {
            if (highResUrl.includes('/1s/')) {
                highResUrl = highResUrl.replace('/1s/', '/1/');
            } else if (highResUrl.includes('/i-1/')) {
                highResUrl = highResUrl.replace('/i-1/', '/1/');
            }
            if (highResUrl.endsWith('.html')) {
                highResUrl = highResUrl.slice(0, -5);
            }
        }
        return highResUrl;
    };

    // --- Enhanced Grab-to-Scroll Functionality ---
    document.querySelectorAll('.torrent-card .image-gallery-stack').forEach(gallery => {
        let isDown = false;
        let startX;
        let scrollLeft;
        let velocity = 0;
        let animationFrame;
        let lastTime = 0;
        const friction = 0.9;
        const minVelocity = 0.5;

        const animate = () => {
            if (Math.abs(velocity) > minVelocity) {
                gallery.scrollLeft += velocity;
                velocity *= friction;
                animationFrame = requestAnimationFrame(animate);
            } else {
                velocity = 0;
                cancelAnimationFrame(animationFrame);
            }
        };

        gallery.addEventListener('mousedown', (e) => {
            isDown = true;
            gallery.classList.add('active');
            startX = e.pageX - gallery.offsetLeft;
            scrollLeft = gallery.scrollLeft;
            velocity = 0;
            lastTime = performance.now();
        });

        gallery.addEventListener('mouseleave', () => {
            if (isDown) {
                isDown = false;
                gallery.classList.remove('active');
                if (Math.abs(velocity) > minVelocity) {
                    animate();
                }
            }
        });

        gallery.addEventListener('mouseup', () => {
            if (isDown) {
                isDown = false;
                gallery.classList.remove('active');
                if (Math.abs(velocity) > minVelocity) {
                    animate();
                }
            }
        });

        gallery.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const now = performance.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            
            const x = e.pageX - gallery.offsetLeft;
            const walk = (x - startX) * 2;
            
            if (deltaTime > 0) {
                velocity = (walk - (gallery.scrollLeft - scrollLeft)) / deltaTime * 1000;
            }
            
            gallery.scrollLeft = scrollLeft - walk;
        });

        gallery.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - gallery.offsetLeft;
            scrollLeft = gallery.scrollLeft;
            velocity = 0;
            lastTime = performance.now();
            gallery.classList.add('active');
        }, { passive: false });

        gallery.addEventListener('touchend', () => {
            if (isDown) {
                isDown = false;
                gallery.classList.remove('active');
                if (Math.abs(velocity) > minVelocity) {
                    animate();
                }
            }
        }, { passive: false });

        gallery.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const now = performance.now();
            const deltaTime = now - lastTime;
            lastTime = now;
            
            const x = e.touches[0].pageX - gallery.offsetLeft;
            const walk = (x - startX) * 2;
            
            if (deltaTime > 0) {
                velocity = (walk - (gallery.scrollLeft - scrollLeft)) / deltaTime * 1000;
            }
            
            gallery.scrollLeft = scrollLeft - walk;
        }, { passive: false });
    });

    // --- Lazy Loading with IntersectionObserver ---
    const lazyLoadImage = (imgElement) => {
        if (imgElement.dataset.src) {
            const handleLoad = () => {
                imgElement.classList.add('loaded');
                const skeleton = imgElement.nextElementSibling;
                if (skeleton && skeleton.classList.contains('image-skeleton')) {
                    skeleton.remove();
                }
                const card = imgElement.closest('.torrent-card');
                if (card) {
                    addCardImageInteractions(imgElement, card);
                }
                imgElement.removeEventListener('load', handleLoad);
                imgElement.removeEventListener('error', handleError);
            };

            const handleError = () => {
                console.error('Failed to load image:', imgElement.src);
                imgElement.classList.add('loaded');
                const skeleton = imgElement.nextElementSibling;
                if (skeleton && skeleton.classList.contains('image-skeleton')) {
                    skeleton.remove();
                }
                imgElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="16" fill="%23555">Error</text></svg>';
                imgElement.removeEventListener('load', handleLoad);
                imgElement.removeEventListener('error', handleError);
            };

            imgElement.addEventListener('load', handleLoad);
            imgElement.addEventListener('error', handleError);

            imgElement.src = imgElement.dataset.src;

            if (imgElement.complete && imgElement.naturalHeight !== 0) {
                handleLoad();
            }
            imgElement.removeAttribute('data-src');
        }
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imgElement = entry.target;
                lazyLoadImage(imgElement);
                observer.unobserve(imgElement);
            }
        });
    }, {
        rootMargin: '0px 0px 100px 0px',
        threshold: 0.01
    });

    function addCardImageInteractions(imgElement, card) {
        imgElement.addEventListener('click', () => {
            const postImages = JSON.parse(card.dataset.imageUrls);
            const clickedImageIndex = parseInt(imgElement.dataset.imageIndex);

            if (postImages && postImages.length > 0) {
                currentModalImages = postImages;
                currentModalIndex = clickedImageIndex;

                modalOverlay.classList.add('visible');
                modalOverlay.setAttribute('aria-hidden', 'false');
                updateModalDisplay();
            }
        });
    }

    const processTorrent = async (row) => {
        const nameCell = row.querySelector('.coll-1.name');
        if (!nameCell) {
            console.warn('Skipping row: Missing .coll-1.name cell', row.outerHTML);
            return;
        }

        const torrentLink = nameCell.querySelector('a[href^="/torrent/"]');

        if (!torrentLink || !torrentLink.href) {
            console.warn('Skipping row: Could not find valid torrent detail link in .coll-1.name. Row HTML:', row.outerHTML);
            return;
        }

        const title = torrentLink.textContent.trim();
        const detailPageUrl = torrentLink.href;

        const seeds = row.querySelector('.coll-2.seeds')?.textContent.trim() || 'N/A';
        const leeches = row.querySelector('.coll-3.leeches')?.textContent.trim() || 'N/A';
        const time = row.querySelector('.coll-date')?.textContent.trim() || 'N/A';
        const size = row.querySelector('.coll-4.size')?.textContent.trim().replace(/\s*\(.*\)/, '') || 'N/A';
        const uploader = row.querySelector('.coll-5 a')?.textContent.trim() || 'N/A';

        let imageUrls = new Set();
        let magnetLink = '';

        try {
            const response = await fetch(detailPageUrl);
            if (!response.ok) {
                console.error(`Error fetching detail page for ${title} (${detailPageUrl}): HTTP status ${response.status}`);
                magnetLink = '#';
            } else {
                const detailPageHtml = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(detailPageHtml, 'text/html');

                const descrImages = doc.querySelectorAll('.tab-pane#description img.descrimg');
                descrImages.forEach(img => {
                    const url = img.getAttribute('data-original') || img.src;
                    if (url) {
                        const highResUrl = getHighResImageUrl(url);
                        if (highResUrl) imageUrls.add(highResUrl);
                    }
                });

                const modalLinks = doc.querySelectorAll('.tab-pane#description a.js-modal-url');
                modalLinks.forEach(link => {
                    const href = link.href;
                    const potentialImageUrl = getHighResImageUrl(href);
                    const commonImageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'];
                    const isLikelyImage = commonImageExtensions.some(ext => potentialImageUrl.toLowerCase().endsWith(ext));

                    if (potentialImageUrl && isLikelyImage) {
                        imageUrls.add(potentialImageUrl);
                    }
                });

                const magnetAnchor = doc.querySelector('a[href^="magnet:?xt=urn:btih:"]');
                if (magnetAnchor) {
                    magnetLink = magnetAnchor.href;
                } else {
                    magnetLink = '#';
                    console.warn(`Magnet link not found on detail page for: ${title}`);
                }
            }

        } catch (error) {
            console.error(`Error during detail page processing for ${title} (${detailPageUrl}):`, error);
            magnetLink = '#';
        }

        const finalImageUrls = Array.from(imageUrls);
        finalImageUrls.reverse();

        let imagesHtml;
        if (finalImageUrls.length > 0) {
            imagesHtml = finalImageUrls.map((url, index) => `
                <img class="lazy-image" data-src="${url}" alt="${title}" data-image-index="${index}">
                <div class="image-skeleton"></div>
            `).join('');
        } else {
            imagesHtml = `<div class="no-image-placeholder">No Images Available</div>`;
        }

        const card = document.createElement('div');
        card.classList.add('torrent-card');
        card.dataset.imageUrls = JSON.stringify(finalImageUrls);

        card.innerHTML = `
            <div class="image-gallery-stack">
                ${imagesHtml}
            </div>
            <div class="card-content">
                <a href="${detailPageUrl}" class="card-title">${title}</a>
                <div class="card-details">
                    <p><strong>Seeds:</strong> <span class="seeds">${seeds}</span></p>
                    <p><strong>Leeches:</strong> <span class="leeches">${leeches}</span></p>
                    <p><strong>Size:</strong> ${size}</p>
                    <p><strong>Uploaded:</strong> ${uploader} (${time})</p>
                </div>
                <a href="${magnetLink}" class="magnet-download-btn" target="_blank">Magnet Download</a>
            </div>
        `;

        cardsContainer.appendChild(card);

        const lazyImages = card.querySelectorAll('.lazy-image');
        lazyImages.forEach(img => imageObserver.observe(img));
    };

    const fetchAndProcessTorrents = async (pageNumber) => {
        isLoadingMore = true;
        spinner.style.display = 'block';

        const currentPath = window.location.pathname;
        const parts = currentPath.split('/');
        parts[parts.length - 2] = pageNumber.toString();
        let nextPageUrl = parts.join('/');
        if (!nextPageUrl.endsWith('/')) {
             nextPageUrl += '/';
        }

        try {
            const response = await fetch(nextPageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newTorrentRows = Array.from(doc.querySelectorAll('.table-list tbody tr'));
            if (newTorrentRows.length === 0) {
                console.log('No more torrents found on page', pageNumber);
                lastPage = currentPage - 1;
            } else {
                for (const row of newTorrentRows) {
                    await processTorrent(row);
                }
            }

            const fetchedPaginationDiv = doc.querySelector('.featured-list .pagination');
            if (fetchedPaginationDiv) {
                const lastPageLink = fetchedPaginationDiv.querySelector('li.last a');
                if (lastPageLink) {
                    const match = lastPageLink.href.match(/\/(\d+)\/$/);
                    if (match && match[1]) {
                        lastPage = parseInt(match[1]);
                    }
                } else {
                    const allPageLinks = fetchedPaginationDiv.querySelectorAll('li a');
                    if (allPageLinks.length > 0) {
                        const maxPageNum = Array.from(allPageLinks).reduce((max, link) => {
                            const numMatch = link.href.match(/\/(\d+)\/$/);
                            return numMatch ? Math.max(max, parseInt(numMatch[1])) : max;
                        }, 1);
                        lastPage = maxPageNum;
                    }
                }
            } else {
                lastPage = currentPage;
            }

            currentPage++;

        } catch (error) {
            console.error('Error fetching more torrents:', error);
            lastPage = currentPage - 1;
        } finally {
            isLoadingMore = false;
            spinner.style.display = 'none';
        }
    };

    const infiniteScrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoadingMore && currentPage <= lastPage) {
                console.log(`Loading page ${currentPage}. Last page is ${lastPage}.`);
                fetchAndProcessTorrents(currentPage);
            } else if (entry.isIntersecting && currentPage > lastPage && !isLoadingMore) {
                console.log('Reached the last page. No more content to load.');
                spinner.style.display = 'none';
            }
        });
    }, {
        rootMargin: '0px 0px 200px 0px',
        threshold: 0.1
    });

    const initialTorrentRows = Array.from(tableBody.querySelectorAll('tr'));
    const processInitialRows = async () => {
        for (const row of initialTorrentRows) {
            await processTorrent(row);
        }
        spinner.style.display = 'none';

        const initialPaginationDiv = document.querySelector('.featured-list .pagination');
        if (initialPaginationDiv) {
            const lastPageLink = initialPaginationDiv.querySelector('li.last a');
            if (lastPageLink) {
                const match = lastPageLink.href.match(/\/(\d+)\/$/);
                if (match && match[1]) {
                    lastPage = parseInt(match[1]);
                }
            } else {
                const allPageLinks = initialPaginationDiv.querySelectorAll('li a');
                if (allPageLinks.length > 0) {
                    const maxPageNum = Array.from(allPageLinks).reduce((max, link) => {
                        const numMatch = link.href.match(/\/(\d+)\/$/);
                        return numMatch ? Math.max(max, parseInt(numMatch[1])) : max;
                    }, 1);
                    lastPage = maxPageNum;
                }
            }
        }
        currentPage = 2;
    };

    processInitialRows().then(() => {
        infiniteScrollObserver.observe(spinner);
    });

    // --- Scroll-to-Top Button Logic ---
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scroll-to-top';
    scrollToTopBtn.innerHTML = '&uarr;';
    document.body.appendChild(scrollToTopBtn);

    const toggleScrollToTopButton = () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    };

    window.addEventListener('scroll', toggleScrollToTopButton);

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});