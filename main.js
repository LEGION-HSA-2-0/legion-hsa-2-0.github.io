// Navbar Scroll Effect
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;

    revealElements.forEach(el => {
        if (el.classList.contains('active')) return; // already revealed, avoid layout reads
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
};

const revealHashTarget = () => {
    if (!window.location.hash || window.location.hash.length <= 1) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const hashTarget = document.getElementById(id);
    if (!hashTarget) return;
    if (hashTarget.classList.contains('reveal')) {
        hashTarget.classList.add('active');
    }
    const parentReveal = hashTarget.closest('.reveal');
    if (parentReveal) {
        parentReveal.classList.add('active');
    }
};

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', () => {
    revealHashTarget();
    revealOnScroll();
});
window.addEventListener('hashchange', () => {
    revealHashTarget();
    revealOnScroll();
});
revealHashTarget();
revealOnScroll(); // Initial check

// Smooth Scrolling for Anchor Links
function handleSmoothAnchorClick(e) {
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    if (typeof closeNewsModal === 'function' && isNewsModalOpen) {
        closeNewsModal();
    }
    const certDialog = document.getElementById('certificateModal');
    if (certDialog && certDialog.open && typeof closeTopLayer === 'function') {
        closeTopLayer(certDialog);
    }
    if (href === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    const target = document.querySelector(href);
    if (target) {
        if (target.closest('#news .grid') && target.classList.contains('card')) {
            if (typeof focusNewsCardByElement === 'function') {
                focusNewsCardByElement(target);
            }
            if (history.replaceState) {
                history.replaceState(null, '', href);
            }
            revealOnScroll();
            return;
        }
        if (target.classList.contains('reveal')) {
            target.classList.add('active');
        }
        // Walk offsetParent chain to ignore CSS transforms (e.g. .reveal translateY)
        let targetTop = 0;
        let node = target;
        while (node) {
            targetTop += node.offsetTop;
            node = node.offsetParent;
        }
        const offset = target.tagName === 'SECTION' ? 10 : 120;
        window.scrollTo({
            top: Math.max(0, targetTop - offset),
            behavior: 'smooth'
        });
        if (history.replaceState) {
            history.replaceState(null, '', href);
        }
        revealOnScroll();
    }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', handleSmoothAnchorClick);
});

// Smooth 3D Animation State
let targetTheta = 30, currentTheta = 30;
let targetPhi = 60, currentPhi = 60;
let targetRadius = 350, currentRadius = 350;
let isInteracting = false;
let interactionTimeout;
let smoothAnimateRAF = null;

const viewer = document.querySelector('model-viewer');

function requestSmoothAnimate() {
    if (!viewer || smoothAnimateRAF) return;
    smoothAnimateRAF = requestAnimationFrame(smoothAnimate);
}

if (viewer) {
    // Detect user interaction start
    viewer.addEventListener('mousedown', () => {
        isInteracting = true;
        requestSmoothAnimate();
    });
    viewer.addEventListener('touchstart', () => {
        isInteracting = true;
        requestSmoothAnimate();
    }, { passive: true });

    // Detect user interaction end + cooldown
    const endInteraction = () => {
        if (!isInteracting) return;
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            isInteracting = false;
            requestSmoothAnimate();
        }, 3000); // Wait 3s after interaction before resuming scroll-sync
    };

    window.addEventListener('mouseup', endInteraction);
    window.addEventListener('touchend', endInteraction);

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = 800;
        const scrollPercent = Math.min(scrollY / maxScroll, 1);

        targetTheta = 30 + (60 * scrollPercent);
        targetPhi = 60 + (30 * scrollPercent);
        targetRadius = 350 - (150 * scrollPercent);
        if (scrollY <= maxScroll + 400) {
            requestSmoothAnimate();
        }
    }, { passive: true });
}

function smoothAnimate() {
    smoothAnimateRAF = null;
    if (!viewer) return;

    const lerpFactor = 0.05;

    if (!isInteracting) {
        const dTheta = targetTheta - currentTheta;
        const dPhi = targetPhi - currentPhi;
        const dRadius = targetRadius - currentRadius;

        currentTheta += dTheta * lerpFactor;
        currentPhi += dPhi * lerpFactor;
        currentRadius += dRadius * lerpFactor;

        viewer.cameraOrbit = `${currentTheta}deg ${currentPhi}deg ${currentRadius}%`;

        if (Math.abs(dTheta) > 0.05 || Math.abs(dPhi) > 0.05 || Math.abs(dRadius) > 0.05) {
            requestSmoothAnimate();
        }
    } else {
        // Sync theta and phi from user drag without corrupting percentage radius with meter units
        if (typeof viewer.getCameraOrbit === 'function') {
            const orbit = viewer.getCameraOrbit();
            currentTheta = (orbit.theta * 180) / Math.PI;
            currentPhi = (orbit.phi * 180) / Math.PI;
        }
        requestSmoothAnimate();
    }
}

requestSmoothAnimate();

