# FootDash Theme System

This directory contains the theme configuration and design tokens for the FootDash application.

## Files

### `_tokens.scss`
Design tokens defining CSS custom properties (CSS variables) for:
- Color palette (primary, secondary, success, warning, danger, neutral)
- Team-based colors for dynamic theming
- Background and surface colors
- Text colors
- Spacing and typography tokens

These tokens are globally available via CSS custom properties and can be used directly in component styles:

```scss
.my-component {
  color: var(--primary-color);
  background: var(--team-primary);
}
```

### `variables.scss`
Main theme entry point that imports and forwards the tokens module. This file uses modern Sass module system (`@use` and `@forward`) instead of deprecated `@import`.

The theme is loaded in `global.scss` via:
```scss
@use 'theme/variables.scss';
```

## Sass Module System

This project uses the modern Sass module system:
- `@use` - Import a module for use in current file
- `@forward` - Re-export a module for downstream consumers
- `@import` - **Deprecated**, only used for external CSS files (e.g., Ionic styles)

## Adding New Tokens

To add new design tokens:

1. Add CSS custom properties to `_tokens.scss` inside the `:root` selector
2. Use the token in component styles via `var(--token-name)`
3. No need to import the theme in component files - tokens are global

## Team-Based Theming

The theme system supports dynamic team-based colors. To apply team colors:

```typescript
// In component TypeScript
document.documentElement.style.setProperty('--team-primary', '#e53e3e');
```

Or use CSS classes for predefined teams (if implemented).
