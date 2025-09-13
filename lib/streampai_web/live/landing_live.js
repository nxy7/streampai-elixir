// Newsletter form hook for loading state
export const NewsletterForm = {
  mounted() {
    console.log('NewsletterForm hook mounted');
    
    // Handle form submission
    this.el.addEventListener('submit', (e) => {
      console.log('Form submitted, setting loading state');
      this.setLoadingState(true);
    });
  },
  
  updated() {
    // Clear loading state after any LiveView update (server response)
    console.log('LiveView updated, clearing loading state');
    this.setLoadingState(false);
  },
  
  setLoadingState(loading) {
    const button = this.el.querySelector('#newsletter-submit');
    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('svg');
    
    if (loading) {
      button.disabled = true;
      button.classList.remove('hover:from-purple-600', 'hover:to-pink-600', 'transform', 'hover:scale-105');
      button.classList.add('bg-gray-500', 'cursor-not-allowed');
      button.style.background = '#6B7280';
      buttonText.textContent = 'Saving...';
      spinner.classList.remove('hidden');
    } else {
      button.disabled = false;
      button.classList.add('hover:from-purple-600', 'hover:to-pink-600', 'transform', 'hover:scale-105');
      button.classList.remove('bg-gray-500', 'cursor-not-allowed');
      button.style.background = '';
      buttonText.textContent = 'Notify Me';
      spinner.classList.add('hidden');
    }
  }
};