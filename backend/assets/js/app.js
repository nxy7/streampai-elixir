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
import * as LiveSvelte from "live_svelte"

console.log("app.js loaded!")
console.log("LiveSvelte imported:", LiveSvelte)
console.log("LiveSvelte.makeHooks:", typeof LiveSvelte.makeHooks)

// Cursor tracking hook
let Hooks = {}
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
// Create LiveSvelte hooks if available, otherwise use empty object
let liveSvelteHooks = {}
if (LiveSvelte && typeof LiveSvelte.getHooks === 'function') {
  try {
    liveSvelteHooks = LiveSvelte.getHooks()
    console.log("LiveSvelte hooks loaded successfully:", Object.keys(liveSvelteHooks))
  } catch (e) {
    console.warn("Failed to load LiveSvelte hooks:", e)
  }
} else {
  console.log("LiveSvelte not available, using plain hooks only")
}

const allHooks = {...liveSvelteHooks, ...Hooks}
console.log("All hooks registered:", Object.keys(allHooks))

let liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: allHooks
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

