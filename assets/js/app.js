import "phoenix_html";
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import topbar from "topbar";

// live_vue related imports
import { getHooks } from "live_vue";
import "../css/app.css";
import liveVueApp from "../vue";

// Import collocated hooks
import { NameAvailabilityChecker } from "../../lib/streampai_web/live/settings_live.js";
import { NewsletterForm } from "../../lib/streampai_web/live/landing_live.js";
import { MobileNavigation } from "../../lib/streampai_web/components/landing_navigation.js";
import { DashboardSidebar } from "../../lib/streampai_web/components/dashboard_layout.js";
import LocalStorage from "./hooks/local_storage_hook.js";
import FileUpload from "./hooks/file_upload_hook.js";
import InfiniteScroll from "./hooks/infinite_scroll_hook.js";

// Hooks for various functionality

// Copy to clipboard hook
const CopyToClipboard = {
  mounted() {
    this.el.addEventListener("click", () => {
      const text = this.el.dataset.clipboardText;
      const successMessage =
        this.el.dataset.clipboardMessage || "Copied to clipboard!";

      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.showNotification(successMessage);
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
            // Fallback to older method
            this.fallbackCopyText(text, successMessage);
          });
      } else {
        // Fallback for older browsers
        this.fallbackCopyText(text, successMessage);
      }
    });
  },

  fallbackCopyText(text, successMessage) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const success = document.execCommand("copy");
      if (success) {
        this.showNotification(successMessage);
      } else {
        this.showNotification("Failed to copy to clipboard", "error");
      }
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
      this.showNotification("Failed to copy to clipboard", "error");
    }
    document.body.removeChild(textArea);
  },

  showNotification(message, type = "success") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`;
    notification.textContent = message;
    notification.style.transform = "translateX(100%)";

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
    });

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  },
};

// Color Picker Synchronization Hook
const ColorPickerSync = {
  mounted() {
    const colorPickers = this.el.querySelectorAll('input[type="color"]');
    const textInputs = this.el.querySelectorAll('input[type="text"][pattern*="[0-9A-Fa-f]"]');

    // Create pairs of color picker and text input based on naming convention
    colorPickers.forEach(colorPicker => {
      const baseName = colorPicker.name.replace('_picker', '');
      const textInput = this.el.querySelector(`input[name="${baseName}_text"]`);

      if (textInput) {
        // Sync color picker to text input
        colorPicker.addEventListener('input', () => {
          textInput.value = colorPicker.value;
          // Trigger change event to update LiveView
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Sync text input to color picker
        textInput.addEventListener('input', () => {
          // Validate hex color format
          if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
            colorPicker.value = textInput.value;
          }
        });
      }
    });
  }
};

// Table Tooltip Hook - positions tooltips to avoid table overflow clipping
const TableTooltip = {
  mounted() {
    const tooltip = this.el.querySelector('[role="tooltip"]');
    const button = this.el.querySelector('button');

    if (!tooltip || !button) return;

    // Use fixed positioning to escape table overflow
    const showTooltip = () => {
      const rect = button.getBoundingClientRect();

      // Position tooltip using fixed positioning
      tooltip.style.position = 'fixed';
      tooltip.style.bottom = 'auto';
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 8}px`; // 8px gap above button
      tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
      tooltip.classList.remove('invisible', 'opacity-0');
      tooltip.classList.add('visible', 'opacity-100');
    };

    const hideTooltip = () => {
      tooltip.classList.add('invisible', 'opacity-0');
      tooltip.classList.remove('visible', 'opacity-100');
    };

    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);
    button.addEventListener('focus', showTooltip);
    button.addEventListener('blur', hideTooltip);

    // Store cleanup function
    this.cleanup = () => {
      button.removeEventListener('mouseenter', showTooltip);
      button.removeEventListener('mouseleave', hideTooltip);
      button.removeEventListener('focus', showTooltip);
      button.removeEventListener('blur', hideTooltip);
    };
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
};

