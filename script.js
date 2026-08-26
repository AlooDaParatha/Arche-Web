// ===================================
// ARCHĒ - PREMIUM LANDING PAGE SCRIPT
// ===================================

// ===================================
// UTILITIES
// ===================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Request Animation Frame throttle
function rafThrottle(fn) {
    let rafId = null;
    return function (...args) {
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                fn(...args);
                rafId = null;
            });
        }
    };
}

// Easing functions
const easing = {
    easeOutQuad: t => t * (2 - t),
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};

// ===================================
// IMMERSIVE HERO CANVAS ANIMATION
// ===================================

class HeroCanvasAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.animationFrame = null;
        this.time = 0;

        // Configuration
        this.isMobile = window.innerWidth < 768;
        this.particleCount = this.isMobile ? 40 : 80;
        this.connectionDistance = 150;
        this.mouseRadius = 150;

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
    }

    resize() {
        const hero = this.canvas.parentElement;
        this.canvas.width = hero.offsetWidth;
        this.canvas.height = hero.offsetHeight;

        // Recreate particles on significant resize
        if (this.particles.length > 0) {
            this.particles.forEach(p => {
                p.x = Math.min(p.x, this.canvas.width);
                p.y = Math.min(p.y, this.canvas.height);
                p.baseX = p.x;
                p.baseY = p.y;
            });
        }
    }

    createParticles() {
        this.particles = [];

        // Color palettes matching brand
        const colors = [
            { r: 102, g: 126, b: 234, name: 'purple' },     // #667eea
            { r: 118, g: 75, b: 162, name: 'deep-purple' }, // #764ba2
            { r: 139, g: 92, b: 246, name: 'violet' },      // #8b5cf6
            { r: 245, g: 87, b: 108, name: 'pink' },        // #f5576c
            { r: 96, g: 165, b: 250, name: 'blue' },        // #60a5fa
        ];

        for (let i = 0; i < this.particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const layer = Math.floor(Math.random() * 3); // 0=back, 1=mid, 2=front
            const baseRadius = layer === 0 ? 15 + Math.random() * 30 :
                              layer === 1 ? 30 + Math.random() * 50 :
                              50 + Math.random() * 80;

            const particle = {
                // Position
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                baseX: 0,
                baseY: 0,

                // Movement
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                speed: 0.2 + Math.random() * 0.3,

                // Size
                radius: baseRadius,
                baseRadius: baseRadius,

                // Visual
                color: color,
                alpha: 0.15 + Math.random() * 0.25,
                layer: layer,

                // Animation
                angle: Math.random() * Math.PI * 2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.02,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.01 + Math.random() * 0.01,

                // Rotation
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.005,
            };

            particle.baseX = particle.x;
            particle.baseY = particle.y;

            this.particles.push(particle);
        }

        // Sort by layer for proper rendering order
        this.particles.sort((a, b) => a.layer - b.layer);
    }

    setupEventListeners() {
        // Mouse move with parallax
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Resize handler
        window.addEventListener('resize', debounce(() => {
            this.resize();
        }, 250));
    }

    updateParticles() {
        this.time += 0.01;

        this.particles.forEach(particle => {
            // Update wobble animation
            particle.wobble += particle.wobbleSpeed;
            particle.pulsePhase += particle.pulseSpeed;
            particle.rotation += particle.rotationSpeed;

            // Pulsing size effect
            const pulseFactor = 1 + Math.sin(particle.pulsePhase) * 0.1;
            particle.radius = particle.baseRadius * pulseFactor;

            // Organic movement
            const wobbleX = Math.sin(particle.wobble) * 0.5;
            const wobbleY = Math.cos(particle.wobble * 0.7) * 0.5;

            // Base movement
            particle.baseX += (particle.vx + wobbleX) * particle.speed;
            particle.baseY += (particle.vy + wobbleY) * particle.speed;

            // Wrap around edges
            if (particle.baseX < -100) particle.baseX = this.canvas.width + 100;
            if (particle.baseX > this.canvas.width + 100) particle.baseX = -100;
            if (particle.baseY < -100) particle.baseY = this.canvas.height + 100;
            if (particle.baseY > this.canvas.height + 100) particle.baseY = -100;

            // Mouse interaction - magnetic repulsion
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = particle.baseX - this.mouse.x;
                const dy = particle.baseY - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouseRadius) {
                    const force = (this.mouseRadius - distance) / this.mouseRadius;
                    const angle = Math.atan2(dy, dx);

                    // Repulsion strength based on layer (closer = stronger)
                    const repulsionStrength = (particle.layer + 1) * 3;

                    particle.x = particle.baseX + Math.cos(angle) * force * repulsionStrength;
                    particle.y = particle.baseY + Math.sin(angle) * force * repulsionStrength;
                } else {
                    // Smooth return to base position
                    particle.x += (particle.baseX - particle.x) * 0.05;
                    particle.y += (particle.baseY - particle.y) * 0.05;
                }
            } else {
                // Smooth return when mouse leaves
                particle.x += (particle.baseX - particle.x) * 0.05;
                particle.y += (particle.baseY - particle.y) * 0.05;
            }
        });
    }

    drawParticles() {
        // Clear with fade trail for smooth effect
        this.ctx.fillStyle = 'rgba(248, 250, 252, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connection lines between nearby particles
        this.drawConnections();

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();

            // Apply rotation
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);

            // Create radial gradient for orb
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.radius);

            const c = particle.color;
            gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${particle.alpha * 0.8})`);
            gradient.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, ${particle.alpha * 0.4})`);
            gradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

            // Glow effect
            this.ctx.shadowBlur = particle.radius * 0.5;
            this.ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, ${particle.alpha})`;

            // Draw orb
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Add inner highlight for depth
            const highlightGradient = this.ctx.createRadialGradient(
                -particle.radius * 0.3, -particle.radius * 0.3, 0,
                0, 0, particle.radius * 0.6
            );
            highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${particle.alpha * 0.3})`);
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    drawConnections() {
        // Draw subtle connection lines between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    const alpha = (1 - distance / this.connectionDistance) * 0.15;

                    // Use color from the larger particle
                    const largerParticle = p1.radius > p2.radius ? p1 : p2;
                    const c = largerParticle.color;

                    this.ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// ===================================
// SCROLL PROGRESS INDICATOR
// ===================================

function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    const updateProgress = () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    };

    window.addEventListener('scroll', rafThrottle(updateProgress), { passive: true });
}

