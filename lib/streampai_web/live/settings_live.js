// Name availability checker hook for settings page
export const NameAvailabilityChecker = {
  mounted() {
    this.debounceTimer = null;
    this.loadingTimer = null;
    this.currentName = this.el.value;
    this.validationHelpEl = document.getElementById("validation-help");
    
    // Show/hide validation help on focus/blur
    this.el.addEventListener("focus", () => {
      if (this.validationHelpEl) {
        this.validationHelpEl.classList.remove("hidden");
      }
    });
    
    this.el.addEventListener("blur", () => {
      if (this.validationHelpEl) {
        this.validationHelpEl.classList.add("hidden");
      }
    });
    
    this.el.addEventListener("input", (event) => {
      const name = event.target.value.trim();
      
      // Clear previous timers
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
      }
      
      // Clear status immediately if input is empty or same as current
      if (!name || name === this.currentName) {
        this.clearStatus();
        return;
      }
      
      // Clear any existing status immediately when typing
      this.clearStatus();
      
      // Show loading state after a short delay to avoid flashing
      this.loadingTimer = setTimeout(() => {
        this.showLoading();
      }, 300);
      
      // Debounce the availability check
      this.debounceTimer = setTimeout(() => {
        if (this.loadingTimer) {
          clearTimeout(this.loadingTimer);
        }
        this.checkAvailability(name);
      }, 1000);
    });
  },
  
  checkAvailability(name) {
    this.pushEventTo(this.el, "check_name_availability", { name }, (reply) => {
      if (reply.available) {
        this.showAvailable(reply.message);
      } else {
        this.showUnavailable(reply.message);
      }
    });
  },
  
  showLoading() {
    const statusEl = document.getElementById("availability-status");
    const messageEl = document.getElementById("availability-message");
    
    statusEl.innerHTML = '<div class="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>';
    messageEl.innerHTML = '<span class="text-gray-500">Checking availability...</span>';
  },
  
  showAvailable(message) {
    const statusEl = document.getElementById("availability-status");
    const messageEl = document.getElementById("availability-message");
    
    statusEl.innerHTML = '<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
    messageEl.innerHTML = `<span class="text-green-600">${message}</span>`;
  },
  
  showUnavailable(message) {
    const statusEl = document.getElementById("availability-status");
    const messageEl = document.getElementById("availability-message");
    
    statusEl.innerHTML = '<svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
    messageEl.innerHTML = `<span class="text-red-600">${message}</span>`;
  },
  
  clearStatus() {
    const statusEl = document.getElementById("availability-status");
    const messageEl = document.getElementById("availability-message");
    
    statusEl.innerHTML = '';
    messageEl.innerHTML = '';
  },
  
  hideValidationHelp() {
    if (this.validationHelpEl) {
      this.validationHelpEl.classList.add("hidden");
    }
  },
  
  destroyed() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
  }
};