// 3D Model Fade-in & Progress Bar Loading
const modelViewers = document.querySelectorAll('model-viewer');
modelViewers.forEach(mv => {
    const container = mv.parentElement;
    const loader = container ? container.querySelector('.model-loader-container') : null;
    
    if (loader) {
        const fill = loader.querySelector('.model-loader-fill');
        const percentText = loader.querySelector('.model-loader-percent');
        let displayedProgress = 0;
        let isModelLoaded = Boolean(mv.loaded);
        let isInViewport = false;
        let isFinishing = false;

        // Disable transition on width during JS rAF animation for smooth tabular updates
        const setProgressUI = (progress) => {
            const clamped = Math.min(Math.max(progress, 0), 1);
            const percentage = Math.round(clamped * 100);
            if (fill) fill.style.width = `${percentage}%`;
            if (percentText) percentText.textContent = `${percentage}%`;
        };

        const runFinishAnimation = () => {
            if (isFinishing) return;
            isFinishing = true;

            const startProgress = displayedProgress;
            const duration = startProgress < 0.85 ? 550 : 200;
            const startTime = performance.now();

            const step = (now) => {
                const elapsed = now - startTime;
                const t = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - t, 3);
                const current = startProgress + (1 - startProgress) * eased;
                setProgressUI(current);

                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    setProgressUI(1.0);
                    mv.classList.add('visible');
                    setTimeout(() => {
                        loader.style.opacity = '0';
                        loader.style.transform = 'translate(-50%, -50%) scale(0.95)';
                        setTimeout(() => {
                            loader.style.display = 'none';
                        }, 500);
                    }, 220);
                }
            };

            requestAnimationFrame(step);
        };

        const checkReadyToFinish = () => {
            if (isModelLoaded && isInViewport && !isFinishing) {
                runFinishAnimation();
            }
        };

        mv.addEventListener('progress', (event) => {
            if (isFinishing) return;
            const rawProgress = (event.detail && typeof event.detail.totalProgress === 'number')
                ? event.detail.totalProgress
                : 0;
            // Only advance visible progress while in viewport so off-screen cards animate when scrolled to
            if (isInViewport) {
                displayedProgress = Math.max(displayedProgress, Math.min(rawProgress, 0.95));
                setProgressUI(displayedProgress);
            }
        });

        mv.addEventListener('load', () => {
            isModelLoaded = true;
            checkReadyToFinish();
        }, { once: true });

        if ('IntersectionObserver' in window && container) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        isInViewport = true;
                        observer.disconnect();
                        checkReadyToFinish();
                    }
                });
            }, { threshold: 0.15 });
            observer.observe(container);
        } else {
            isInViewport = true;
            checkReadyToFinish();
        }
    } else {
        if (mv.loaded) {
            mv.classList.add('visible');
        } else {
            mv.addEventListener('load', () => {
                mv.classList.add('visible');
            }, { once: true });
        }
    }
});

// Scroll Spy: Highlight active nav link & side dots
const sections = document.querySelectorAll('section, footer');
const navLinks = document.querySelectorAll('.nav-links a');
const sideDots = document.querySelectorAll('.side-dot');

const scrollSpy = () => {
    let current = '';
    const scrollPosition = window.scrollY + (window.innerHeight / 3); // Better trigger point

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50) {
            current = 'partners'; // Force last section at bottom
        } else if (scrollPosition >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    // Update main nav
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });

    // Update side dots
    sideDots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('href') === `#${current}`) {
            dot.classList.add('active');
        }
    });
};

window.addEventListener('scroll', scrollSpy, { passive: true });
window.addEventListener('load', scrollSpy);

// Mobile Menu Logic
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
const mobileLinks = document.querySelectorAll('.mobile-nav a');

if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = mobileNav.classList.toggle('active');
        mobileMenuBtn.textContent = isOpen ? '✕' : '☰';
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
        });
    });
}

// Dynamic Scroll Fade and Overflow Handler for Individual News Card Text & News Grid
// Optional pre-read values avoid extra layout reads when called from the rAF scroll sync.
function updateNewsGridScrollFade(scrollLeft, maxScroll) {
    const grid = document.querySelector('#news .grid');
    if (!grid) return;

    if (scrollLeft === undefined) scrollLeft = grid.scrollLeft;
    if (maxScroll === undefined) maxScroll = grid.scrollWidth - grid.clientWidth;

    // Fade only the right edge; the left edge is handled by the sticky stack (.is-stacked)
    const showRightFade = maxScroll > 2 && scrollLeft < maxScroll - 15;
    grid.classList.toggle('fade-right', showRightFade);
}

function updateCardMiniScrollbar(wrapper) {
    const scrollable = wrapper.querySelector('.news-text-scrollable');
    const track = wrapper.querySelector('.card-scrollbar-track');
    const thumb = wrapper.querySelector('.card-scrollbar-thumb');
    if (!scrollable || !track || !thumb) return;

    const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
    const hasOverflow = maxScroll > 2;

    if (!hasOverflow) {
        track.classList.remove('has-overflow');
        return;
    }

    track.classList.add('has-overflow');
    const maxThumbTravel = track.clientHeight - thumb.offsetHeight;
    if (maxThumbTravel > 0) {
        const scrollRatio = Math.min(Math.max(scrollable.scrollTop / maxScroll, 0), 1);
        const thumbY = scrollRatio * maxThumbTravel;
        thumb.style.transform = `translateY(${thumbY}px)`;
    }
}

function updateCardMiniScrollbars() {
    document.querySelectorAll('.news-text-wrapper').forEach(updateCardMiniScrollbar);
}

