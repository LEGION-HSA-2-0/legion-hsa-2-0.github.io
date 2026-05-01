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
                top: target.offsetTop - 80,
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

// 3D Model Fade-in & Loading
const modelViewers = document.querySelectorAll('model-viewer');
modelViewers.forEach(viewer => {
    viewer.addEventListener('load', () => {
        viewer.classList.add('visible');
        const loader = viewer.parentElement.querySelector('.model-loader');
        if (loader) loader.remove();
    });
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
