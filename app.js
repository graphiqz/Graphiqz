document.addEventListener("DOMContentLoaded", () => {
    // 1. Mobile Menu Toggle
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // 2. Dark/Light Theme Toggler
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        });
    }

    // 3. Safe Fade In Scroll Animation
    const fadeInElements = document.querySelectorAll('.fade-in');
    
    if ('IntersectionObserver' in window) {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.05 };
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Trigger counter animation if elements exist inside
                    const counters = entry.target.querySelectorAll('.counter');
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('data-target') || 0;
                        let count = 0;
                        const speed = 200;
                        const inc = target / speed;
                        
                        const updateCount = () => {
                            if (count < target) {
                                count += inc;
                                counter.innerText = Math.ceil(count);
                                setTimeout(updateCount, 15);
                            } else {
                                counter.innerText = target;
                            }
                        };
                        updateCount();
                    });
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeInElements.forEach(element => observer.observe(element));
    } else {
        // Fallback for older environments/previews: just show everything instantly
        fadeInElements.forEach(element => element.classList.add('visible'));
    }
});