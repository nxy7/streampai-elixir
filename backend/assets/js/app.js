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
import "phoenix_html";
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import topbar from "../vendor/topbar";

console.log("app.js loaded!");

// Import collocated hooks
import { NameAvailabilityChecker } from "../../lib/streampai_web/live/settings_live.js";
import { CursorTracker } from "../../lib/streampai_web/live/shared_cursor_live.js";

// Hooks for various functionality
let Hooks = {
  NameAvailabilityChecker,
  CursorTracker,
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
Hooks.ChatWidget = {
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
console.log("All hooks registered:", Object.keys(Hooks));

const liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 3500,
  params: { _csrf_token: csrfToken },
  hooks: Hooks,
});

// Show progress bar on live navigation and form submits
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" });
window.addEventListener("phx:page-loading-start", (_info) => topbar.show(300));
window.addEventListener("phx:page-loading-stop", (_info) => topbar.hide());

// connect if there are any LiveViews on the page
console.log("Connecting LiveSocket...");
liveSocket.connect();

// Add connection debugging
liveSocket.onOpen(() => console.log("LiveSocket connected!"));
liveSocket.onError(() => console.log("LiveSocket connection error!"));
liveSocket.onClose(() => console.log("LiveSocket disconnected!"));

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket;