// ===================================
// INTERSECTION OBSERVER ANIMATIONS
// ===================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                // Stagger children if they exist
                const children = entry.target.querySelectorAll('.stagger-item');
                children.forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('animate-in');
                    }, index * 100);
                });
            }
        });
    }, observerOptions);

    // Observe all sections and cards
    document.querySelectorAll('.section-animate, .feature-card, .testimonial-card, .step').forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}

// ===================================
// COUNTER ANIMATIONS
// ===================================

function animateCounter(element, start, end, duration, suffix = '') {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing.easeOutExpo(progress);

        const current = start + (end - start) * easedProgress;

        if (suffix === '%') {
            element.textContent = current.toFixed(1) + suffix;
        } else if (suffix === 'x') {
            element.textContent = current.toFixed(0) + suffix;
        } else if (suffix === '+') {
            element.textContent = Math.floor(current) + suffix;
        } else {
            element.textContent = Math.floor(current);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function initCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');

                const text = entry.target.textContent;
                let endValue, suffix;

                if (text.includes('%')) {
                    endValue = parseFloat(text);
                    suffix = '%';
                } else if (text.includes('x')) {
                    endValue = parseInt(text);
                    suffix = 'x';
                } else if (text.includes('+')) {
                    endValue = parseInt(text);
                    suffix = '+';
                } else {
                    endValue = parseInt(text);
                    suffix = '';
                }

                animateCounter(entry.target, 0, endValue, 2000, suffix);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number, .wpm-counter, .time-saved').forEach(el => {
        observer.observe(el);
    });
}

// ===================================
// TYPING ANIMATION ENGINE
// ===================================

class TypingAnimation {
    constructor(element, options = {}) {
        this.element = element;
        this.texts = options.texts || [];
        this.speed = options.speed || 50;
        this.deleteSpeed = options.deleteSpeed || 30;
        this.pauseDuration = options.pauseDuration || 2000;
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
    }

