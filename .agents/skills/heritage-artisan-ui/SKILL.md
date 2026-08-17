---
name: heritage-artisan-ui
description: Design principles, modern glassmorphism recipes, chip component architecture, authentic Bengali heritage warmth tokens, and accessibility standards for the Mondal Barir Pujo (মন্ডল বাড়ির পুজো) platform.
argument-hint: Which component, modal, or design token do you want to inspect or implement?
disable-model-invocation: false
---

# Heritage Artisan UI Design System & Engineering Specification
### মন্ডল বাড়ির পুজো / ফুরফুরা মণ্ডল পরিবার (Furfura Mondal Poribar) — 150+ Years Heritage Platform

---

## 1. Executive Aesthetic Philosophy & Core Identity

The Mondal Barir Pujo web platform represents a sacred, 150+ year living legacy dating back to the 1870s in Furfura, Hooghly. The visual and interactive experience must reflect **Authentic Bengali Bonedi Heritage Warmth** harmoniously merged with **Apple-Grade Precision Engineering and Fluid Micro-interactions (HIG-Standard)**.

```
       ┌────────────────────────────────────────────────────────┐
       │             HERITAGE ARTISAN UI ARCHITECTURE           │
       ├──────────────────────────┬─────────────────────────────┤
       │   BENGALI HERITAGE CORE  │    APPLE-GRADE GLASS & UI   │
       ├──────────────────────────┼─────────────────────────────┤
       │ • Alpona Gold & Ochre    │ • Multi-layered Frosted Blur│
       │ • Kumkum Sindoor Red     │ • Micro-grain Lacquer Depth │
       │ • Kash & Shiuli White    │ • Modern Capsule Chips      │
       │ • Dhunuchi Brass/Bronze  │ • Dynamic Island & Docks    │
       │ • Calligraphic Galada    │ • WCAG AA 4.5:1 Contrast    │
       └──────────────────────────┴─────────────────────────────┘
```

---

## 2. Anti-AI Gimmick Guidelines (Strict Aesthetic Rules)

To ensure timeless cultural dignity and avoid ephemeral web design fads, developers and designers MUST abide by the following prohibitions and replacements:

| AI Gimmick / Anti-Pattern | Why It Fails Heritage UX | Mandatory Heritage Artisan Replacement |
| :--- | :--- | :--- |
| **Harsh Neon Border Halos** | Looks like a synthetic crypto/cyberpunk landing page. | **Specular Hairline Borders**: `1px solid rgba(255, 255, 255, 0.14)` with subtle top-lit gradient and warm brass rim light. |
| **Purple/Violet on Dark** | Generic AI SaaS template trope (`#833ab4`, `#9333ea`). | **Authentic Temple Warmth**: Alpona Gold (`#FFCF40`), Sindoor Vermilion (`#D32F2F`), and Kashtami Ochre (`#D97706`). Instagram gradient is permitted *strictly* inside Instagram-branded social chips. |
| **Muddy / Washed-Out Blacks** | Low-contrast grayish backgrounds (`#1f2937`) make Bengali script unreadable. | **Natmandir Deep Obsidian Lacquer**: `#070A12` base with `#0D111C` and `#121826` layered frosted glass cards. |
| **Random Mesh Gradients** | Distracts from sacred Puja photography and Durga artwork. | **Atmospheric Scenic Lighting**: Time-of-day dynamic skies (Bhor, Sokal, Sandhya Aarti) with soft radial vignette. |
| **Bloated Bento Grid Clutter** | Creates visual noise with disparate asymmetrical boxes. | **Structured Capsule Cards & Timeline Chunks**: Cohesive radius hierarchy (`--radius-md: 16px`, `--radius-lg: 24px`, `--radius-pill: 9999px`). |
| **Fake Futuristic Gimmicks** | Holograms, cyber grids, spinning glowing orbs. | **Authentic Physical Artifacts**: Dhak wooden barrel resonance, Bell-metal Kanshor resonance, Shankha sacred conch ripple, organic falling Shiuli petals. |

