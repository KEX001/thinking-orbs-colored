# thinking-orbs-colored

> Animated 3D canvas thinking orbs for AI agents with **full color customization** support!

[![npm version](https://img.shields.io/npm/v/thinking-orbs-colored.svg)](https://www.npmjs.com/package/thinking-orbs-colored)

An enhanced, color-aware version of [`thinking-orbs`](https://github.com/Jakubantalik/thinking-orbs). Supports native color customization via HEX, RGB, HSL, or preset names while preserving full 3D particle depth, shading, and lighting animations.

---

## ✨ What's New in This Fork

1. **Color Engine Injection**: We successfully injected a dynamic RGB color engine into the minified WebGL context to perfectly preserve orb depth and shading.
2. **Dynamic React Props**: The `color` prop is fully threaded through the render tree so you can dynamically switch colors at runtime in React without unmounting.
3. **Interactive Palette**: Built-in parsers let you pass any HEX string, named color, RGB, or HSL value directly to the component.
4. **Light Mode UI**: The demo site includes a clean new visual playground to test real-time color syncing.

---

## 📦 Installation

```bash
npm install thinking-orbs-colored react react-dom
```

---

## 🚀 Quick Start

### React

```jsx
import { ThinkingOrb } from 'thinking-orbs-colored';

function Status() {
  return (
    <ThinkingOrb 
      state="composing" 
      size={64} 
      color="#4f46e5" 
      theme="light" 
    />
  );
}
```

### Vanilla JS / Script Tag

```html
<div id="orb-container"></div>

<script src="path/to/thinking-orb-bundle.js"></script>
<script>
  window.renderThinkingOrb('orb-container', 'composing', 64, 'light', 'purple');
</script>
```

---

## 🎨 Color Features & Presets

You can pass any of the following to the `color` prop:

| Type | Examples | Description |
| :--- | :--- | :--- |
| **Named Presets** | `"purple"`, `"emerald"`, `"indigo"`, `"blue"`, `"cyan"`, `"amber"`, `"rose"`, `"violet"` | Vibrant pre-tuned brand colors |
| **HEX Codes** | `"#4f46e5"`, `"#10b981"`, `"#ef4444"`, `"#f59e0b"` | Any standard 3-digit or 6-digit hex string |
| **HSL Strings** | `"hsl(243, 75%, 50%)"` | Direct HSL control |
| **RGB Strings** | `"rgb(79, 70, 229)"` | Standard RGB format |
| **Monochrome** | `"monochrome"`, `"grayscale"` | Standard black & white orb |

---

## ⚙️ Props & API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `state` | `"working"` \| `"searching"` \| `"solving"` \| `"listening"` \| `"composing"` \| `"shaping"` | `"working"` | Animation verb |
| `size` | `64` \| `20` | `64` | tuned scale preset (`64` for avatar scale, `20` for inline) |
| `color` | `string` | `"purple"` | Color hex, preset, HSL, or RGB string |
| `theme` | `"auto"` \| `"dark"` \| `"light"` | `"auto"` | Canvas background contrast theme |
| `speed` | `number` | `1` | Animation speed multiplier |
| `paused` | `boolean` | `false` | Pause or resume animation |

---

