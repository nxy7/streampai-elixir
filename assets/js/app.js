import "phoenix_html";
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import topbar from "topbar";
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';

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
import ThumbnailSelector from "./hooks/thumbnail_selector_hook.js";
import SettingsThumbnailUpload from "./hooks/settings_thumbnail_upload_hook.js";

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

// Voice Selector Hook
const VoiceSelector = {
  mounted() {
    const button = this.el.querySelector('#voice-selector-button');
    const dropdown = this.el.querySelector('#voice-selector-dropdown');
    const hiddenInput = this.el.querySelector('#selected-voice-input');
    const label = this.el.querySelector('#selected-voice-label');
    const options = this.el.querySelectorAll('.voice-option');
    const playButtons = this.el.querySelectorAll('.voice-play-btn');

    let currentAudio = null;
    let isDropdownOpen = false;

    // Get S3 base URL from environment or default
    const s3BaseUrl = window.S3_BASE_URL || 'https://your-s3-bucket.s3.amazonaws.com';

    // Toggle dropdown
    const toggleDropdown = (e) => {
      e.preventDefault();
      isDropdownOpen = !isDropdownOpen;

      if (isDropdownOpen) {
        dropdown.classList.remove('hidden');
      } else {
        dropdown.classList.add('hidden');
      }
    };

    // Close dropdown when clicking outside
    const closeDropdown = (e) => {
      if (!this.el.contains(e.target)) {
        dropdown.classList.add('hidden');
        isDropdownOpen = false;
      }
    };

    // Handle voice selection
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const value = option.dataset.voiceValue;
        hiddenInput.value = value;

        // Update label text
        const voiceName = option.querySelector('.text-sm.font-medium')?.textContent || 'Use first available voice';
        label.textContent = voiceName;

        // Highlight selected option
        options.forEach(opt => opt.classList.remove('bg-purple-50'));
        option.classList.add('bg-purple-50');

        // Close dropdown
        dropdown.classList.add('hidden');
        isDropdownOpen = false;
      });
    });

    // Handle audio preview
    playButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const voiceValue = btn.dataset.voicePreview;

        // Stop current audio if playing
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }

        // Play new audio
        const audioUrl = `${s3BaseUrl}/tts/${voiceValue}_example.mp3`;
        currentAudio = new Audio(audioUrl);

        // Visual feedback
        const originalSvg = btn.innerHTML;
        btn.innerHTML = `
          <svg class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        `;
        btn.classList.add('bg-purple-200');

        currentAudio.play().catch(err => {
          console.error('Failed to play audio preview:', err);
          // Show error feedback
          btn.innerHTML = `
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          `;
        });

        // Reset button when audio ends
        currentAudio.addEventListener('ended', () => {
          btn.innerHTML = originalSvg;
          btn.classList.remove('bg-purple-200');
        });

        // Reset button on error
        currentAudio.addEventListener('error', () => {
          setTimeout(() => {
            btn.innerHTML = originalSvg;
            btn.classList.remove('bg-purple-200');
          }, 2000);
        });
      });
    });

    button.addEventListener('click', toggleDropdown);
    document.addEventListener('click', closeDropdown);

    // Highlight currently selected option
    const currentValue = hiddenInput.value;
    options.forEach(opt => {
      if (opt.dataset.voiceValue === currentValue) {
        opt.classList.add('bg-purple-50');
      }
    });

    // Cleanup
    this.cleanup = () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      button.removeEventListener('click', toggleDropdown);
      document.removeEventListener('click', closeDropdown);
    };
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
};

// Platform Distribution Chart Hook
Chart.register(ArcElement, Tooltip, Legend, PieController);

