import { ref, provide, inject, onMounted, onUnmounted, readonly } from 'vue'

export interface WidgetPosition {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  element?: HTMLElement
}

const WIDGET_REGISTRY_KEY = Symbol('widgetRegistry')

// Parent composable - used by the canvas
export function useWidgetRegistryProvider() {
  const widgets = ref<Map<string, WidgetPosition>>(new Map())

  function registerWidget(widget: WidgetPosition) {
    widgets.value.set(widget.id, widget)
  }

  function unregisterWidget(id: string) {
    widgets.value.delete(id)
  }

  function updateWidgetPosition(id: string, updates: Partial<WidgetPosition>) {
    const widget = widgets.value.get(id)
    if (widget) {
      widgets.value.set(id, { ...widget, ...updates })
    }
  }

  function getWidget(id: string) {
    return widgets.value.get(id)
  }

  function getWidgetsByType(type: string) {
    return Array.from(widgets.value.values()).filter(w => w.type === type)
  }

  function getAllWidgets() {
    return Array.from(widgets.value.values())
  }

  function getWidgetCenter(id: string) {
    const widget = widgets.value.get(id)
    if (!widget) return null
    return {
      x: widget.x + widget.width / 2,
      y: widget.y + widget.height / 2
    }
  }

  const registry = {
    registerWidget,
    unregisterWidget,
    updateWidgetPosition,
    getWidget,
    getWidgetsByType,
    getAllWidgets,
    getWidgetCenter,
    widgets: readonly(widgets)
  }

  provide(WIDGET_REGISTRY_KEY, registry)

  return registry
}

// Child composable - used by widgets
export function useWidgetRegistry() {
  const registry = inject<ReturnType<typeof useWidgetRegistryProvider>>(WIDGET_REGISTRY_KEY)

  if (!registry) {
    throw new Error('useWidgetRegistry must be used within a component that provides the registry')
  }

  return registry
}

// Helper for auto-registering widgets
export function useWidgetRegistration(
  type: string,
  initialPos: { x: number; y: number },
  options: { id?: string } = {}
) {
  const registry = useWidgetRegistry()
  const widgetId = options.id || `${type}-${Date.now()}-${Math.random()}`
  const elementRef = ref<HTMLElement>()

  function updatePosition() {
    if (!elementRef.value) return

    const rect = elementRef.value.getBoundingClientRect()
    registry.updateWidgetPosition(widgetId, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      element: elementRef.value
    })
  }

  onMounted(() => {
    registry.registerWidget({
      id: widgetId,
      type,
      x: initialPos.x,
      y: initialPos.y,
      width: 0,
      height: 0,
      element: elementRef.value
    })

    setTimeout(updatePosition, 0)

    const resizeObserver = new ResizeObserver(updatePosition)
    if (elementRef.value) {
      resizeObserver.observe(elementRef.value)
    }

    onUnmounted(() => {
      resizeObserver.disconnect()
      registry.unregisterWidget(widgetId)
    })
  })

  return {
    widgetId,
    elementRef,
    updatePosition
  }
}