---

## 3. Heritage Design Tokens & Palette

### CSS Custom Properties Blueprint

```css
:root {
  /* ==========================================================================
     1. HERITAGE COLOR SYSTEM
     ========================================================================== */
  /* Alpona Gold (Primary Sacred Accent) */
  --heritage-gold: #ffcf40;
  --heritage-gold-light: #ffe285;
  --heritage-gold-dark: #b38f00;
  --heritage-gold-glow: rgba(255, 207, 64, 0.28);
  --heritage-gold-subtle: rgba(255, 207, 64, 0.12);

  /* Kumkum & Sindoor Vermilion (Primary Action & Festive Warmth) */
  --heritage-vermilion: #ff4500;
  --heritage-alta-red: #d32f2f;
  --heritage-crimson: #c62828;
  --heritage-vermilion-glow: rgba(255, 69, 0, 0.25);
  --heritage-red-subtle: rgba(211, 47, 47, 0.16);

  /* Kashtami Bronze & Dhunuchi Ochre (Secondary Brass Accents) */
  --heritage-bronze: #d97706;
  --heritage-ochre: #b45309;
  --heritage-amber-glow: rgba(217, 119, 6, 0.22);

  /* Kash Phul & Shiuli White (Pure High-Contrast Text & Glyphs) */
  --heritage-white: #ffffff;
  --heritage-shiuli-cream: #fffdf7;
  --heritage-kash-white: #f4f6fb;

  /* Natmandir Deep Obsidian (Background & Structural Surfaces) */
  --obsidian-deep: #070a12;
  --obsidian-surface: #0d111c;
  --obsidian-card: #121826;
  --obsidian-elevated: #182032;

  /* Bel Pata & Banana Leaf Emerald (Live Indicators & Active Success) */
  --heritage-emerald: #10b981;
  --heritage-emerald-light: #34d399;
  --heritage-emerald-glow: rgba(16, 185, 129, 0.35);

  /* ==========================================================================
     2. MULTI-LAYER FROSTED GLASS TRANSPARENCY SYSTEM
     ========================================================================== */
  /* Level 1: Floating Chips, Pills, and Header Actions */
  --glass-chip-bg: rgba(13, 17, 28, 0.65);
  --glass-chip-bg-hover: rgba(22, 28, 44, 0.85);
  --glass-chip-bg-active: rgba(30, 38, 58, 0.94);
  --glass-chip-border: rgba(255, 255, 255, 0.13);
  --glass-chip-border-hover: rgba(255, 207, 64, 0.45);
  --glass-chip-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);

  /* Level 2: Floating Dock & Dynamic Island */
  --glass-dock-bg: rgba(14, 18, 28, 0.82);
  --glass-dock-border: rgba(255, 255, 255, 0.14);
  --glass-dock-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12);

  /* Level 3: Modals, Bottom Sheets & Control Drawers */
  --glass-modal-backdrop: rgba(4, 7, 14, 0.76);
  --glass-modal-bg: rgba(16, 22, 34, 0.95);
  --glass-modal-border: rgba(255, 255, 255, 0.12);
  --glass-modal-shadow: 0 32px 80px -12px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.16);

  /* ==========================================================================
     3. TYPOGRAPHY HIERARCHIES
     ========================================================================== */
  --font-display-bengali: 'Galada', cursive;
  --font-body-bengali: 'Noto Sans Bengali', 'Hind Siliguri', sans-serif;
  --font-sans-ui: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif-numbers: 'DM Serif Display', Georgia, serif;

  /* ==========================================================================
     4. RADIUS & TOUCH METRICS (APPLE HIG STANDARD)
     ========================================================================== */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 9999px;

  --touch-target-min: 44px;
  --touch-target-compact: 36px;
}
```

---

## 4. Modern Glassmorphism & Translucency Recipes