const PlatformChart = {
  mounted() {
    const stats = JSON.parse(this.el.dataset.stats);
    const canvas = this.el.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const platforms = Object.keys(stats);
    const counts = Object.values(stats);

    // Define platform colors
    const platformColors = {
      twitch: '#9146FF',
      youtube: '#FF0000',
      facebook: '#1877F2',
      kick: '#53FC18'
    };

    const colors = platforms.map(p => platformColors[p] || '#6B7280');

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
        datasets: [{
          data: counts,
          backgroundColor: colors,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--tw-bg-opacity') ? '#1F2937' : '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#9CA3AF',
              padding: 12,
              font: {
                size: 13,
                family: 'Inter, system-ui, sans-serif'
              },
              boxWidth: 15,
              boxHeight: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#F3F4F6',
            bodyColor: '#F3F4F6',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} viewers (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    // Listen for chart updates from LiveView
    this.handleEvent("update-chart", ({stats}) => {
      this.updateChart(stats);
    });
  },

  updateChart(stats) {
    if (!this.chart) return;

    const platforms = Object.keys(stats);
    const counts = Object.values(stats);

    // Define platform colors
    const platformColors = {
      twitch: '#9146FF',
      youtube: '#FF0000',
      facebook: '#1877F2',
      kick: '#53FC18'
    };

    const colors = platforms.map(p => platformColors[p] || '#6B7280');

    this.chart.data.labels = platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1));
    this.chart.data.datasets[0].data = counts;
    this.chart.data.datasets[0].backgroundColor = colors;
    this.chart.update();
  },

  destroyed() {
    if (this.chart) {
      this.chart.destroy();
    }
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
  ThumbnailSelector,
  SettingsThumbnailUpload,
  VoiceSelector,
  PlatformChart,
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

// Canvas Context Menu Hook
Hooks.CanvasContextMenu = {
  mounted() {
    const canvas = this.el;
    const contextMenu = document.getElementById('widget-context-menu');
    let hideMenuListener;

    // Prevent default context menu
    const contextMenuHandler = (e) => {
      e.preventDefault();

      // Get canvas position
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Get scale factor from canvas scaler
      const scaler = document.getElementById('canvas-scaler');
      const scale = parseFloat(scaler?.dataset.scale || 1);

      // Convert scaled coordinates to Full HD coordinates
      const fullHdX = clickX / scale;
      const fullHdY = clickY / scale;

      // Store Full HD coordinates on the menu
      contextMenu.dataset.clickX = Math.round(fullHdX);
      contextMenu.dataset.clickY = Math.round(fullHdY);

      // Position context menu at click location (visual position)
      contextMenu.style.left = e.clientX + 'px';
      contextMenu.style.top = e.clientY + 'px';
      contextMenu.classList.remove('hidden');
    };

    // Hide context menu on click anywhere
    hideMenuListener = () => {
      contextMenu.classList.add('hidden');
    };

    canvas.addEventListener('contextmenu', contextMenuHandler);
    document.addEventListener('click', hideMenuListener);

    // Store cleanup
    this.cleanup = () => {
      canvas.removeEventListener('contextmenu', contextMenuHandler);
      document.removeEventListener('click', hideMenuListener);
    };
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
};

// Canvas Scaler Hook - scales 1920x1080 canvas to fit viewport
Hooks.CanvasScaler = {
  mounted() {
    this.updateScale = () => {
      const container = this.el.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const canvasWidth = 1920;
      const canvasHeight = 1080;

      // Check if we're in fullscreen mode (container has flex class)
      const isFullscreen = container.classList.contains('!flex');

      // Calculate scale to fit both width and height, maintaining aspect ratio
      // Use the smaller scale to ensure canvas fits completely in the container
      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      // Apply scale transform
      this.el.style.transform = `scale(${scale})`;

      // In fullscreen mode, center using transform origin center
      // Otherwise use top left for normal mode
      if (isFullscreen) {
        this.el.style.transformOrigin = 'center center';
      } else {
        this.el.style.transformOrigin = 'top left';
      }

      // Store scale factor for other hooks to use
      this.el.dataset.scale = scale;

      // Only set container height in non-fullscreen mode
      if (!isFullscreen) {
        container.style.height = `${canvasHeight * scale}px`;
      }

      // Show current scale in console for debugging
      console.log(`Canvas scaled to ${(scale * 100).toFixed(1)}% (${Math.round(canvasWidth * scale)}x${Math.round(canvasHeight * scale)}) - Fullscreen: ${isFullscreen}`);
    };

    // Initial scale with slight delay to ensure layout is ready
    setTimeout(() => this.updateScale(), 10);

    // Update on window resize
    const resizeObserver = new ResizeObserver(() => {
      this.updateScale();
    });

    resizeObserver.observe(this.el.parentElement);

    this.cleanup = () => {
      resizeObserver.disconnect();
    };
  },

  updated() {
    // Re-apply scale after LiveView updates the DOM
    // Use requestAnimationFrame to ensure DOM is settled
    requestAnimationFrame(() => {
      if (this.updateScale) {
        this.updateScale();
      }
    });
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
};

// Context Menu Button Hook
Hooks.ContextMenuButton = {
  mounted() {
    this.el.addEventListener('click', (e) => {
      const menu = document.getElementById('widget-context-menu');
      const x = parseInt(menu.dataset.clickX);
      const y = parseInt(menu.dataset.clickY);

      this.pushEvent('add_widget_at_position', { x, y });
    });
  }
};

// Widget Connection Lines Hook
Hooks.WidgetConnections = {
  mounted() {
    this.isUpdating = false;
    this.updateLines();

    // Listen for custom update events from drag operations
    const updateHandler = (e) => {
      const widgetId = e.detail?.widgetId || null;
      this.updateLines(widgetId);
    };
    this.el.addEventListener('update-lines', updateHandler);

    this.cleanup = () => {
      this.el.removeEventListener('update-lines', updateHandler);
    };
  },

  updated() {
    this.updateLines();
  },

  updateLines(draggedWidgetId = null) {
    // Prevent re-entrant calls
    if (this.isUpdating) return;

    this.isUpdating = true;

    try {
      const svg = this.el.querySelector('svg');
      if (!svg) return;

      const widgets = Array.from(this.el.querySelectorAll('.placeholder-widget'));

      // Clear existing lines
      svg.innerHTML = '';

      // Track connections for each widget
      const connections = new Map();
      widgets.forEach(widget => {
        connections.set(widget.dataset.widgetId, []);
      });

      if (widgets.length < 2) {
        // Update connection displays to show "None"
        widgets.forEach(widget => {
          this.updateConnectionDisplay(widget.dataset.widgetId, []);
        });
        return;
      }

      // Track which pairs we've already drawn to avoid duplicates
      const drawnPairs = new Set();

      widgets.forEach(widget => {
        // Find single nearest widget within reasonable distance (2000px allows full canvas coverage)
        const nearestWidgets = this.findNearestWidgets(widget, widgets, 1, 2000);

        nearestWidgets.forEach(nearWidget => {
          const id1 = widget.dataset.widgetId;
          const id2 = nearWidget.dataset.widgetId;
          const pairKey = [id1, id2].sort().join('-');

          // Skip if we've already drawn this pair
          if (drawnPairs.has(pairKey)) return;
          drawnPairs.add(pairKey);

          // Track connections
          connections.get(id1).push(id2);
          connections.get(id2).push(id1);

          const lineData = this.calculateLineBetweenWidgets(widget, nearWidget);
          if (!lineData) return;

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', lineData.x1);
          line.setAttribute('y1', lineData.y1);
          line.setAttribute('x2', lineData.x2);
          line.setAttribute('y2', lineData.y2);

          // Highlight lines connected to dragged widget
          const isConnectedToDragged = draggedWidgetId && (id1 === draggedWidgetId || id2 === draggedWidgetId);

          if (isConnectedToDragged) {
            line.setAttribute('stroke', '#FFD700'); // Gold color for highlighted lines
            line.setAttribute('stroke-width', '3');
            line.setAttribute('opacity', '1');
            line.classList.add('highlighted-line');
          } else {
            line.setAttribute('stroke', this.randomColor(id1));
            line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', '0.6');
          }

          // Store widget IDs as data attributes for later highlighting
          line.dataset.widget1 = id1;
          line.dataset.widget2 = id2;

          svg.appendChild(line);
        });
      });

      // Update connection displays
      connections.forEach((connectedIds, widgetId) => {
        this.updateConnectionDisplay(widgetId, connectedIds);
      });
    } finally {
      this.isUpdating = false;
    }
  },

  updateConnectionDisplay(widgetId, connectedIds) {
    const connectionDiv = document.querySelector(`[data-connections-for="${widgetId}"]`);
    if (!connectionDiv) return;

    const connectionList = connectionDiv.querySelector('.connections-list');
    if (!connectionList) return;

    if (connectedIds.length === 0) {
      connectionList.textContent = 'None';
      connectionList.classList.add('text-gray-500');
      connectionList.classList.remove('text-gray-400');
    } else {
      connectionList.textContent = connectedIds.join(', ');
      connectionList.classList.remove('text-gray-500');
      connectionList.classList.add('text-gray-400');
    }
  },

  findNearestWidgets(widget, widgets, maxCount = 3, maxDistance = 2000) {
    const rect = widget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distances to all other widgets
    const widgetDistances = [];

    widgets.forEach(other => {
      if (other === widget) return;

      const otherRect = other.getBoundingClientRect();
      const otherCenterX = otherRect.left + otherRect.width / 2;
      const otherCenterY = otherRect.top + otherRect.height / 2;

      const dx = otherCenterX - centerX;
      const dy = otherCenterY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      widgetDistances.push({ widget: other, distance });
    });

    // Sort by distance and return nearest widgets within max distance
    return widgetDistances
      .sort((a, b) => a.distance - b.distance)
      .filter(item => item.distance <= maxDistance)
      .slice(0, maxCount)
      .map(item => item.widget);
  },

  calculateLineBetweenWidgets(widget1, widget2) {
    // Get canvas scale factor
    const scaler = document.getElementById('canvas-scaler');
    const scale = parseFloat(scaler?.dataset.scale || 1);

    const canvas = this.el.getBoundingClientRect();
    const rect1 = widget1.getBoundingClientRect();
    const rect2 = widget2.getBoundingClientRect();

    // Calculate centers relative to canvas, accounting for scale
    const c1x = (rect1.left - canvas.left) / scale + (rect1.width / scale) / 2;
    const c1y = (rect1.top - canvas.top) / scale + (rect1.height / scale) / 2;
    const c2x = (rect2.left - canvas.left) / scale + (rect2.width / scale) / 2;
    const c2y = (rect2.top - canvas.top) / scale + (rect2.height / scale) / 2;

    // Find where the center-to-center line intersects each widget's boundary
    const edge1 = this.lineRectIntersection(
      c1x, c1y, c2x, c2y,
      (rect1.left - canvas.left) / scale,
      (rect1.top - canvas.top) / scale,
      rect1.width / scale,
      rect1.height / scale
    );

    const edge2 = this.lineRectIntersection(
      c2x, c2y, c1x, c1y,
      (rect2.left - canvas.left) / scale,
      (rect2.top - canvas.top) / scale,
      rect2.width / scale,
      rect2.height / scale
    );

    return {
      x1: edge1.x,
      y1: edge1.y,
      x2: edge2.x,
      y2: edge2.y
    };
  },

  lineRectIntersection(x1, y1, x2, y2, rectX, rectY, rectWidth, rectHeight) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return { x: x1, y: y1 };
    }

    const rectLeft = rectX;
    const rectRight = rectX + rectWidth;
    const rectTop = rectY;
    const rectBottom = rectY + rectHeight;

    let tMin = 0;
    let tMax = 1;

    // Check intersection with each edge
    const edges = [
      { t: (rectLeft - x1) / dx, side: 'left' },
      { t: (rectRight - x1) / dx, side: 'right' },
      { t: (rectTop - y1) / dy, side: 'top' },
      { t: (rectBottom - y1) / dy, side: 'bottom' }
    ];

    // Find the intersection point on the rectangle boundary
    for (const edge of edges) {
      if (!isFinite(edge.t)) continue;
      if (edge.t < 0) continue;

      const ix = x1 + edge.t * dx;
      const iy = y1 + edge.t * dy;

      // Check if intersection point is on the rectangle boundary
      if (ix >= rectLeft - 0.1 && ix <= rectRight + 0.1 &&
          iy >= rectTop - 0.1 && iy <= rectBottom + 0.1) {
        return { x: ix, y: iy };
      }
    }

    // Fallback to center if no intersection found
    return { x: x1, y: y1 };
  },

  randomColor(widgetId) {
    // Generate consistent color from widget ID
    let hash = 0;
    for (let i = 0; i < widgetId.length; i++) {
      hash = widgetId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
};

// Draggable Widget Hook
Hooks.DraggableWidget = {
  mounted() {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = parseInt(this.el.style.left) || 0;
    let yOffset = parseInt(this.el.style.top) || 0;
    let animationFrameId = null;

    // Get scale factor helper
    const getScale = () => {
      const scaler = document.getElementById('canvas-scaler');
      return parseFloat(scaler?.dataset.scale || 1);
    };

    const dragStart = (e) => {
      // Don't drag when clicking delete button
      if (e.target.closest('.delete-widget-btn')) {
        return;
      }

      // Get canvas position and scale
      const canvas = this.el.parentElement;
      const canvasRect = canvas.getBoundingClientRect();
      const scale = getScale();

      // Calculate mouse position relative to canvas in Full HD coordinates
      const mouseCanvasX = (e.clientX - canvasRect.left) / scale;
      const mouseCanvasY = (e.clientY - canvasRect.top) / scale;

      // Calculate offset from widget's top-left corner
      initialX = mouseCanvasX - xOffset;
      initialY = mouseCanvasY - yOffset;

      // Allow dragging from anywhere on the widget
      isDragging = true;
      this.el.style.cursor = 'grabbing';

      // Add visual feedback - highlight the widget
      this.el.style.transform = 'scale(1.02)';
      this.el.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.5)';
      this.el.style.zIndex = '1000';
      this.el.style.opacity = '0.95';

      // Initial line update with highlighting
      this.updateConnectionLines(this.el.dataset.widgetId);
    };

    const dragEnd = (e) => {
      if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        this.el.style.cursor = 'move';

        // Remove visual feedback
        this.el.style.transform = '';
        this.el.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
        this.el.style.zIndex = '';
        this.el.style.opacity = '';

        // Cancel any pending animation frame
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }

        // Send position update to LiveView (in Full HD coordinates)
        this.pushEvent("update_widget_position", {
          id: this.el.dataset.widgetId,
          x: Math.round(xOffset),
          y: Math.round(yOffset)
        });

        // Final line update
        this.updateConnectionLines();
      }
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();

        // Get canvas position and scale
        const canvas = this.el.parentElement;
        const canvasRect = canvas.getBoundingClientRect();
        const scale = getScale();

        // Calculate mouse position relative to canvas in Full HD coordinates
        const mouseCanvasX = (e.clientX - canvasRect.left) / scale;
        const mouseCanvasY = (e.clientY - canvasRect.top) / scale;

        // Calculate new widget position in Full HD coordinates
        currentX = mouseCanvasX - initialX;
        currentY = mouseCanvasY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        // Get widget dimensions in Full HD coordinates
        const widgetRect = this.el.getBoundingClientRect();
        const widgetWidth = widgetRect.width / scale;
        const widgetHeight = widgetRect.height / scale;

        // Constrain to canvas boundaries (Full HD: 1920x1080)
        xOffset = Math.max(0, Math.min(xOffset, 1920 - widgetWidth));
        yOffset = Math.max(0, Math.min(yOffset, 1080 - widgetHeight));

        // Apply position (canvas is 1920x1080, no scaling needed for positioning)
        this.el.style.left = xOffset + "px";
        this.el.style.top = yOffset + "px";

        // Throttle line updates using requestAnimationFrame
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(() => {
            this.updateConnectionLines(this.el.dataset.widgetId);
            animationFrameId = null;
          });
        }
      }
    };

    this.el.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    // Store cleanup
    this.cleanup = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      this.el.removeEventListener("mousedown", dragStart);
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);
    };
  },

  updateConnectionLines(widgetId = null) {
    const canvas = this.el.parentElement;
    const event = new CustomEvent('update-lines', { detail: { widgetId } });
    canvas.dispatchEvent(event);
  },

  destroyed() {
    if (this.cleanup) this.cleanup();
  }
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
