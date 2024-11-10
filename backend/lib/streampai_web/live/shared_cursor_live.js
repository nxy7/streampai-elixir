// Cursor tracking hook for shared cursor functionality
export const CursorTracker = {
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
};