function initCardMiniScrollbars() {
    document.querySelectorAll('.news-text-wrapper').forEach(wrapper => {
        const scrollable = wrapper.querySelector('.news-text-scrollable');
        const track = wrapper.querySelector('.card-scrollbar-track');
        const thumb = wrapper.querySelector('.card-scrollbar-thumb');
        if (!scrollable || !track || !thumb || wrapper._scrollbarInitialized) return;
        wrapper._scrollbarInitialized = true;

        let textScrollRAF = null;
        scrollable.addEventListener('scroll', () => {
            if (textScrollRAF) return;
            textScrollRAF = requestAnimationFrame(() => {
                textScrollRAF = null;
                updateNewsTextFade(scrollable);
                updateCardMiniScrollbar(wrapper);
            });
        }, { passive: true });

        // Track click-to-jump
        track.addEventListener('mousedown', (e) => {
            if (e.target === thumb) return;
            const trackRect = track.getBoundingClientRect();
            const clickY = e.clientY - trackRect.top;
            const maxThumbTravel = track.clientHeight - thumb.offsetHeight;
            const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
            if (maxThumbTravel > 0 && maxScroll > 0) {
                const targetThumbTop = Math.min(Math.max(clickY - thumb.offsetHeight / 2, 0), maxThumbTravel);
                const targetScroll = (targetThumbTop / maxThumbTravel) * maxScroll;
                scrollable.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        });

        // Thumb drag
        let isDraggingThumb = false;
        let startY = 0;
        let startScrollTop = 0;

        thumb.addEventListener('pointerdown', (e) => {
            isDraggingThumb = true;
            thumb.classList.add('is-dragging');
            thumb.setPointerCapture(e.pointerId);
            startY = e.clientY;
            startScrollTop = scrollable.scrollTop;
            e.stopPropagation();
        });

        thumb.addEventListener('pointermove', (e) => {
            if (!isDraggingThumb) return;
            const diffY = e.clientY - startY;
            const maxThumbTravel = track.clientHeight - thumb.offsetHeight;
            const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
            if (maxThumbTravel > 0 && maxScroll > 0) {
                const scrollDiff = (diffY / maxThumbTravel) * maxScroll;
                scrollable.scrollTop = startScrollTop + scrollDiff;
            }
        });

        const stopDrag = () => {
            if (!isDraggingThumb) return;
            isDraggingThumb = false;
            thumb.classList.remove('is-dragging');
        };

        thumb.addEventListener('pointerup', stopDrag);
        thumb.addEventListener('pointercancel', stopDrag);
    });

    updateCardMiniScrollbars();
}

const NEWS_TEXT_FADES = {
    none: 'none',
    bottom: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
    top: 'linear-gradient(to bottom, transparent 0%, black 24px)',
    both: 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)'
};

function updateNewsTextFade(el) {
    let state = 'none';
    if (el.scrollHeight > el.clientHeight + 2) {
        const isAtTop = el.scrollTop <= 2;
        const isAtBottom = Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) <= 4;
        if (isAtTop && !isAtBottom) state = 'bottom';
        else if (isAtBottom && !isAtTop) state = 'top';
        else if (!isAtTop && !isAtBottom) state = 'both';
    }
    // Only touch styles when the fade state actually changes
    if (el.dataset.fadeState === state) return;
    el.dataset.fadeState = state;
    el.style.maskImage = NEWS_TEXT_FADES[state];
    el.style.webkitMaskImage = NEWS_TEXT_FADES[state];
}

function updateNewsScrollFades() {
    updateNewsGridScrollFade();
    updateCardMiniScrollbars();
    document.querySelectorAll('.news-text-scrollable').forEach(updateNewsTextFade);
}

// News Grid Navigation Buttons, Active Highlight & Centering Slideshow
const newsGrid = document.querySelector('#news .grid');
const newsSection = document.getElementById('news');
const newsPrevBtn = document.getElementById('newsPrevBtn');
const newsNextBtn = document.getElementById('newsNextBtn');

let newsAutoplayTimer = null;
let userHasInteractedWithNews = false;
let isMouseInsideNews = false;
let currentNewsIndex = 0;

function getNewsCards() {
    return newsGrid ? Array.from(newsGrid.querySelectorAll('.card')) : [];
}

// News Detail Modal (Expand / Lightbox) Logic
const newsModal = document.getElementById('newsModal');
const newsModalClose = document.getElementById('newsModalClose');
const modalNewsImg = document.getElementById('modalNewsImg');
const modalNewsCredit = document.getElementById('modalNewsCredit');
const modalNewsDate = document.getElementById('modalNewsDate');
const modalNewsTitle = document.getElementById('modalNewsTitle');
const modalNewsText = document.getElementById('modalNewsText');
const modalNewsLinks = document.getElementById('modalNewsLinks');
const newsModalCopyWrap = document.getElementById('newsModalCopyWrap');
const newsModalCopyBtn = document.getElementById('newsModalCopyBtn');
let isNewsModalOpen = false;