    type() {
        const currentText = this.texts[this.currentTextIndex];

        if (!this.isDeleting) {
            // Typing
            this.element.textContent = currentText.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;

            if (this.currentCharIndex === currentText.length) {
                // Finished typing, pause then delete
                setTimeout(() => {
                    this.isDeleting = true;
                    this.type();
                }, this.pauseDuration);
                return;
            }
        } else {
            // Deleting
            this.element.textContent = currentText.substring(0, this.currentCharIndex - 1);
            this.currentCharIndex--;

            if (this.currentCharIndex === 0) {
                this.isDeleting = false;
                this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
            }
        }

        const speed = this.isDeleting ? this.deleteSpeed : this.speed;
        setTimeout(() => this.type(), speed);
    }

    start() {
        this.type();
    }
}

// ===================================
// REAL-TIME TRANSCRIPTION DEMO
// ===================================

function initTranscriptionDemo() {
    const demoContainer = document.querySelector('.transcription-demo');
    if (!demoContainer) return;

    const messyInput = demoContainer.querySelector('.messy-input');
    const cleanOutput = demoContainer.querySelector('.clean-output');

    const scenarios = [
        {
            messy: "um so like I need to uh schedule a meeting for uh tomorrow at 3pm with the team okay",
            clean: "I need to schedule a meeting for tomorrow at 3pm with the team."
        },
        {
            messy: "hey can you uh can you send me that report we talked about uh the sales report yeah",
            clean: "Can you send me the sales report we discussed?"
        },
        {
            messy: "so basically what I'm trying to say is um the project needs more time like maybe two weeks",
            clean: "The project needs an additional two weeks."
        }
    ];

    let currentScenario = 0;

    async function animateScenario() {
        const scenario = scenarios[currentScenario];

        // Clear both
        messyInput.textContent = '';
        cleanOutput.textContent = '';

        // Type messy input
        for (let i = 0; i < scenario.messy.length; i++) {
            messyInput.textContent += scenario.messy[i];
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Pause
        await new Promise(resolve => setTimeout(resolve, 800));

        // Highlight removals
        const wordsToRemove = ['um', 'uh', 'like', 'so', 'basically', 'okay', 'yeah'];
        let highlightedText = scenario.messy;
        wordsToRemove.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            highlightedText = highlightedText.replace(regex, `<span class="remove-word">${word}</span>`);
        });
        messyInput.innerHTML = highlightedText;

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Type clean output
        for (let i = 0; i < scenario.clean.length; i++) {
            cleanOutput.textContent += scenario.clean[i];
            await new Promise(resolve => setTimeout(resolve, 40));
        }

        // Pause before next scenario
        await new Promise(resolve => setTimeout(resolve, 3000));

        currentScenario = (currentScenario + 1) % scenarios.length;
        animateScenario();
    }

    animateScenario();
}

// ===================================
// SPEED COMPARISON DEMO
// ===================================

function initSpeedComparison() {
    const typingText = document.querySelector('.typing-demo-text');
    const dictationText = document.querySelector('.dictation-demo-text');
    const typingCounter = document.querySelector('.typing-wpm');
    const dictationCounter = document.querySelector('.dictation-wpm');

    if (!typingText || !dictationText) return;

    const sampleText = "The quick brown fox jumps over the lazy dog. This is a demonstration of typing speed versus voice dictation speed.";

    let typingIndex = 0;
    let dictationIndex = 0;

    function animateTyping() {
        if (typingIndex < sampleText.length) {
            typingText.textContent = sampleText.substring(0, typingIndex + 1);
            typingIndex++;
            setTimeout(animateTyping, 100); // 45-50 WPM
        } else {
            // Reset after completion
            setTimeout(() => {
                typingIndex = 0;
                typingText.textContent = '';
                animateTyping();
            }, 2000);
        }
    }

    function animateDictation() {
        if (dictationIndex < sampleText.length) {
            dictationText.textContent = sampleText.substring(0, dictationIndex + 1);
            dictationIndex++;
            setTimeout(animateDictation, 22); // 220 WPM
        } else {
            // Reset after completion
            setTimeout(() => {
                dictationIndex = 0;
                dictationText.textContent = '';
                animateDictation();
            }, 2000);
        }
    }

    // Start both animations with observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateTyping();
                animateDictation();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const comparisonSection = document.querySelector('.speed-comparison');
    if (comparisonSection) {
        observer.observe(comparisonSection);
    }
}