// Slider Image Upload Hook
const SliderImageUpload = {
  mounted() {
    this.el.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const promises = files.map(file => this.processFile(file));

      Promise.all(promises).then(processedFiles => {
        this.pushEvent("upload_images", { images: processedFiles });
      }).catch(error => {
        console.error("Error processing files:", error);
      });
    });
  },

  processFile(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error(`File ${file.name} is too large`));
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error(`File ${file.name} is not an image`));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });
  }
};

// Sortable Images Hook
const SortableImages = {
  mounted() {
    // Simple drag and drop reordering
    let draggedElement = null;
    let draggedIndex = null;

    this.el.addEventListener("dragstart", (e) => {
      if (e.target.closest("[data-image-id]")) {
        draggedElement = e.target.closest("[data-image-id]");
        draggedIndex = Array.from(this.el.children).indexOf(draggedElement);
        e.dataTransfer.effectAllowed = "move";
        draggedElement.style.opacity = "0.5";
      }
    });

    this.el.addEventListener("dragend", (e) => {
      if (draggedElement) {
        draggedElement.style.opacity = "";
        draggedElement = null;
        draggedIndex = null;
      }
    });

    this.el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    this.el.addEventListener("drop", (e) => {
      e.preventDefault();
      const dropTarget = e.target.closest("[data-image-id]");

      if (dropTarget && draggedElement && dropTarget !== draggedElement) {
        const dropIndex = Array.from(this.el.children).indexOf(dropTarget);
        const children = Array.from(this.el.children);

        // Reorder in DOM
        if (draggedIndex < dropIndex) {
          this.el.insertBefore(draggedElement, dropTarget.nextSibling);
        } else {
          this.el.insertBefore(draggedElement, dropTarget);
        }

        // Get new order
        const newOrder = Array.from(this.el.children).map(child =>
          child.dataset.imageId
        );

        // Send to LiveView
        this.pushEvent("reorder_images", { image_ids: newOrder });
      }
    });

    // Make items draggable
    this.el.querySelectorAll("[data-image-id]").forEach(item => {
      item.draggable = true;
    });
  },

  updated() {
    // Make new items draggable
    this.el.querySelectorAll("[data-image-id]").forEach(item => {
      item.draggable = true;
    });
  }
};

// Slide Out Notification Hook
const SlideOutNotification = {
  mounted() {
    this.hideTimeout = null;
    this.isHovered = false;

    const show = () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      this.isHovered = true;
      this.el.style.transform = 'translateX(0)';
    };

    const hide = () => {
      this.isHovered = false;
      // Wait 250ms before hiding
      this.hideTimeout = setTimeout(() => {
        if (!this.isHovered) {
          this.el.style.transform = 'translateX(calc(100% - 20px))';
        }
      }, 250);
    };

    this.el.addEventListener('mouseenter', show);
    this.el.addEventListener('mouseleave', hide);

    // Start hidden (only showing edge)
    this.el.style.transform = 'translateX(calc(100% - 20px))';

    this.cleanup = () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.el.removeEventListener('mouseenter', show);
      this.el.removeEventListener('mouseleave', hide);
    };
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
};

let Hooks = {
  NameAvailabilityChecker,
  CopyToClipboard,
  NewsletterForm,
  MobileNavigation,
  DashboardSidebar,
  LocalStorage,
  ColorPickerSync,
  TableTooltip,
  FileUpload,
  AvatarUpload: FileUpload,  // Alias for backward compatibility
  SliderImageUpload,
  SortableImages,
  SlideOutNotification,
  InfiniteScroll,
  ...getHooks(liveVueApp),
};

// Carousel Widget Hook
Hooks.CarouselWidget = {
  mounted() {
    const config = JSON.parse(this.el.dataset.config);
    const slides = this.el.querySelectorAll("[data-slide]");
    let currentSlide = 0;

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("opacity-100", i === index);
        slide.classList.toggle("opacity-0", i !== index);
      });
    };

    // Auto-advance slides
    this.interval = setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }, config.interval || 5000);
  },

  destroyed() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
};