function openNewsModal(card) {
    if (!newsModal || !card) return;

    disableNewsAutoplay();

    // 1. Image & Photo credit
    const cardImg = card.querySelector('.card-image-wrapper img');
    const cardCredit = card.querySelector('.photocredit-tooltip');
    if (cardImg && modalNewsImg) {
        modalNewsImg.src = cardImg.src;
        modalNewsImg.alt = cardImg.alt || '';
        if (cardImg.style.objectPosition) {
            modalNewsImg.style.objectPosition = cardImg.style.objectPosition;
        } else {
            modalNewsImg.style.objectPosition = 'center';
        }
        if (cardImg.style.objectFit === 'contain') {
            modalNewsImg.classList.add('is-contain');
        } else {
            modalNewsImg.classList.remove('is-contain');
        }
    }
    if (modalNewsCredit) {
        if (cardCredit && cardCredit.textContent.trim()) {
            modalNewsCredit.textContent = cardCredit.textContent.trim();
            modalNewsCredit.style.display = 'block';
        } else {
            modalNewsCredit.style.display = 'none';
        }
    }

    // 2. Date & Accent Color
    const cardDate = card.querySelector('.card-date');
    const awardBadge = card.querySelector('.card-award-badge');
    const terracottaBadge = card.querySelector('.card-terracotta-badge');
    const pinnedBadge = card.querySelector('.card-pinned-badge');
    if (cardDate && modalNewsDate) {
        let prefixHtml = '';
        if (pinnedBadge) {
            prefixHtml += `<span class="card-pinned-badge" style="position: static; display: inline-flex; vertical-align: middle; margin-right: 0.5rem; padding: 2px 8px; font-size: 0.65rem;">${pinnedBadge.innerHTML}</span> `;
        }
        if (awardBadge) {
            prefixHtml += `<span class="card-award-badge" style="margin-right: 0.5rem; vertical-align: middle;">${awardBadge.innerHTML}</span> `;
        } else if (terracottaBadge) {
            prefixHtml += `<span class="card-terracotta-badge" style="margin-right: 0.5rem; vertical-align: middle;">${terracottaBadge.innerHTML}</span> `;
        }
        modalNewsDate.innerHTML = prefixHtml + cardDate.textContent;
        modalNewsDate.style.color = cardDate.style.color || 'var(--terracotta)';
    }

    // 3. Title
    const cardTitle = card.querySelector('h3');
    if (cardTitle && modalNewsTitle) {
        modalNewsTitle.textContent = cardTitle.textContent;
    }

    // 3b. Direct link copy control for this news item
    if (newsModalCopyWrap && newsModalCopyBtn) {
        if (card.id) {
            newsModalCopyWrap.style.display = 'inline-flex';
            newsModalCopyBtn.setAttribute('commandfor', card.id);
            const titleText = cardTitle ? cardTitle.textContent.trim() : 'news item';
            newsModalCopyBtn.setAttribute('aria-label', `Copy direct link to ${titleText}`);
            newsModalCopyBtn.removeAttribute('data-copied');
            newsModalCopyBtn.removeAttribute('data-failed');
            const tip = newsModalCopyWrap.querySelector('.copy-link-tip');
            if (tip) tip.textContent = '';
        } else {
            newsModalCopyWrap.style.display = 'none';
        }
    }

    // 4. Full Text
    const cardText = card.querySelector('.news-text-scrollable');
    if (cardText && modalNewsText) {
        modalNewsText.innerHTML = cardText.innerHTML;
        modalNewsText.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', handleSmoothAnchorClick);
        });
    }

    // 5. Links
    const cardLinks = card.querySelectorAll('.news-link');
    if (modalNewsLinks) {
        modalNewsLinks.innerHTML = '';
        if (cardLinks.length > 0) {
            cardLinks.forEach(link => {
                const clonedLink = link.cloneNode(true);
                if (clonedLink.getAttribute('href')?.startsWith('#')) {
                    clonedLink.addEventListener('click', handleSmoothAnchorClick);
                }
                modalNewsLinks.appendChild(clonedLink);
            });
            modalNewsLinks.style.display = 'flex';
        } else {
            modalNewsLinks.style.display = 'none';
        }
    }

    // 6. Accent color for modal bottom border
    const borderStyle = card.classList.contains('card-featured-award')
        ? '4px solid var(--award-gold, #f59e0b)'
        : (card.style.borderBottom || '4px solid var(--terracotta)');
    const modalContent = newsModal.querySelector('.news-modal-content');
    if (modalContent) {
        modalContent.style.borderBottom = borderStyle;
    }

    if (typeof newsModal.showModal === 'function') {
        newsModal.showModal();
    } else {
        newsModal.setAttribute('open', '');
    }

    isNewsModalOpen = true;
    document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
    if (!newsModal || !isNewsModalOpen) return;
    if (typeof newsModal.close === 'function') {
        newsModal.close();
    } else {
        newsModal.removeAttribute('open');
    }
    isNewsModalOpen = false;
    document.body.style.overflow = '';
}

if (newsModal) {
    if (newsModalClose) {
        newsModalClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeNewsModal();
        });
    }

    // Close when clicking on backdrop
    newsModal.addEventListener('click', (e) => {
        const modalContent = newsModal.querySelector('.news-modal-content');
        if (modalContent && !modalContent.contains(e.target)) {
            closeNewsModal();
        }
    });

    newsModal.addEventListener('cancel', () => {
        isNewsModalOpen = false;
        document.body.style.overflow = '';
    });
}

// Custom News Scrollbar Synchronization & Dragging
const newsScrollbarContainer = document.getElementById('newsScrollbar');
const newsScrollbarTrack = newsScrollbarContainer ? newsScrollbarContainer.querySelector('.news-scrollbar-track') : null;
const newsScrollbarThumb = newsScrollbarContainer ? newsScrollbarContainer.querySelector('.news-scrollbar-thumb') : null;

function showNewsScrollbar() {
    if (newsScrollbarContainer) {
        newsScrollbarContainer.classList.add('scrollbar-visible');
    }
}

function updateNewsScrollbarPosition() {
    if (!newsGrid || !newsScrollbarTrack || !newsScrollbarThumb) return;

    const maxScroll = newsGrid.scrollWidth - newsGrid.clientWidth;
    if (maxScroll <= 0) return;

    const scrollRatio = Math.max(0, Math.min(1, newsGrid.scrollLeft / maxScroll));
    const trackWidth = newsScrollbarTrack.clientWidth;

    const visibleRatio = Math.min(1, newsGrid.clientWidth / newsGrid.scrollWidth);
    const thumbWidth = Math.max(60, Math.min(140, trackWidth * visibleRatio));
    newsScrollbarThumb.style.width = thumbWidth + 'px';

    const maxThumbTravel = trackWidth - thumbWidth;
    const thumbPosition = scrollRatio * maxThumbTravel;
    newsScrollbarThumb.style.transform = `translateX(${thumbPosition}px)`;
}

