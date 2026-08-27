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
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll(); // Initial check

// 3D Model Load Logic (Poster-First)
function load3DModel(el) {
    const container = el.parentElement;
    const modelViewer = container.querySelector('model-viewer');
    const loader = container.querySelector('.model-loader');
    
    if (modelViewer && loader) {
        loader.style.display = 'block';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
        modelViewer.dismissPoster();
    }
}

// Smooth Schooling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 10,
                behavior: 'smooth'
            });
        }
    });
});

// Smooth 3D Animation State
let targetTheta = 30, currentTheta = 30;
let targetPhi = 60, currentPhi = 60;
let targetRadius = 350, currentRadius = 350;
let isInteracting = false;
let interactionTimeout;

const viewer = document.querySelector('model-viewer');

if (viewer) {
    // Detect user interaction start
    viewer.addEventListener('mousedown', () => isInteracting = true);
    viewer.addEventListener('touchstart', () => isInteracting = true, {passive: true});

    // Detect user interaction end + cooldown
    const endInteraction = () => {
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            isInteracting = false;
        }, 3000); // Wait 3s after interaction before resuming scroll-sync
    };

    window.addEventListener('mouseup', endInteraction);
    window.addEventListener('touchend', endInteraction);
}

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = 800; 
    const scrollPercent = Math.min(scrollY / maxScroll, 1);

    // Update target values - we always calculate these
    targetTheta = 30 + (60 * scrollPercent);
    targetPhi = 60 + (30 * scrollPercent);
    targetRadius = 350 - (150 * scrollPercent);
});

function smoothAnimate() {
    const lerpFactor = 0.05;
    
    // Only apply scroll-based values if the user isn't currently playing with the model
    if (!isInteracting && viewer) {
        currentTheta += (targetTheta - currentTheta) * lerpFactor;
        currentPhi += (targetPhi - currentPhi) * lerpFactor;
        currentRadius += (targetRadius - currentRadius) * lerpFactor;
        
        viewer.cameraOrbit = `${currentTheta}deg ${currentPhi}deg ${currentRadius}%`;
    } else if (isInteracting && viewer) {
        // While interacting, sync current values back from the model's actual state 
        // to prevent "jumping" when the user lets go
        const orbit = viewer.getCameraOrbit();
        currentTheta = (orbit.theta * 180) / Math.PI;
        currentPhi = (orbit.phi * 180) / Math.PI;
        currentRadius = orbit.radius * 100; // Radius as % approximated
    }
    
    requestAnimationFrame(smoothAnimate);
}

smoothAnimate();

// 3D Model Fade-in & Progress Bar Loading
const modelViewers = document.querySelectorAll('model-viewer');
modelViewers.forEach(viewer => {
    const container = viewer.parentElement;
    const loader = container ? container.querySelector('.model-loader-container') : null;
    
    if (loader) {
        const fill = loader.querySelector('.model-loader-fill');
        const percentText = loader.querySelector('.model-loader-percent');

        const updateProgress = (progress) => {
            const percentage = Math.min(Math.max(Math.round(progress * 100), 0), 100);
            if (fill) fill.style.width = `${percentage}%`;
            if (percentText) percentText.textContent = `${percentage}%`;
        };

        viewer.addEventListener('progress', (event) => {
            updateProgress(event.detail.totalProgress);
        });

        const onComplete = () => {
            updateProgress(1.0);
            viewer.classList.add('visible');
            setTimeout(() => {
                loader.style.opacity = '0';
                loader.style.transform = 'translate(-50%, -50%) scale(0.95)';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, 200);
        };

        if (viewer.loaded) {
            onComplete();
        } else {
            viewer.addEventListener('load', onComplete, { once: true });
        }
    } else {
        viewer.addEventListener('load', () => {
            viewer.classList.add('visible');
        }, { once: true });
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
        const sectionHeight = section.clientHeight;
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

window.addEventListener('scroll', scrollSpy);
window.addEventListener('load', scrollSpy);

// Mobile Menu Logic
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
const mobileLinks = document.querySelectorAll('.mobile-nav a');

if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        mobileMenuBtn.textContent = mobileNav.classList.contains('active') ? '✕' : '☰';
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
        });
    });
}

