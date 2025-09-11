// Mobile navigation hook for landing page
export const MobileNavigation = {
  mounted() {
    this.menu = this.el.querySelector('#mobile-menu');
    this.toggleButton = this.el.querySelector('[data-mobile-toggle]');
    
    // Toggle menu function
    this.toggleMenu = () => {
      const isHidden = this.menu.classList.contains('hidden');
      
      if (isHidden) {
        // Show menu
        this.menu.classList.remove('hidden');
        
        // Trigger animations after elements are visible
        requestAnimationFrame(() => {
          this.menu.classList.remove('opacity-0', 'scale-95');
          this.menu.classList.add('opacity-100', 'scale-100');
        });
      } else {
        // Hide menu
        this.menu.classList.remove('opacity-100', 'scale-100');
        this.menu.classList.add('opacity-0', 'scale-95');
        
        // Hide elements after animation completes
        setTimeout(() => {
          this.menu.classList.add('hidden');
        }, 300);
      }
    };
    
    // Close menu function
    this.closeMenu = () => {
      if (!this.menu.classList.contains('hidden')) {
        this.toggleMenu();
      }
    };
    
    // Click outside to close menu
    this.outsideClickHandler = (e) => {
      if (!this.menu.contains(e.target) && !this.toggleButton.contains(e.target)) {
        this.closeMenu();
      }
    };
    
    // Event listeners
    this.toggleButton.addEventListener('click', this.toggleMenu);
    document.addEventListener('click', this.outsideClickHandler);
    
    // Close menu on navigation link clicks (mobile only)
    const navLinks = this.menu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', this.closeMenu);
    });
    
    // Close menu on escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeMenu();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  },
  
  destroyed() {
    // Clean up event listeners
    if (this.toggleButton) {
      this.toggleButton.removeEventListener('click', this.toggleMenu);
    }
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
    }
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
  }
};