// Drag & Click on Custom Scrollbar
if (newsScrollbarTrack && newsScrollbarThumb) {
    let isDraggingThumb = false;
    let thumbStartX = 0;
    let startScrollLeft = 0;
    let dragRAF = null;

    function onThumbDrag(e) {
        if (!isDraggingThumb) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - thumbStartX;
        const trackWidth = newsScrollbarTrack.clientWidth;
        const thumbWidth = newsScrollbarThumb.offsetWidth;
        const maxThumbTravel = trackWidth - thumbWidth;
        const maxScroll = newsGrid.scrollWidth - newsGrid.clientWidth;

        if (maxThumbTravel > 0) {
            const scrollDelta = (deltaX / maxThumbTravel) * maxScroll;
            const targetScroll = Math.max(0, Math.min(maxScroll, startScrollLeft + scrollDelta));
            if (dragRAF) cancelAnimationFrame(dragRAF);
            dragRAF = requestAnimationFrame(() => {
                newsGrid.scrollLeft = targetScroll;
            });
        }
    }

    function stopThumbDrag() {
        if (!isDraggingThumb) return;
        isDraggingThumb = false;
        if (dragRAF) cancelAnimationFrame(dragRAF);
        newsScrollbarThumb.classList.remove('is-dragging');
        document.body.style.userSelect = '';
        if (newsGrid) newsGrid.style.scrollSnapType = '';
        window.removeEventListener('mousemove', onThumbDrag);
        window.removeEventListener('mouseup', stopThumbDrag);
        window.removeEventListener('touchmove', onThumbDrag);
        window.removeEventListener('touchend', stopThumbDrag);
        setTimeout(updateActiveNewsCardOnScroll, 50);
    }

    newsScrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        disableNewsAutoplay();
        showNewsScrollbar();
        isDraggingThumb = true;
        thumbStartX = e.clientX;
        startScrollLeft = newsGrid.scrollLeft;
        newsScrollbarThumb.classList.add('is-dragging');
        document.body.style.userSelect = 'none';
        if (newsGrid) newsGrid.style.scrollSnapType = 'none';
        window.addEventListener('mousemove', onThumbDrag);
        window.addEventListener('mouseup', stopThumbDrag);
    });

    newsScrollbarThumb.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        disableNewsAutoplay();
        showNewsScrollbar();
        isDraggingThumb = true;
        thumbStartX = e.touches[0].clientX;
        startScrollLeft = newsGrid.scrollLeft;
        if (newsGrid) newsGrid.style.scrollSnapType = 'none';
        window.addEventListener('touchmove', onThumbDrag, { passive: false });
        window.addEventListener('touchend', stopThumbDrag);
    }, { passive: true });

    newsScrollbarTrack.addEventListener('click', (e) => {
        if (e.target === newsScrollbarThumb) return;
        disableNewsAutoplay();
        showNewsScrollbar();
        const trackRect = newsScrollbarTrack.getBoundingClientRect();
        const clickX = e.clientX - trackRect.left;
        const trackWidth = newsScrollbarTrack.clientWidth;
        const thumbWidth = newsScrollbarThumb.offsetWidth;
        const clickRatio = Math.max(0, Math.min(1, (clickX - thumbWidth / 2) / (trackWidth - thumbWidth)));
        const maxScroll = newsGrid.scrollWidth - newsGrid.clientWidth;
        newsGrid.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
    });
}

// --- Dedicated Docked News Tabs & Unified Carousel Geometry ---
const dockedTabAward = document.getElementById('dockedTabAward');
const dockedTabCenturia = document.getElementById('dockedTabCenturia');

let newsMetrics = null;

function measureNewsMetrics() {
    if (!newsGrid) return null;
    const cards = getNewsCards();
    if (!cards.length) return null;

    const isMobile = window.innerWidth <= 768;
    const cardWidth = cards[0].offsetWidth;
    const gridStyle = getComputedStyle(newsGrid);
    const gap = parseFloat(gridStyle.columnGap) || (isMobile ? 16 : 32);
    const pitch = cardWidth + gap;
    const tabWidth = isMobile ? 36 : 48;

    newsMetrics = {
        cardWidth,
        gap,
        pitch,
        tabWidth,
        count: cards.length
    };
    return newsMetrics;
}

function getNewsMetrics() {
    return newsMetrics || measureNewsMetrics();
}

function getNewsScrollTargetForIndex(index) {
    const m = getNewsMetrics();
    if (!m) return 0;
    if (index <= 0) return 0;
    if (index === 1) {
        return Math.max(0, m.pitch - m.tabWidth - 12);
    }
    return Math.max(0, (index * m.pitch) - (2 * m.tabWidth) - 12);
}

// While a programmatic smooth scroll runs, don't let intermediate scroll positions override the chosen card
let newsProgrammaticScrollUntil = 0;

function setActiveNewsCard(index, shouldScroll = true) {
    const cards = getNewsCards();
    if (!cards.length) return;

    currentNewsIndex = ((index % cards.length) + cards.length) % cards.length;

    // Show scrollbar automatically when 2nd card is active or upon interaction, and keep it visible
    if (currentNewsIndex >= 1 || userHasInteractedWithNews) {
        showNewsScrollbar();
    }

    cards.forEach((card, i) => {
        card.classList.toggle('is-active-news', i === currentNewsIndex);
    });

    if (shouldScroll && newsGrid) {
        const targetLeft = getNewsScrollTargetForIndex(currentNewsIndex);
        // Apply docked-tab classes/scroll-padding-left BEFORE scrollTo so scroll-snap aligns clear of #newsDockedStack
        updateNewsDockedTabs(targetLeft);
        updateNewsGridScrollFade(targetLeft, newsGrid.scrollWidth - newsGrid.clientWidth);
        newsProgrammaticScrollUntil = performance.now() + 800;
        newsGrid.scrollTo({
            left: targetLeft,
            behavior: 'smooth'
        });
    }
}