### Rule 1: Layered Backdrop Filter Blur
Never use flat gray opacity without optical blur. Always pair `backdrop-filter: blur(...)` with slight saturation boost:
```css
/* Standard Frosted Glass Recipe */
.heritage-glass-card {
  background: rgba(14, 18, 28, 0.82);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.13);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.75),
              inset 0 1px 0 rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-lg);
}
```

### Rule 2: Top-Lit Specular Rim Light
In real physical glass, light catches the top bevel. Replicate this using an inner specular highlight:
```css
/* Specular Inner Glaze */
.heritage-specular-glaze {
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
              inset 0 -1px 0 0 rgba(0, 0, 0, 0.35);
}
```

### Rule 3: Subtle Noise/Grain Lacquer Texture
To prevent digital banding on dark OLED displays, inject a non-intrusive CSS procedural micro-grain overlay (approx 2% opacity).

---

## 5. Modern Chip & Capsule Architecture

Chips and pills are the foundational interaction vehicles across the platform.

```
  ┌───────────────────────────────────────────────────────────────┐
  │                   CHIP COMPONENT ARCHITECTURE                 │
  ├───────────────────┬───────────────────────────────────────────┤
  │ Capsule Structure │ [ Icon/Dot ]  [ Primary Label ]  [ Badge ]│
  ├───────────────────┼───────────────────────────────────────────┤
  │ Standard Height   │ Desktop: 34-38px  |  Mobile Touch: 44px  │
  ├───────────────────┼───────────────────────────────────────────┤
  │ Radius            │ 9999px (Exact pill symmetry)              │
  ├───────────────────┼───────────────────────────────────────────┤
  │ Interaction       │ Hover: -1.5px translateY + Border Gold   │
  │                   │ Active: scale(0.97) + Haptic Feeling     │
  └───────────────────┴───────────────────────────────────────────┘
```

### Chip Types & CSS Classes:

1. **Brand / Heritage Chip (`.pujo-tag-pill`)**:
   - Background: `linear-gradient(135deg, rgba(211, 47, 47, 0.32), rgba(255, 69, 0, 0.22))`
   - Border: `1px solid rgba(255, 120, 80, 0.42)`
   - Badge: Heritage 150+ Years in gold micro-capsule.

2. **Live Status Chip (`.online-pill`, `.island-live-pill`)**:
   - Background: `rgba(12, 16, 26, 0.65)`
   - Indicator: Emerald beacon dot with pulsing concentric wave (`@keyframes beaconPulse`).

3. **Vibe & Atmosphere Selector Chip (`.vibe-selector-btn`)**:
   - Displays current time-of-day emoji + bilingual name + dropdown chevron.
   - Expandable dropdown menu with individual vibe pill items.

4. **Category Filter Tabs (`.tab-pill`, `.gallery-cat-btn`)**:
   - Default: `background: transparent`, `color: rgba(255,255,255,0.78)`
   - Active: `background: #ffffff`, `color: #070a12`, `font-weight: 700`, `box-shadow: 0 4px 14px rgba(0,0,0,0.35)` or `background: var(--heritage-gold)`, `color: #070a12`.

5. **Audio Engine / Booster Preset Chips (`.engine-source-btn`, `.booster-preset-btn`)**:
   - Clear radio/selection state with vibrant emerald or gold rim when active.

---

## 6. Accessibility & Contrast Standards (WCAG 2.1 AA)

1. **Color Contrast Ratio**:
   - All body text, Bengali labels, and timecodes must exceed **4.5:1** contrast ratio against their glass backgrounds.
   - Display headings and icons must exceed **3.0:1**.
   - Pure gold `#FFCF40` on obsidian `#070A12` yields a **13.2:1** contrast ratio (Well above AAA).
   - Secondary text `rgba(255, 255, 255, 0.85)` yields **11.5:1**.

