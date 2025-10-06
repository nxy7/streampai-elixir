/**
 * Composable for animating number changes with easing
 */
export function useNumberAnimation() {
  function animateNumber(
    startValue: number,
    endValue: number,
    onUpdate: (value: number) => void,
    duration: number = 800
  ): void {
    const difference = endValue - startValue
    const start = Date.now()

    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentValue = Math.round(startValue + difference * easeOut)
      onUpdate(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onUpdate(endValue)
      }
    }

    animate()
  }

  return {
    animateNumber
  }
}