// Dynamic Scroll Fade and Overflow Handler for Individual News Card Text & News Grid
function updateNewsGridScrollFade() {
    const grid = document.querySelector('#news .grid');
    if (!grid) return;

    const hasOverflow = grid.scrollWidth > grid.clientWidth + 2;
    if (!hasOverflow) {
        grid.style.maskImage = 'none';
        grid.style.webkitMaskImage = 'none';
        return;
    }

    const isAtStart = grid.scrollLeft <= 5;
    const isAtEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 15;

    if (isAtStart && !isAtEnd) {
        grid.style.maskImage = 'linear-gradient(to right, black calc(100% - 60px), transparent 100%)';
        grid.style.webkitMaskImage = 'linear-gradient(to right, black calc(100% - 60px), transparent 100%)';
    } else if (isAtEnd && !isAtStart) {
        grid.style.maskImage = 'linear-gradient(to right, transparent 0%, black 50px, black 100%)';
        grid.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 50px, black 100%)';
    } else if (!isAtStart && !isAtEnd) {
        grid.style.maskImage = 'linear-gradient(to right, transparent 0%, black 50px, black calc(100% - 60px), transparent 100%)';
        grid.style.webkitMaskImage = 'linear-gradient(to right, transparent 0%, black 50px, black calc(100% - 60px), transparent 100%)';
    } else {
        grid.style.maskImage = 'none';
        grid.style.webkitMaskImage = 'none';
    }
}

function updateNewsScrollFades() {
    updateNewsGridScrollFade();
    document.querySelectorAll('.news-text-scrollable').forEach(el => {
        const hasOverflow = el.scrollHeight > el.clientHeight + 2;
        if (!hasOverflow) {
            el.style.maskImage = 'none';
            el.style.webkitMaskImage = 'none';
            return;
        }

        const isAtTop = el.scrollTop <= 2;
        const isAtBottom = Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) <= 4;

        if (isAtTop && !isAtBottom) {
            el.style.maskImage = 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)';
            el.style.webkitMaskImage = 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)';
        } else if (isAtBottom && !isAtTop) {
            el.style.maskImage = 'linear-gradient(to bottom, transparent 0%, black 24px)';
            el.style.webkitMaskImage = 'linear-gradient(to bottom, transparent 0%, black 24px)';
        } else if (!isAtTop && !isAtBottom) {
            el.style.maskImage = 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)';
            el.style.webkitMaskImage = 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)';
        } else {
            el.style.maskImage = 'none';
            el.style.webkitMaskImage = 'none';
        }
    });
}

// News Grid Navigation Buttons, Active Highlight & Centering Slideshow
const newsGrid = document.querySelector('#news .grid');
const newsSection = document.getElementById('news');
const newsPrevBtn = document.getElementById('newsPrevBtn');
const newsNextBtn = document.getElementById('newsNextBtn');

let newsAutoplayTimer = null;
let isNewsInteracting = false;
let newsResumeTimeout = null;
let currentNewsIndex = 0;

function getNewsCards() {
    return newsGrid ? Array.from(newsGrid.querySelectorAll('.card')) : [];
}

function setActiveNewsCard(index, shouldScroll = true) {
    const cards = getNewsCards();
    if (!cards.length) return;

    currentNewsIndex = ((index % cards.length) + cards.length) % cards.length;

    cards.forEach((card, i) => {
        if (i === currentNewsIndex) {
            card.classList.add('is-active-news');
        } else {
            card.classList.remove('is-active-news');
        }
    });

    if (shouldScroll && newsGrid) {
        const activeCard = cards[currentNewsIndex];
        const cardCenter = activeCard.offsetLeft + (activeCard.offsetWidth / 2);
        const targetScrollLeft = cardCenter - (newsGrid.clientWidth / 2);
        newsGrid.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth'
        });
    }
}

function updateActiveNewsCardOnScroll() {
    if (!newsGrid) return;
    const cards = getNewsCards();
    if (!cards.length) return;

    const gridCenter = newsGrid.scrollLeft + (newsGrid.clientWidth / 2);
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        const distance = Math.abs(cardCenter - gridCenter);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
        }
    });

    currentNewsIndex = closestIndex;
    cards.forEach((c, idx) => {
        if (idx === currentNewsIndex) {
            c.classList.add('is-active-news');
        } else {
            c.classList.remove('is-active-news');
        }
    });
}

function advanceNewsSlide() {
    if (!newsGrid || isNewsInteracting) return;
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    newsAutoplayTimer = setInterval(advanceNewsSlide, 4500);
}

function stopNewsAutoplay() {
    if (newsAutoplayTimer) {
        clearInterval(newsAutoplayTimer);
        newsAutoplayTimer = null;
    }
}

