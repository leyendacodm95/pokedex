---
name: Aether Dex
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#ebbbb4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#b18780'
  outline-variant: '#603e39'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690100'
  primary-container: '#ff5540'
  on-primary-container: '#5c0000'
  inverse-primary: '#c00100'
  secondary: '#ffffff'
  on-secondary: '#003737'
  secondary-container: '#00fbfb'
  on-secondary-container: '#007070'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#929090'
  on-tertiary-container: '#2a2a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930100'
  secondary-fixed: '#00fbfb'
  secondary-fixed-dim: '#00dddd'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f4f'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  data-num:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-mobile: 20px
  gutter-md: 16px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style

The design system is engineered for the "Smart Pokédex" experience—a high-tech, portable research tool that feels like a piece of advanced hardware found in a near-future laboratory. The target audience is modern trainers who value efficiency, data density, and a premium aesthetic.

The visual style is **Glassmorphism**, leaning heavily into translucent layers, vibrant background blurs, and "holographic" overlays. The UI should feel like light projected onto glass. By utilizing a deep dark background, we create a high-contrast environment where accent colors and Pokémon renders appear to glow, simulating an emissive display. 

The emotional response should be one of discovery and technical sophistication; it is not just an encyclopedia, but a piece of tactical equipment.

## Colors

The palette is anchored by a deep **Neutral (#121212)** base to ensure maximum contrast for the glass effects. 

- **Primary (Pokédex Red):** Reserved for high-action triggers, critical alerts, and the iconic "record" or "capture" functionality.
- **Secondary (Glowing Cyan):** Used for "scanning" states, holographic focus frames, data progress bars, and active selection indicators.
- **Tertiary Surface:** A slightly lighter charcoal used for card backgrounds that sit beneath the glass layers to provide structural depth.
- **Glass Effects:** Surfaces use a white tint at 8% opacity with a 20px-32px backdrop blur. Borders are ultra-thin (1px) with 12% opacity to simulate the edge of a glass pane.

## Typography

This design system utilizes **Inter** for its exceptional readability in data-heavy environments. To lean into the "tech" aspect, **Space Grotesk** is introduced for labels and numerical data, providing a subtle geometric, futuristic flair.

- **Headlines:** Use Bold weights with tight letter spacing to feel impactful and modern.
- **Body:** Standardized at 14px and 16px to ensure legibility against blurred backgrounds.
- **Labels:** Small, uppercase, and tracked out to denote metadata, categories, or technical specs (e.g., Weight, Height, Type).
- **Numbers:** Numerical stats (HP, Attack, etc.) should use the secondary font to distinguish them from descriptive text.

## Layout & Spacing

The layout follows a **fluid grid** optimized for one-handed mobile use. Content is primarily organized in a vertical stack of glass cards.

- **Margins:** A generous 20px side margin ensures content does not feel cramped against the device edges.
- **Rhythm:** A 4px baseline grid governs all spacing. Use 16px (4 units) for most component internal padding and 24px (6 units) for vertical spacing between distinct sections.
- **Safe Areas:** Elements like the floating "Scan" button should respect a 32px bottom offset to account for modern mobile gesture bars.

## Elevation & Depth

Depth is achieved through **optical transparency** rather than traditional shadows. 

- **Level 0 (Background):** Solid #121212.
- **Level 1 (Secondary Surfaces):** Solid #1E1E1E with no blur, used for grouped background items.
- **Level 2 (Glass Panels):** 8% White fill, 20px backdrop blur, 1px internal border. This is the primary container for Pokémon data.
- **Level 3 (Modals/Overlays):** 12% White fill, 40px backdrop blur. These should appear to sit "closer" to the user, with a subtle 0px 10px 30px rgba(0,0,0,0.5) shadow to separate the blur from the layer below.
- **Holographic Glow:** Active elements (like the Scanning frame) use an outer glow (0px 0px 15px) utilizing the Secondary Cyan color at 50% opacity.

## Shapes

The design system employs a **Rounded** shape language to balance the technical "coldness" of the dark theme with an approachable, handheld feel.

- **Containers:** Standard cards use a 16px (`rounded-lg`) radius. 
- **Interactive Elements:** Buttons and Input fields use a 12px radius. 
- **Type Badges:** Use a fully pill-shaped (999px) radius to distinguish them from structural UI elements.
- **Inner Elements:** Nested items should have a radius 4px smaller than their parent to maintain concentric visual harmony.

## Components

### Buttons
- **Primary:** Solid Red (#FF0000) with white text. High-gloss finish (subtle top-down linear gradient).
- **Secondary/Ghost:** Transparent background with a Cyan border and Cyan text. Used for secondary actions like "Compare" or "Sort."

### Search Bar
- **Style:** A glassmorphic capsule with a persistent magnifying glass icon in Cyan. The placeholder text should be low-contrast white. On focus, the border transitions from 12% white to 100% Cyan.

### Type Badges
- **Style:** High-contrast, vibrant backgrounds specific to the Pokémon element (e.g., Electric = Yellow, Fire = Orange). Text is always black or white based on contrast requirements, utilizing the `label-caps` typography style.

### Data Cards
- **Style:** Glassmorphic containers. Headers within cards should use the Cyan accent for icons. Data visualizations (stat bars) should use a "holographic" look: a semi-transparent track with a glowing Cyan fill.

### The "Scanner" Frame
- **Style:** A component unique to this system. A large, thin-stroked Cyan square with bracketed corners that pulses slightly. It appears when the camera/AR mode is active to guide user focus.

### Navigation
- **Style:** A floating glass dock at the bottom of the screen with blurred icons. Active states are indicated by a small Cyan dot beneath the icon.