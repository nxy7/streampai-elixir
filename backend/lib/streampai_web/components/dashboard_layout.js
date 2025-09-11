// Dashboard mobile sidebar hook
export const DashboardSidebar = {
  mounted() {
    this.sidebar = this.el.querySelector('.sidebar');
    this.backdrop = this.el.querySelector('#mobile-sidebar-backdrop');
    this.mobileToggle = this.el.querySelector('#mobile-sidebar-toggle');
    this.desktopToggle = this.el.querySelector('#sidebar-toggle');
    
    // Mobile sidebar toggle function
    this.toggleMobileSidebar = () => {
      const isHidden = this.sidebar.classList.contains('-translate-x-full');
      
      if (isHidden) {
        // Show sidebar
        this.backdrop.classList.remove('hidden');
        this.sidebar.classList.remove('-translate-x-full');
        this.sidebar.classList.add('translate-x-0');
        
        // Trigger backdrop animation
        requestAnimationFrame(() => {
          this.backdrop.classList.remove('opacity-0');
          this.backdrop.classList.add('opacity-100');
        });
      } else {
        // Hide sidebar
        this.backdrop.classList.remove('opacity-100');
        this.backdrop.classList.add('opacity-0');
        this.sidebar.classList.remove('translate-x-0');
        this.sidebar.classList.add('-translate-x-full');
        
        // Hide backdrop after animation
        setTimeout(() => {
          this.backdrop.classList.add('hidden');
        }, 300);
      }
    };
    
    // Close mobile sidebar
    this.closeMobileSidebar = () => {
      if (!this.sidebar.classList.contains('-translate-x-full')) {
        this.toggleMobileSidebar();
      }
    };
    
    // Desktop sidebar toggle (keep existing functionality)
    this.toggleDesktopSidebar = () => {
      const streampaiText = this.el.querySelector('.streampai-text');
      const sidebarTexts = this.el.querySelectorAll('.sidebar-text');
      const collapseIcon = this.el.querySelector('.collapse-icon');
      const expandIcon = this.el.querySelector('.expand-icon');
      const mainContent = this.el.querySelector('#main-content');
      
      const isExpanded = this.sidebar.classList.contains('w-64');
      
      if (isExpanded) {
        // Collapse
        this.sidebar.classList.remove('w-64');
        this.sidebar.classList.add('w-20');
        sidebarTexts.forEach(text => text.classList.add('hidden'));
        collapseIcon.classList.add('hidden');
        expandIcon.classList.remove('hidden');
        mainContent.classList.remove('md:ml-64');
        mainContent.classList.add('md:ml-20');
        streampaiText.classList.add('hidden');
      } else {
        // Expand
        this.sidebar.classList.remove('w-20');
        this.sidebar.classList.add('w-64');
        sidebarTexts.forEach(text => text.classList.remove('hidden'));
        collapseIcon.classList.remove('hidden');
        expandIcon.classList.add('hidden');
        mainContent.classList.remove('md:ml-20');
        mainContent.classList.add('md:ml-64');
        streampaiText.classList.remove('hidden');
      }
    };
    
    // Event listeners
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', this.toggleMobileSidebar);
    }
    
    if (this.backdrop) {
      this.backdrop.addEventListener('click', this.closeMobileSidebar);
    }
    
    if (this.desktopToggle) {
      this.desktopToggle.addEventListener('click', this.toggleDesktopSidebar);
    }
    
    // Close mobile sidebar when clicking on nav links (mobile only)
    const navLinks = this.sidebar.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
          this.closeMobileSidebar();
        }
      });
    });
    
    // Close on escape key
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeMobileSidebar();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  },
  
  destroyed() {
    // Clean up event listeners
    if (this.mobileToggle) {
      this.mobileToggle.removeEventListener('click', this.toggleMobileSidebar);
    }
    if (this.backdrop) {
      this.backdrop.removeEventListener('click', this.closeMobileSidebar);
    }
    if (this.desktopToggle) {
      this.desktopToggle.removeEventListener('click', this.toggleDesktopSidebar);
    }
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
  }
};