function updateActiveNewsCardOnScroll(scrollLeft, maxScroll) {
    if (!newsGrid) return;
    const m = getNewsMetrics();
    if (!m) return;
    if (performance.now() < newsProgrammaticScrollUntil) return;

    if (scrollLeft === undefined) scrollLeft = newsGrid.scrollLeft;
    if (maxScroll === undefined) maxScroll = newsGrid.scrollWidth - newsGrid.clientWidth;

    let closestIndex = 0;
    if (scrollLeft <= 50) {
        closestIndex = 0;
    } else if (scrollLeft < m.pitch * 0.7) {
        closestIndex = 1;
    } else {
        closestIndex = Math.round((scrollLeft + (2 * m.tabWidth) + 12) / m.pitch);
    }
    closestIndex = Math.max(0, Math.min(m.count - 1, closestIndex));

    if (scrollLeft >= maxScroll - 5 && currentNewsIndex > closestIndex) {
        closestIndex = currentNewsIndex;
    }

    if (closestIndex >= 1 || scrollLeft > 20) {
        showNewsScrollbar();
    }

    const cards = getNewsCards();
    if (closestIndex !== currentNewsIndex || !cards[closestIndex].classList.contains('is-active-news')) {
        currentNewsIndex = closestIndex;
        cards.forEach((c, idx) => {
            c.classList.toggle('is-active-news', idx === currentNewsIndex);
        });
    }
}

// Update sticky horizontal docked state for the two pinned tabs overlay
function updateNewsDockedTabs(scrollLeft) {
    if (!newsGrid) return;
    const m = getNewsMetrics();
    if (!m) return;

    if (scrollLeft === undefined) scrollLeft = newsGrid.scrollLeft;

    // Tab 0 docks when Card 0 is scrolled past (halfway out)
    const dockThreshold0 = m.cardWidth * 0.45;
    const isDocked0 = scrollLeft > dockThreshold0;

    // Tab 1 docks when Card 1 is scrolled past
    const dockThreshold1 = m.pitch + (m.cardWidth * 0.25);
    const isDocked1 = scrollLeft > dockThreshold1;

    if (dockedTabAward) {
        dockedTabAward.classList.toggle('is-docked', isDocked0);
    }
    if (dockedTabCenturia) {
        dockedTabCenturia.classList.toggle('is-docked', isDocked1);
    }

    // Toggle grid mask classes so content under docked tabs is 100% transparent/masked
    newsGrid.classList.toggle('docked-one', isDocked0 && !isDocked1);
    newsGrid.classList.toggle('docked-two', isDocked1);
}

// Single rAF-throttled sync for all scroll-dependent UI (reads first, then writes)
let newsScrollRAF = null;
function syncNewsScrollState() {
    newsScrollRAF = null;
    if (!newsGrid) return;
    const scrollLeft = newsGrid.scrollLeft;
    const maxScroll = newsGrid.scrollWidth - newsGrid.clientWidth;
    updateNewsScrollbarPosition();
    updateNewsGridScrollFade(scrollLeft, maxScroll);
    updateNewsDockedTabs(scrollLeft);
    updateActiveNewsCardOnScroll(scrollLeft, maxScroll);
}

function requestNewsScrollSync() {
    if (newsScrollRAF) return;
    newsScrollRAF = requestAnimationFrame(syncNewsScrollState);
}

function advanceNewsSlide() {
    if (!newsGrid || isMouseInsideNews || userHasInteractedWithNews) return;
    const cards = getNewsCards();
    if (!cards.length) return;

    let nextIndex = currentNewsIndex + 1;
    if (nextIndex >= cards.length) {
        nextIndex = 0;
    }
    setActiveNewsCard(nextIndex, true);
}

function startNewsAutoplay() {
    stopNewsAutoplay();
    if (userHasInteractedWithNews || isMouseInsideNews) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    newsAutoplayTimer = setInterval(advanceNewsSlide, 3500);
}

function stopNewsAutoplay() {
    if (newsAutoplayTimer) {
        clearInterval(newsAutoplayTimer);
        newsAutoplayTimer = null;
    }
}

function disableNewsAutoplay() {
    userHasInteractedWithNews = true;
    showNewsScrollbar();
    stopNewsAutoplay();
}

function focusNewsCardByElement(cardEl) {
    if (!newsGrid || !cardEl) return false;
    const cards = getNewsCards();
    const idx = cards.indexOf(cardEl);
    if (idx < 0) return false;

    if (cardEl.classList.contains('reveal')) {
        cardEl.classList.add('active');
    }
    disableNewsAutoplay();
    measureNewsMetrics();
    setActiveNewsCard(idx, true);

    const sectionTop = newsSection ? newsSection.offsetTop - 10 : 0;
    window.scrollTo({
        top: Math.max(0, sectionTop),
        behavior: 'smooth'
    });
    return true;
}

function focusNewsCardFromHash() {
    if (!window.location.hash || window.location.hash.length <= 1) return false;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if (target && target.closest('#news .grid') && target.classList.contains('card')) {
        return focusNewsCardByElement(target);
    }
    return false;
}

