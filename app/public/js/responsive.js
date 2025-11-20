(() => {
    if (window.__EDU_RESPONSIVE_LOADED) {
        return;
    }
    window.__EDU_RESPONSIVE_LOADED = true;

    const Responsive = {
        mobileBreakpoint: 768,

        init() {
            this.updateViewportHeight();
            window.addEventListener('resize', this.throttle(() => this.updateViewportHeight(), 150));

            this.initPasswordToggles();
            this.initSidebar();
        },

        updateViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        },

        initPasswordToggles() {
            const wrappers = document.querySelectorAll('.password-wrapper');
            if (!wrappers.length) return;

            wrappers.forEach(wrapper => {
                const input = wrapper.querySelector('input[type="password"], input[data-password]');
                if (!input) return;

                const toggleButtons = wrapper.querySelectorAll('.toggle-password');
                if (!toggleButtons.length) return;

                const updateIcons = (button, isVisible) => {
                    const eyeOpen = button.querySelector('.eye-open');
                    const eyeClosed = button.querySelector('.eye-closed');

                    if (eyeOpen) {
                        eyeOpen.style.display = isVisible ? 'none' : 'block';
                    }

                    if (eyeClosed) {
                        eyeClosed.style.display = isVisible ? 'block' : 'none';
                    }

                    button.classList.toggle('is-active', isVisible);
                };

                toggleButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const isHidden = input.type === 'password';
                        input.type = isHidden ? 'text' : 'password';
                        updateIcons(button, isHidden);
                        button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
                    });

                    // Ensure initial state
                    updateIcons(button, false);
                });
            });
        },

        initSidebar() {
            const sidebar = document.querySelector('[data-sidebar]');
            const toggleButton = document.querySelector('[data-sidebar-toggle]');
            const overlay = document.querySelector('[data-sidebar-overlay]');
            const navLinks = document.querySelectorAll('[data-sidebar] .nav-link');

            if (!sidebar) return;

            const openSidebar = () => {
                sidebar.dataset.sidebarState = 'visible';
                overlay?.classList.add('is-active');
                document.body.classList.add('is-locked');
            };

            const closeSidebar = () => {
                sidebar.dataset.sidebarState = 'hidden';
                overlay?.classList.remove('is-active');
                document.body.classList.remove('is-locked');
            };

            const toggleSidebar = () => {
                const isHidden = sidebar.dataset.sidebarState !== 'visible';
                if (isHidden) {
                    openSidebar();
                } else {
                    closeSidebar();
                }
            };

            // Initialize default state
            sidebar.dataset.sidebarState = window.innerWidth <= this.mobileBreakpoint ? 'hidden' : 'visible';

            toggleButton?.addEventListener('click', toggleSidebar);
            overlay?.addEventListener('click', closeSidebar);

            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    closeSidebar();
                }
            });

            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= this.mobileBreakpoint) {
                        closeSidebar();
                    }
                });
            });

            window.addEventListener('resize', this.throttle(() => {
                if (window.innerWidth > this.mobileBreakpoint) {
                    sidebar.dataset.sidebarState = 'visible';
                    overlay?.classList.remove('is-active');
                    document.body.classList.remove('is-locked');
                } else {
                    sidebar.dataset.sidebarState = 'hidden';
                }
            }, 200));
        },

        throttle(fn, limit = 200) {
            let inThrottle;
            return (...args) => {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => (inThrottle = false), limit);
                }
            };
        }
    };

    document.addEventListener('DOMContentLoaded', () => Responsive.init());
})();