2. **Bengali Typography Legibility**:
   - `Galada` is reserved *strictly* for the Hero Title ("পুজো আসছে") with appropriate text shadow.
   - All interactive controls, schedules, lyrics, and story headlines MUST use `Noto Sans Bengali` or `Hind Siliguri` with minimum font-weight 500 and font-size >= 12px (0.75rem).
   - Numbers and countdown timers use `DM Serif Display` with `font-variant-numeric: tabular-nums` to prevent layout shift during second-by-second countdown ticks.

3. **Touch Targets**:
   - All interactive buttons, tabs, pads, and dock controls must maintain a minimum bounding box of **44px × 44px** on viewports `< 768px`.
   - Clear `:focus-visible` styling with `outline: 2px solid var(--heritage-gold)` and `outline-offset: 2px`.

---

## 7. Component Audit & Specification Matrix

| Component Area | Current Implementation State | Aesthetic & Architectural Enhancements |
| :--- | :--- | :--- |
| **1. Header & Dynamic Island** | Desktop header pills (`online-pill`, `pujo-tag-pill`, `story-nav-pill`) and Mobile Dynamic Island with idle/active states. | Enhance Dynamic Island with smoother spring cubic-bezier transitions, dual-pill tactile feedback, and crisp high-contrast artwork glow. Ensure 44px touch targets. |
| **2. 4-Unit Countdown Card** | Bengali-labeled units (Days, Hours, Mins, Secs) with gold display numbers. | Ensure `font-variant-numeric: tabular-nums`, subtle gold glow backdrop, high-contrast subtitles, and tactile hover elevation. |
| **3. Soundboard Triggers & Vibe Menu** | Quick buttons for Shankha, Dhak, Shiuli flowers, and Atmosphere dropdown. | Maintain clean glass pill encapsulation with keyboard shortcut hints (`S`, `D`, `F`, `?`), clear focus states, and warm gold active highlight. |
| **4. Bottom Dock & Mobile Drawer** | Desktop glass dock with vinyl spin, scrubber, timecode + Mobile bottom 5-item thumb drawer. | Keep frosted glass dock elevated above background; ensure mobile drawer items have 48px height and instant haptic visual active scale. |
| **5. Playlists Modal** | 4-tab filter (সেরা আগমনী, মহালয়া, চণ্ডীপাঠ গান, ঢাকের বাজনা) + tracklist with live EQ bars. | Contrast-rich active pill tab state, smooth scrollbar, and clear track duration indicators. |
| **6. Dhak Drum Studio** | Dual mode (Authentic 6-part live looper vs Synth drum pads), zero-latency Pure Engine toggle. | Specular card styling for the 6 live movement cards, pulsing rhythmic bar cycle, and zero visual latency on drum pad hits. |
| **7. Sound Booster Panel** | 4 quick preset pills (Flat, Bass Heavy, Stick Snap, Festival Loud) + 3 tactile sliders. | High-contrast label rows with live numeric badges (`+6 dB`, `120%`), gold accent range sliders, and active boost pill badge. |
| **8. Story Card Generator** | 9:16 Canvas preview + 5 atmosphere theme pills + Bengali quote dropdown + 3 toggle pills. | High-fidelity live canvas rendering, crisp theme pill selection, and distinct download/share action buttons. |
| **9. Mondal Bari Heritage Showcase** | 150+ year intro banner, Instagram follow card, Puja schedule timeline, 4 heritage highlights, photo gallery with category filter pills. | Authentic Bonedi Bari cultural warmth, clean timeline hierarchy with red/gold left borders, and rich gallery card overlays. |

---

## 8. Development & Implementation Guide

When implementing or modifying UI components:
1. Always reference custom properties from `:root` (never hardcode arbitrary hex colors).
2. For all pill chips, apply `.glass-pill` or equivalent tokenized styling with `--radius-pill: 9999px`.
3. Test all text contrast against dark backgrounds in both bright sunlight and dark room conditions.
4. Ensure all Bengali font glyphs have proper line-height (minimum `1.2` to `1.4`) to prevent matra/vowel sign clipping.
