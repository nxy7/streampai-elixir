# Design System

This document explains how to maintain consistent styling across the Streampai frontend application.

## Overview

The design system consists of two main parts:

1. **CSS Theme Variables** (`src/app.css`) - Central color palette and design tokens
2. **Component Utilities** (`src/styles/design-system.ts`) - Reusable component class patterns

## Changing Colors Globally

To update the app's color scheme, edit `src/app.css`:

```css
@theme {
  /* Brand Colors - Update these to change the entire app */
  --color-primary: #9333ea;        /* Main brand color */
  --color-primary-hover: #7e22ce;  /* Hover state */
  --color-secondary: #ec4899;      /* Accent color */
  /* ... */
}
```

### Key Theme Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `--color-primary` | Main brand color (buttons, links) | Purple 600 |
| `--color-secondary` | Accent color (gradients) | Pink 500 |
| `--color-success` | Success states | Green 500 |
| `--color-error` | Error states | Red 500 |
| `--color-bg-primary` | Main background | White |
| `--color-bg-secondary` | Secondary background | Gray 50 |
| `--color-text-primary` | Main text | Gray 900 |
| `--color-border` | Border color | Gray 200 |

## Using Component Utilities

Import and use predefined component styles:

```tsx
import { button, card, text, cn } from "~/styles/design-system";

// Basic usage
<button class={button.primary}>
  Save Changes
</button>

// Combining styles
<button class={cn(button.primary, "text-lg")}>
  Large Button
</button>

// Card components
<div class={card.default}>
  <h3 class={text.h3}>Card Title</h3>
  <p class={text.body}>Card content...</p>
</div>
```

## Component Patterns

### Buttons

```tsx
import { button } from "~/styles/design-system";

// Primary CTA
<button class={button.primary}>Save</button>

// Secondary action
<button class={button.secondary}>Cancel</button>

// Destructive action
<button class={button.danger}>Delete</button>

// Gradient (special CTAs)
<button class={button.gradient}>Upgrade to Pro</button>
```

### Cards

```tsx
import { card, text } from "~/styles/design-system";

// Standard card
<div class={card.default}>
  <h3 class={text.h3}>Section Title</h3>
  <p class={text.body}>Content here...</p>
</div>

// Gradient card (hero sections)
<div class={card.gradient}>
  <h2 class={text.h2}>Special Offer</h2>
</div>
```

### Form Inputs

```tsx
import { input, text } from "~/styles/design-system";

<div>
  <label class={text.muted}>Email Address</label>
  <input type="email" class={input.text} />
  <p class={text.helper}>We'll never share your email</p>
</div>

// Error state
<input type="email" class={input.error} />
<p class={text.error}>Invalid email address</p>
```

### Status Badges

```tsx
import { badge } from "~/styles/design-system";

<span class={badge.success}>Active</span>
<span class={badge.warning}>Pending</span>
<span class={badge.error}>Failed</span>
```

### Alerts

```tsx
import { alert } from "~/styles/design-system";

<div class={alert.info}>
  <svg class="w-5 h-5 text-blue-500">...</svg>
  <div>
    <p class="font-medium">Information</p>
    <p class="text-sm">This is an informational message.</p>
  </div>
</div>
```

## Best Practices

### ✅ Do

- Use CSS variables from `app.css` for colors
- Use component utilities from `design-system.ts` for common patterns
- Keep hardcoded colors minimal and document them
- Use semantic naming (primary, success, error) instead of color names

### ❌ Don't

- Hardcode colors like `bg-purple-600` everywhere (use `button.primary` instead)
- Create duplicate button/card styles across components
- Use arbitrary color values without adding them to the theme
- Mix Tailwind classes and inline styles inconsistently

## Adding New Patterns

When you create a new reusable component pattern:

1. Add it to `src/styles/design-system.ts`
2. Use theme variables from `app.css` when possible
3. Document it in this file

Example:

```typescript
// In design-system.ts
export const tooltip = {
  default: "absolute z-50 bg-gray-900 text-white text-xs rounded px-2 py-1",
};
```

## Future Enhancements

Potential improvements:

- **Dark mode**: Add dark theme variables in `app.css`
- **Theme switching**: Runtime theme changes via CSS variables
- **Component library**: Build reusable SolidJS components wrapping these patterns
- **Animation utilities**: Consistent transitions and animations

## Example: Refactoring Existing Code

Before:

```tsx
<button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
  Save
</button>
```

After:

```tsx
import { button } from "~/styles/design-system";

<button class={button.primary}>
  Save
</button>
```

**Benefits:**
- One place to update button styles globally
- Consistent appearance across the app
- Easier to maintain and update