if (newsGrid) {
    // Initial highlight on first card & peeking check
    measureNewsMetrics();
    setActiveNewsCard(0, false);
    syncNewsScrollState();
    focusNewsCardFromHash();

    newsGrid.addEventListener('scroll', requestNewsScrollSync, { passive: true });

    let newsResizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(newsResizeTimer);
        newsResizeTimer = setTimeout(() => {
            measureNewsMetrics();
            syncNewsScrollState();
        }, 120);
    });
    // Images/fonts can change card geometry after first paint
    window.addEventListener('load', () => {
        measureNewsMetrics();
        syncNewsScrollState();
        focusNewsCardFromHash();
    });
    window.addEventListener('hashchange', focusNewsCardFromHash);

    // Mouse Drag-to-Scroll (Grab & Drag) on News Grid
    let isDraggingGrid = false;
    let gridStartX = 0;
    let gridStartScrollLeft = 0;
    let hasDraggedGrid = false;

    newsGrid.addEventListener('mousedown', (e) => {
        disableNewsAutoplay();
        if (e.target.closest('a, button, .news-text-scrollable')) return;
        isDraggingGrid = true;
        hasDraggedGrid = false;
        gridStartX = e.pageX - newsGrid.offsetLeft;
        gridStartScrollLeft = newsGrid.scrollLeft;
        newsGrid.style.scrollSnapType = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingGrid) return;
        const x = e.pageX - newsGrid.offsetLeft;
        const walk = (x - gridStartX) * 1.3;
        if (Math.abs(walk) > 4) {
            hasDraggedGrid = true;
        }
        newsGrid.scrollLeft = gridStartScrollLeft - walk;
    });

    window.addEventListener('mouseup', () => {
        if (!isDraggingGrid) return;
        isDraggingGrid = false;
        newsGrid.style.scrollSnapType = '';
        setTimeout(syncNewsScrollState, 80);
    });

    // Docked tab click handlers: smooth scroll back to pinned cards
    if (dockedTabAward) {
        dockedTabAward.addEventListener('click', (e) => {
            e.preventDefault();
            disableNewsAutoplay();
            setActiveNewsCard(0, true);
        });
    }
    if (dockedTabCenturia) {
        dockedTabCenturia.addEventListener('click', (e) => {
            e.preventDefault();
            disableNewsAutoplay();
            setActiveNewsCard(1, true);
        });
    }

    // Inject top-right Copy Direct Link button on every news card with an id
    getNewsCards().forEach((card) => {
        if (!card.id) return;
        const cardImgWrapper = card.querySelector('.card-image-wrapper');
        if (!cardImgWrapper || cardImgWrapper.querySelector('.news-copy-link')) return;
        const cardTitleText = card.querySelector('h3')?.textContent?.trim() || 'news item';

        const wrap = document.createElement('span');
        wrap.className = 'copy-link-wrap news-copy-link';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'card-copy-link-btn';
        btn.setAttribute('command', '--copy-link');
        btn.setAttribute('commandfor', card.id);
        btn.setAttribute('aria-label', `Copy direct link to ${cardTitleText}`);
        btn.setAttribute('title', 'Copy direct link');
        btn.innerHTML =
            '<svg aria-hidden="true" class="icon-copy-link" fill="none" height="15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="15"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' +
            '<svg aria-hidden="true" class="icon-copy-check" fill="none" height="15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewBox="0 0 24 24" width="15"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        const tip = document.createElement('span');
        tip.className = 'copy-link-tip';
        tip.setAttribute('role', 'status');

        wrap.append(btn, tip);
        cardImgWrapper.append(wrap);
    });

    // Make clicking or hovering any card track selection, and enable detail modal
    getNewsCards().forEach((card, idx) => {
        card.addEventListener('mouseenter', () => {
            currentNewsIndex = idx;
        });

        // Expand button handler
        const expandBtn = card.querySelector('.card-expand-btn');
        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openNewsModal(card);
            });
        }

        // Clicking card image wrapper also opens detail modal
        const cardImgWrapper = card.querySelector('.card-image-wrapper');
        if (cardImgWrapper) {
            cardImgWrapper.style.cursor = 'pointer';
            cardImgWrapper.addEventListener('click', (e) => {
                if (hasDraggedGrid) return;
                if (e.target.closest('.card-expand-btn, .card-copy-link-btn, .copy-link-wrap')) return;
                e.preventDefault();
                e.stopPropagation();
                openNewsModal(card);
            });
        }

        card.addEventListener('click', (e) => {
            disableNewsAutoplay();
            if (hasDraggedGrid) return;
            if (e.target.closest('a, button, .card-image-wrapper')) return;
            setActiveNewsCard(idx, true);
        });
    });

    if (newsPrevBtn) {
        newsPrevBtn.addEventListener('click', () => {
            disableNewsAutoplay();
            setActiveNewsCard(currentNewsIndex - 1, true);
        });
    }
    if (newsNextBtn) {
        newsNextBtn.addEventListener('click', () => {
            disableNewsAutoplay();
            setActiveNewsCard(currentNewsIndex + 1, true);
        });
    }

    const newsUrlParams = new URLSearchParams(window.location.search);
    if (newsUrlParams.has('scrollNews')) {
        const s = parseInt(newsUrlParams.get('scrollNews'), 10);
        const newsEl = document.getElementById('news');
        if (newsEl) {
            window.scrollTo(0, newsEl.offsetTop);
        }
        newsGrid.scrollLeft = s;
        syncNewsScrollState();
    }

    // Never hijack the vertical mouse wheel: page scrolling must always pass through the news section.
    // Horizontal browsing works natively via trackpad swipe / Shift+wheel, drag, arrow buttons and the scrollbar.
    newsGrid.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            disableNewsAutoplay(); // user is actively browsing horizontally
        }
    }, { passive: true });

    // Pause autoplay strictly when mouse is directly over the cards, scrollbar, or nav buttons
    const interactiveNewsElements = [newsGrid, newsScrollbarContainer, newsPrevBtn, newsNextBtn].filter(Boolean);
    interactiveNewsElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            isMouseInsideNews = true;
            stopNewsAutoplay();
        });

        el.addEventListener('mouseleave', () => {
            isMouseInsideNews = false;
            updateActiveNewsCardOnScroll();
            if (!userHasInteractedWithNews) {
                startNewsAutoplay();
            }
        });
    });

    newsGrid.addEventListener('touchstart', () => {
        isMouseInsideNews = true;
        stopNewsAutoplay();
    }, { passive: true });
    newsGrid.addEventListener('pointerdown', () => {
        isMouseInsideNews = true;
        stopNewsAutoplay();
    }, { passive: true });

    // Only run autoplay when news section is in viewport
    if (newsSection && 'IntersectionObserver' in window) {
        const newsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!userHasInteractedWithNews && !isMouseInsideNews) {
                        startNewsAutoplay();
                    }
                } else {
                    stopNewsAutoplay();
                }
            });
        }, { threshold: 0.15 });

        newsObserver.observe(newsSection);
    } else {
        startNewsAutoplay();
    }
}