function pauseNewsAutoplay() {
    isNewsInteracting = true;
    stopNewsAutoplay();
    clearTimeout(newsResumeTimeout);
    newsResumeTimeout = setTimeout(() => {
        isNewsInteracting = false;
        startNewsAutoplay();
    }, 6000);
}

if (newsGrid) {
    // Initial highlight on first card
    setActiveNewsCard(0, false);

    newsGrid.addEventListener('scroll', () => {
        updateNewsGridScrollFade();
        updateActiveNewsCardOnScroll();
    });

    // Mouse Drag-to-Scroll (Grab & Drag) on News Grid
    let isDraggingGrid = false;
    let gridStartX = 0;
    let gridStartScrollLeft = 0;
    let hasDraggedGrid = false;

    newsGrid.addEventListener('mousedown', (e) => {
        if (e.target.closest('a, button, .news-text-scrollable')) return;
        isDraggingGrid = true;
        hasDraggedGrid = false;
        gridStartX = e.pageX - newsGrid.offsetLeft;
        gridStartScrollLeft = newsGrid.scrollLeft;
        newsGrid.style.scrollSnapType = 'none';
        pauseNewsAutoplay();
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
        newsGrid.style.scrollSnapType = 'x proximity';
        setTimeout(updateActiveNewsCardOnScroll, 100);
    });

    // Make clicking or hovering any card track selection
    getNewsCards().forEach((card, idx) => {
        card.addEventListener('mouseenter', () => {
            currentNewsIndex = idx;
        });

        card.addEventListener('click', (e) => {
            if (hasDraggedGrid) return;
            if (e.target.closest('a, button')) return;
            pauseNewsAutoplay();
            setActiveNewsCard(idx, true);
        });
    });

    if (newsPrevBtn) {
        newsPrevBtn.addEventListener('click', () => {
            pauseNewsAutoplay();
            setActiveNewsCard(currentNewsIndex - 1, true);
        });
    }
    if (newsNextBtn) {
        newsNextBtn.addEventListener('click', () => {
            pauseNewsAutoplay();
            setActiveNewsCard(currentNewsIndex + 1, true);
        });
    }

    // Convert mouse wheel to horizontal scrolling when hovering news grid, unless cursor is over scrollable card text
    newsGrid.addEventListener('wheel', (e) => {
        const scrollableText = e.target.closest('.news-text-scrollable');
        if (scrollableText) {
            const hasVerticalOverflow = scrollableText.scrollHeight > scrollableText.clientHeight + 2;
            if (hasVerticalOverflow) {
                const canScrollDown = e.deltaY > 0 && (scrollableText.scrollTop + scrollableText.clientHeight < scrollableText.scrollHeight - 1);
                const canScrollUp = e.deltaY < 0 && scrollableText.scrollTop > 0;
                if (canScrollDown || canScrollUp) {
                    pauseNewsAutoplay();
                    return; // Allow native vertical scrolling of the card text
                }
            }
        }

        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            const canScrollRight = e.deltaY > 0 && newsGrid.scrollLeft + newsGrid.clientWidth < newsGrid.scrollWidth - 10;
            const canScrollLeft = e.deltaY < 0 && newsGrid.scrollLeft > 10;
            if (canScrollRight || canScrollLeft) {
                e.preventDefault();
                newsGrid.scrollLeft += e.deltaY;
                pauseNewsAutoplay();
            }
        }
    }, { passive: false });

    // Pause autoplay on user hover or touch interaction
    newsGrid.addEventListener('mouseenter', () => {
        isNewsInteracting = true;
        stopNewsAutoplay();
        clearTimeout(newsResumeTimeout);
    });

    newsGrid.addEventListener('mouseleave', () => {
        isNewsInteracting = false;
        updateActiveNewsCardOnScroll();
        startNewsAutoplay();
    });

    newsGrid.addEventListener('touchstart', pauseNewsAutoplay, { passive: true });
    newsGrid.addEventListener('pointerdown', pauseNewsAutoplay, { passive: true });

    // Only run autoplay when news section is in viewport
    if (newsSection && 'IntersectionObserver' in window) {
        const newsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startNewsAutoplay();
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

document.querySelectorAll('.news-text-scrollable').forEach(el => {
    el.addEventListener('scroll', updateNewsScrollFades);
});

window.addEventListener('resize', updateNewsScrollFades);
window.addEventListener('load', updateNewsScrollFades);
document.addEventListener('DOMContentLoaded', updateNewsScrollFades);
setTimeout(updateNewsScrollFades, 200);