// ===================================
// 3D CARD TILT EFFECT
// ===================================

function init3DCards() {
    const cards = document.querySelectorAll('.feature-card, .testimonial-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', rafThrottle((e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        }));

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

// ===================================
// MAGNETIC BUTTON EFFECT
// ===================================

function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

    buttons.forEach(button => {
        button.addEventListener('mousemove', rafThrottle((e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 100;

            if (distance < maxDistance) {
                const pullStrength = (maxDistance - distance) / maxDistance;
                const moveX = x * pullStrength * 0.3;
                const moveY = y * pullStrength * 0.3;

                button.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
            }
        }));

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translate(0, 0) scale(1)';
        });
    });
}

// ===================================
// FLOATING GRADIENT ORBS (DEPRECATED - Now using canvas)
// ===================================

function createFloatingOrbs() {
    // Disabled - canvas animation provides superior visual experience
    return;
}

// ===================================
// PARALLAX SCROLLING
// ===================================

function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');

    const handleScroll = rafThrottle(() => {
        const scrolled = window.pageYOffset;

        parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
}

// ===================================
// APP INTEGRATION SHOWCASE
// ===================================

function initAppShowcase() {
    const showcase = document.querySelector('.app-showcase');
    if (!showcase) return;

    const apps = showcase.querySelectorAll('.app-mockup');
    let currentApp = 0;

    function switchApp() {
        apps[currentApp].classList.remove('active');
        currentApp = (currentApp + 1) % apps.length;
        apps[currentApp].classList.add('active');
    }

    // Auto-switch every 4 seconds
    setInterval(switchApp, 4000);

    // Click to switch
    const indicators = showcase.querySelectorAll('.app-indicator');
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            apps[currentApp].classList.remove('active');
            indicators[currentApp].classList.remove('active');
            currentApp = index;
            apps[currentApp].classList.add('active');
            indicators[currentApp].classList.add('active');
        });
    });
}

// ===================================
// SMOOTH SCROLL
// ===================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===================================
// ANIMATED STATS ON HOVER
// ===================================

function initStatAnimations() {
    const stats = document.querySelectorAll('.stat');

    stats.forEach(stat => {
        stat.addEventListener('mouseenter', () => {
            stat.querySelector('.stat-number').style.transform = 'scale(1.1)';
        });

        stat.addEventListener('mouseleave', () => {
            stat.querySelector('.stat-number').style.transform = 'scale(1)';
        });
    });
}

// ===================================
// NAVBAR SCROLL EFFECT
// ===================================

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', rafThrottle(() => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }), { passive: true });
}

// ===================================
// RIPPLE EFFECT ON CLICK
// ===================================

function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ===================================
// REDUCED MOTION SUPPORT
// ===================================

function checkReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        document.body.classList.add('reduce-motion');
    }
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Initializing Archē Premium Experience...');

    // Check for reduced motion preference
    checkReducedMotion();

    // Initialize all features
    const heroCanvas = new HeroCanvasAnimation('hero-canvas');
    initScrollProgress();
    initScrollAnimations();
    initCounters();
    initTranscriptionDemo();
    initSpeedComparison();
    init3DCards();
    initMagneticButtons();
    createFloatingOrbs();
    initParallax();
    initAppShowcase();
    initSmoothScroll();
    initStatAnimations();
    initNavbarScroll();
    initRippleEffect();

    console.log('✨ Archē Experience Ready!');
});

// Performance monitoring (optional, for debugging)
if (typeof PerformanceObserver !== 'undefined') {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
                console.warn('Long task detected:', entry.duration.toFixed(2) + 'ms');
            }
        }
    });

    try {
        perfObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
        // longtask not supported in all browsers
    }
}