const refreshNewsScrollbars = () => {
    initCardMiniScrollbars();
    updateNewsScrollFades();
    updateNewsScrollbarPosition();
};

let scrollbarResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(scrollbarResizeTimer);
    scrollbarResizeTimer = setTimeout(refreshNewsScrollbars, 120);
}, { passive: true });
window.addEventListener('load', refreshNewsScrollbars);
document.addEventListener('DOMContentLoaded', refreshNewsScrollbars);
setTimeout(refreshNewsScrollbars, 200);

// --- Student Callout Banner: 2x Hover-Pulse on Viewport Entry ---
const studentCalloutBanner = document.querySelector('.student-callout-banner');
if (studentCalloutBanner && 'IntersectionObserver' in window) {
    studentCalloutBanner.addEventListener('animationend', () => {
        studentCalloutBanner.classList.remove('is-pulsing');
    });

    const bannerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    studentCalloutBanner.classList.remove('is-pulsing');
                    void studentCalloutBanner.offsetWidth; // trigger reflow to restart animation
                    studentCalloutBanner.classList.add('is-pulsing');
                }
            } else {
                studentCalloutBanner.classList.remove('is-pulsing');
            }
        });
    }, { threshold: 0.45 });

    bannerObserver.observe(studentCalloutBanner);
}

// --- Best Paper Award Certificate Lightbox (<dialog>) ---
let supportsDisplayTransition;
function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
        return false;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
}

function supportsTopLayerExit() {
    return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

async function closeTopLayer(element) {
    if (!element || !element.open) return;
    if (!supportsTopLayerExit()) {
        element.setAttribute('data-closing', '');
        const animations = element.getAnimations({ subtree: true });
        if (animations.length > 0) {
            await Promise.race([
                Promise.allSettled(animations.map((a) => a.finished)),
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
        }
        if (!element.hasAttribute('data-closing')) return;
        element.removeAttribute('data-closing');
    }
    if (element.open) {
        element.close();
    }
}

const certificateModal = document.getElementById('certificateModal');
const certModalClose = document.getElementById('certModalClose');
const openCertificateBtn = document.getElementById('openCertificateBtn');

function openCertificateModal() {
    if (!certificateModal) return;
    certificateModal.removeAttribute('data-closing');
    if (typeof certificateModal.showModal === 'function') {
        if (!certificateModal.open) {
            certificateModal.showModal();
        }
    } else {
        certificateModal.setAttribute('open', '');
    }
}

if (openCertificateBtn) {
    openCertificateBtn.addEventListener('click', openCertificateModal);
}
if (certificateModal) {
    if (certModalClose) {
        certModalClose.addEventListener('click', () => {
            closeTopLayer(certificateModal);
        });
    }

    certificateModal.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeTopLayer(certificateModal);
    });

    if (!('closedBy' in HTMLDialogElement.prototype)) {
        const isOutsideDialog = (event, dialog) => {
            const rect = dialog.getBoundingClientRect();
            return (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            );
        };
        let pressedOutside = false;
        certificateModal.addEventListener('pointerdown', (event) => {
            pressedOutside = isOutsideDialog(event, certificateModal);
        });
        certificateModal.addEventListener('pointerup', (event) => {
            if (pressedOutside && isOutsideDialog(event, certificateModal)) {
                closeTopLayer(certificateModal);
            }
            pressedOutside = false;
        });
    }
}

// --- Unified Direct-Link Copy Engine (Invoker Commands + Fallback) ---
const copyFeedbackTimers = new WeakMap();
let lastCopyMessage = '';

function legacyCopyText(text) {
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        field.remove();
    }
}

function reportCopyStatus(button, ok) {
    if (!button) return;
    const tip = button.nextElementSibling;
    clearTimeout(copyFeedbackTimers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');

    let message = ok ? 'Copied' : 'Copy failed';
    if (message === lastCopyMessage) {
        message += '\u00A0';
    }
    lastCopyMessage = message;

    if (tip) tip.textContent = '';
    void button.offsetWidth;
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    requestAnimationFrame(() => {
        if (tip) tip.textContent = message;
    });

    copyFeedbackTimers.set(button, setTimeout(() => {
        button.removeAttribute('data-copied');
        button.removeAttribute('data-failed');
        if (tip) tip.textContent = '';
    }, 2000));
}

function resolveDirectLinkUrl(target) {
    if (!target || !target.id) return '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href?.replace(/#.*$/, '');
    const base = canonical || `${window.location.origin}${window.location.pathname}`;
    return `${base}#${encodeURIComponent(target.id)}`;
}

async function copyDirectLink(button, target) {
    const url = resolveDirectLinkUrl(target);
    if (!url) return;
    try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            throw new Error('Clipboard API unavailable');
        }
        await navigator.clipboard.writeText(url);
        reportCopyStatus(button, true);
    } catch {
        if (legacyCopyText(url)) {
            reportCopyStatus(button, true);
        } else {
            reportCopyStatus(button, false);
        }
    }
}

if ('CommandEvent' in window) {
    document.addEventListener('command', (event) => {
        if (event.command === '--copy-link') {
            copyDirectLink(event.source, event.target);
        }
    }, true);
} else {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button[command="--copy-link"]');
        if (!button) return;
        const target = document.getElementById(button.getAttribute('commandfor'));
        if (target) copyDirectLink(button, target);
    });
}


