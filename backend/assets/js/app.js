// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"

console.log("app.js loaded!")

// Hooks for various functionality
let Hooks = {}

// Carousel Widget Hook
Hooks.CarouselWidget = {
  mounted() {
    const config = JSON.parse(this.el.dataset.config);
    const slides = this.el.querySelectorAll('[data-slide]');
    let currentSlide = 0;
    
    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('opacity-100', i === index);
        slide.classList.toggle('opacity-0', i !== index);
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
  }
};

// Chat Widget Hook
Hooks.ChatWidget = {
  mounted() {
    const config = JSON.parse(this.el.dataset.config);
    const messagesContainer = this.el.querySelector('#chat-messages');
    const maxMessages = config.max_messages || 10;
    
    // Demo usernames and messages
    const demoUsers = ['StreamMaster', 'ChatBot', 'Viewer123', 'GamerGirl', 'ProStreamer', 'Anonymous', 'SuperFan', 'Moderator'];
    const demoMessages = [
      'Hello everyone!',
      'Great stream! 🔥',
      'Can you play my favorite song?',
      'First time here, love it!',
      'pogChamp',
      'Amazing gameplay!',
      'What headset are you using?',
      'GG!',
      'When is the next stream?',
      'Thanks for the entertainment!',
      'This is so cool!',
      'New follower here! 👋',
      'Love your setup',
      'What game is this?',
      'Stream quality is perfect',
      'Can you do a face reveal?',
      'Your voice is so calming',
      'Best streamer ever! ⭐',
      'Play some music!',
      'How long have you been streaming?'
    ];
    
    let messages = [];
    let messageId = 0;
    
    const addMessage = () => {
      const username = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      const message = demoMessages[Math.floor(Math.random() * demoMessages.length)];
      
      // Create message element
      const messageEl = document.createElement('div');
      messageEl.className = 'flex items-start space-x-3 animate-fade-in';
      messageEl.innerHTML = `
        <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-white text-xs font-bold">${username.charAt(0).toUpperCase()}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <span class="text-sm font-semibold text-purple-300">${username}</span>
            <span class="text-xs text-gray-400">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
  }
};

// Name availability checker hook
Hooks.NameAvailabilityChecker = {
  mounted() {
    this.debounceTimer = null;
    this.currentName = this.el.value;
    
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
  
  destroyed() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
  }
};

// Cursor tracking hook
Hooks.CursorTracker = {
  mounted() {
    console.log("CursorTracker hook mounted!")
    let throttleTimer = null
    let lastX = null
    let lastY = null
    const throttleDelay = 100 // Throttle to 10fps to reduce server load
    const minMovement = 5 // Only send updates if cursor moved at least 5px
    
    this.handleMouseMove = (event) => {
      if (throttleTimer) return
      
      // Get coordinates relative to the cursor container element
      const containerRect = this.el.getBoundingClientRect()
      const x = event.clientX - containerRect.left + window.scrollX
      const y = event.clientY - containerRect.top + window.scrollY
      
      // Only send update if cursor moved significantly
      if (lastX !== null && lastY !== null) {
        const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2))
        if (distance < minMovement) return
      }
      
      throttleTimer = setTimeout(() => {
        console.log(`Sending cursor move: ${x}, ${y} (relative to container)`)
        this.pushEvent("cursor_move", { x: x, y: y })
        lastX = x
        lastY = y
        throttleTimer = null
      }, throttleDelay)
    }
    
    // Listen for mouse movement on the entire document
    document.addEventListener("mousemove", this.handleMouseMove)
  },
  
  destroyed() {
    document.removeEventListener("mousemove", this.handleMouseMove)
  }
}

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
console.log("All hooks registered:", Object.keys(Hooks))

let liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: Hooks
})

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

// connect if there are any LiveViews on the page
console.log("Connecting LiveSocket...")
liveSocket.connect()

// Add connection debugging
liveSocket.onOpen(() => console.log("LiveSocket connected!"))
liveSocket.onError(() => console.log("LiveSocket connection error!"))
liveSocket.onClose(() => console.log("LiveSocket disconnected!"))

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