// Chat Widget Hook
Hooks.ChatDisplay = {
  mounted() {
    const config = JSON.parse(this.el.dataset.config);
    const messagesContainer = this.el.querySelector("#chat-messages");
    const maxMessages = config.max_messages || 10;

    // Demo usernames and messages
    const demoUsers = [
      "StreamMaster",
      "ChatBot",
      "Viewer123",
      "GamerGirl",
      "ProStreamer",
      "Anonymous",
      "SuperFan",
      "Moderator",
    ];
    const demoMessages = [
      "Hello everyone!",
      "Great stream! 🔥",
      "Can you play my favorite song?",
      "First time here, love it!",
      "pogChamp",
      "Amazing gameplay!",
      "What headset are you using?",
      "GG!",
      "When is the next stream?",
      "Thanks for the entertainment!",
      "This is so cool!",
      "New follower here! 👋",
      "Love your setup",
      "What game is this?",
      "Stream quality is perfect",
      "Can you do a face reveal?",
      "Your voice is so calming",
      "Best streamer ever! ⭐",
      "Play some music!",
      "How long have you been streaming?",
    ];

    let messages = [];
    let messageId = 0;

    const addMessage = () => {
      const username = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      const message =
        demoMessages[Math.floor(Math.random() * demoMessages.length)];

      // Create message element
      const messageEl = document.createElement("div");
      messageEl.className = "flex items-start space-x-3 animate-fade-in";
      messageEl.innerHTML = `
        <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-white text-xs font-bold">${username
            .charAt(0)
            .toUpperCase()}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <span class="text-sm font-semibold text-purple-300">${username}</span>
            <span class="text-xs text-gray-400">${new Date().toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            )}</span>
          </div>
          <p class="text-sm text-white break-words">${message}</p>
        </div>
      `;

      // Add to messages array
      messages.push({ id: messageId++, element: messageEl });

      // Remove oldest message if we exceed max
      if (messages.length > maxMessages) {
        const oldMessage = messages.shift();
        if (oldMessage.element.parentNode) {
          oldMessage.element.remove();
        }
      }

      // Add new message
      messagesContainer.appendChild(messageEl);

      // Auto scroll to bottom if enabled
      if (config.auto_scroll !== false) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    };

    // Add initial messages
    for (let i = 0; i < 3; i++) {
      setTimeout(() => addMessage(), i * 500);
    }

    // Continue adding messages at random intervals
    const scheduleNextMessage = () => {
      const delay = Math.random() * 4000 + 2000; // 2-6 seconds
      this.messageTimeout = setTimeout(() => {
        addMessage();
        scheduleNextMessage();
      }, delay);
    };

    scheduleNextMessage();
  },

  destroyed() {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
  },
};

const csrfToken = document
  .querySelector("meta[name='csrf-token']")
  .getAttribute("content");

// Debug hook registration
console.log("SliderImageUpload defined:", typeof SliderImageUpload);
console.log("SortableImages defined:", typeof SortableImages);
console.log("All hooks registered:", Object.keys(Hooks));

// Force add slider hooks directly to ensure they're included
const FinalHooks = Object.assign({}, Hooks, {
  SliderImageUpload: SliderImageUpload,
  SortableImages: SortableImages
});

console.log("Final hooks before LiveSocket:", Object.keys(FinalHooks));

let liveSocket = new LiveSocket("/live", Socket, {
  params: { _csrf_token: csrfToken },
  hooks: FinalHooks,
});
window.liveSocket = liveSocket;

liveSocket.connect();

// WebSocket connection debugging using proper Phoenix Socket events
if (liveSocket.socket) {
  liveSocket.socket.onOpen(() => {
    const transport =
      liveSocket.socket.transport?.constructor.name || "Unknown";
    console.log(`🟢 Socket connected via ${transport}!`);

    if (transport.includes("WebSocket")) {
      console.log("✅ Using WebSocket (real-time)");
    } else if (transport.includes("LongPoll")) {
      console.log("⚠️ Using Long Polling (fallback)");
    }
  });

  liveSocket.socket.onError(() => {
    console.log("🔴 Socket connection error");
  });

  liveSocket.socket.onClose((event) => {
    console.log("🟡 Socket disconnected:", event);
  });
}

topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" });
window.addEventListener("phx:page-loading-start", (_info) => topbar.show(300));
window.addEventListener("phx:page-loading-stop", (_info) => topbar.hide());
