export default {
  mounted() {
    const storageKey = this.el.dataset.storageKey;
    if (!storageKey) return;

    // Load saved value from localStorage on mount
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue && this.el.value !== savedValue) {
      this.el.value = savedValue;
      // Trigger change event to update LiveView
      this.el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Save value to localStorage on input change
    this.el.addEventListener('input', (e) => {
      localStorage.setItem(storageKey, e.target.value);
    });
  }
};