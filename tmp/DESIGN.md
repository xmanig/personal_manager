---
name: Obsidian Prime
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-padding: 2rem
  stack-gap: 1.5rem
  table-cell-padding: 1rem 1.5rem
  grid-gutter: 1.5rem
  section-margin: 3rem
---

## Brand & Style

This design system is engineered for high-end financial management, prioritizing clarity, precision, and a sense of institutional security. The aesthetic follows a **Corporate Modern** approach with a refined dark-mode execution. It leverages "Obsidian" depths to reduce eye strain during long analytical sessions while using vibrant, high-chroma accents to guide the user's attention to critical status changes.

The emotional response should be one of "effortless control." By utilizing generous whitespace and a strict mathematical grid, the UI transforms dense transactional data into an elegant, readable dashboard. The style avoids unnecessary decoration, focusing instead on subtle borders and tonal shifts to define hierarchy.

## Colors

The palette is built on a foundation of deep, layered neutrals. The base layer uses a true **Obsidian (#020617)**, with secondary containers utilizing **Slate (#0F172A)** to create depth without relying on heavy shadows. 

Functional colors are critical for this financial context:
- **Emerald (#10B981):** Represents positive cash flow, paid status, and success.
- **Amber (#F59E0B):** Signals pending actions or warnings.
- **Rose (#EF4444):** Indicates overdue payments or critical errors.
- **Primary Blue (#3B82F6):** Reserved for primary actions and interactive elements.

Text contrast is strictly maintained with off-whites and cool grays to ensure high legibility against the dark background.

## Typography

The design system utilizes **Hanken Grotesk** for its clean, geometric, yet professional character, making it ideal for modern SaaS interfaces. For data-heavy tables and financial figures, **JetBrains Mono** is introduced as a secondary font. The monospaced nature of JetBrains Mono ensures that columns of numbers align perfectly, aiding in quick vertical scanning of transactions.

Large headlines use a tight negative letter spacing to feel "premium" and impactful, while body text maintains standard tracking for optimal readability. Labels and status chips use all-caps monospaced type to distinguish them clearly from interactive text.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a 12-column system. To maintain a premium feel, "Obsidian Prime" utilizes expansive margins and internal padding, preventing the data from feeling claustrophobic.

- **Desktop:** 12 columns with 24px gutters and 40px outer margins. Sidebar is fixed at 280px.
- **Tablet:** 8 columns with 16px gutters and 24px margins. Sidebar collapses to an icon-only rail.
- **Mobile:** 4 columns with 12px gutters and 16px margins. Tables reflow into card-based layouts.

Spacing is based on a 4px baseline, with most components using multiples of 8px (8, 16, 24, 32) to ensure a rhythmic vertical flow.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Outlines** rather than aggressive shadows.

1.  **Level 0 (Background):** Pure Obsidian (#020617).
2.  **Level 1 (Cards/Sidebar):** Slate (#0F172A) with a 1px border of #1E293B.
3.  **Level 2 (Modals/Dropdowns):** Elevated Slate with a soft, 20% opacity black shadow (0px 10px 30px) and a slightly brighter border (#334155).

This approach creates a "flat-but-layered" look that feels tactile and modern. Interactive elements like buttons use a subtle inner glow or "sheen" to indicate they sit above the surface.

## Shapes

The shape language is disciplined and "Soft" (**0.25rem - 0.75rem**). 

- **Standard Components:** 4px (0.25rem) for input fields, buttons, and small chips.
- **Containers:** 8px (0.5rem) for dashboard cards and primary modules.
- **Large Modals:** 12px (0.75rem) to differentiate global overlays from background content.

This low-radius approach maintains a serious, professional "FinTech" aesthetic while avoiding the harshness of sharp 90-degree corners.

## Components

### Buttons
- **Primary:** Solid Blue (#3B82F6) with white text. 4px radius. 
- **Secondary:** Transparent with a 1px border of #1E293B. Hover state shifts background to #1E293B.
- **Status Buttons:** Use the functional colors (Emerald/Rose) with a 10% opacity background and 100% opacity text for a "ghost" effect.

### Data Tables
Tables are the heart of the system. Use a 1px horizontal-only border (#1E293B) to separate rows. Header rows use a muted gray text in JetBrains Mono. Alternate row striping is not used; instead, use a subtle highlight on hover.

### Chips & Tags
Used for categories (e.g., "Utilities", "Subscription"). These are small, with a 2px radius and use the Slate-light background. They should not compete with the primary Status Indicators (Paid/Pending).

### Input Fields
Dark backgrounds (#020617) with a 1px border. On focus, the border transitions to the primary Blue with a subtle 2px outer glow.