// Homepage Animations
if (document.querySelector('.hero')) {
    gsap.from('.logo', { opacity: 0, y: -50, duration: 1 });
    gsap.from('.hero h1', { opacity: 0, y: 50, duration: 1, delay: 0.5 });
    gsap.from('.hero-graphic', { opacity: 0, scale: 0.5, duration: 1.5, ease: 'elastic.out(1, 0.5)' });
    gsap.from('.card', { opacity: 0, y: 100, stagger: 0.2, duration: 1, scrollTrigger: { trigger: '.projects-grid' } });
    gsap.from('.btn', { opacity: 0, scale: 0.8, duration: 1, scrollTrigger: { trigger: '.cta' } });
}

// About Page Animations
if (document.querySelector('.about')) {
    gsap.from('.headshot', { opacity: 0, scale: 0.8, duration: 1, scrollTrigger: { trigger: '.about' } });
    gsap.from('.about p', { opacity: 0, y: 50, duration: 1, delay: 0.5, scrollTrigger: { trigger: '.about' } });
}

// Projects Page Filter and Animations
if (document.querySelector('.projects')) {
    const buttons = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.item');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            items.forEach(item => {
                if (filter === 'all' || item.classList.contains(filter)) {
                    item.classList.add('show');
                    gsap.from(item, { opacity: 0, y: 50, duration: 0.5 });
                } else {
                    item.classList.remove('show');
                }
            });
        });
    });

    // Initial load
    document.querySelector('.filter-btn[data-filter="all"]').click();
}

// Contact Page Animation
if (document.querySelector('.contact')) {
    gsap.from('form', { opacity: 0, y: 100, duration: 1, scrollTrigger: { trigger: '.contact' } });
}