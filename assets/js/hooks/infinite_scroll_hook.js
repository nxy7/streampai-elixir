/**
 * InfiniteScroll Hook
 *
 * Automatically triggers "load_more" event when user scrolls near bottom of page.
 * Works with Ash keyset pagination for efficient infinite scrolling.
 *
 * The button must not be disabled for the trigger to fire.
 * When there are no more results, the button should be removed from DOM.
 *
 * Usage:
 *   <button id="load-more-trigger" phx-hook="InfiniteScroll" disabled={@loading_more}>
 *     Load More
 *   </button>
 */
const InfiniteScroll = {
  mounted() {
    this.pending = false;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Only trigger if:
        // 1. Element is visible (isIntersecting)
        // 2. Button is not disabled
        // 3. We haven't already triggered a pending load
        if (entry.isIntersecting && !this.el.disabled && !this.pending) {
          this.pending = true;
          // Element is visible, trigger load_more
          this.pushEvent("load_more", {}, () => {
            // Reset pending flag after server responds
            this.pending = false;
          });
        }
      },
      {
        root: null, // viewport
        rootMargin: "200px", // Trigger 200px before reaching the element
        threshold: 0.1,
      }
    );

    this.observer.observe(this.el);
  },

  updated() {
    // Reset pending flag if button becomes disabled
    if (this.el.disabled) {
      this.pending = false;
    }
  },

  destroyed() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
};

export default InfiniteScroll;
