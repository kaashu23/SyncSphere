---
name: SyncSphere
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#474554'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#787585'
  outline-variant: '#c8c4d6'
  surface-tint: '#594aca'
  primary: '#5647c8'
  on-primary: '#ffffff'
  primary-container: '#6f62e2'
  on-primary-container: '#fffbff'
  inverse-primary: '#c6bfff'
  secondary: '#4b5a9c'
  on-secondary: '#ffffff'
  secondary-container: '#a6b5fd'
  on-secondary-container: '#354585'
  tertiary: '#585c66'
  on-tertiary: '#ffffff'
  tertiary-container: '#71747f'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6bfff'
  on-primary-fixed: '#160066'
  on-primary-fixed-variant: '#402eb1'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001354'
  on-secondary-fixed-variant: '#334282'
  tertiary-fixed: '#e0e2ef'
  tertiary-fixed-dim: '#c3c6d2'
  on-tertiary-fixed: '#181b24'
  on-tertiary-fixed-variant: '#434751'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is centered on a philosophy of "Digital Serenity." It targets professional teams and high-focus communities who require a real-time communication tool that reduces cognitive load rather than adding to it. 

The aesthetic is a refined **Minimalism** blended with **Modern Corporate** sensibilities. It prioritizes clarity, generous whitespace, and a high-end editorial feel. The interface should feel "airy"—as if the conversations have room to breathe—evoking an emotional response of calm, focus, and reliability.

## Colors
The palette is intentionally restrained to maintain a focused atmosphere. 

- **Primary**: A gentle Indigo/Lavender (#7C6FF0) used for action states, active navigation, and primary brand touchpoints.
- **Surface**: The foundation is a soft off-white (#FAFAFA) to reduce the harsh glare of pure white while maintaining a clean look.
- **Secondary/Accent**: Muted washes of the primary hue (#F0F2FF) are used for message bubbles or hover states.
- **Dividers**: Extremely subtle 1px lines (#E5E7EB) provide structure without creating visual "noise."

## Typography
This design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic, utilitarian nature. 

- **Scale**: The hierarchy is tight. We avoid massive size jumps to maintain the "calm" atmosphere.
- **Line Height**: Generous leading (1.6 for body) is critical to the "airy" feel, ensuring long chat threads remain readable.
- **Contrast**: Use font weight (Semi-Bold vs. Regular) and color (Main vs. Muted) rather than just size to distinguish information hierarchy.

## Layout & Spacing
The layout follows a **Fluid Grid** approach with strict horizontal constraints for chat containers to prevent line lengths from becoming too long.

- **Rhythm**: A 4px baseline grid governs all spacing. 
- **Chat Container**: On desktop, the sidebars (workspace and channel list) are fixed width (72px and 260px respectively), while the chat window is fluid with a maximum content width of 900px to maintain readability.
- **Margins**: Mobile uses a 16px safe area, while desktop expands to 32px or more to increase the sense of openness.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and extremely **Ambient Shadows**.

- **Z-Index Strategy**: The background is #FAFAFA. Secondary surfaces (like sidebars) use the same color but are separated by 1px dividers. Only floating elements like Modals or Popovers receive shadows.
- **Shadow Profile**: Shadows are diffused and low-opacity. Use a multi-layered "soft" shadow: `0 4px 20px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.02)`.
- **Active State**: Selected items do not lift; they change background color to a soft Indigo wash (#F0F2FF).

## Shapes
The shape language is soft and approachable but structured.

- **Containers**: Cards, input fields, and message bubbles use a 14px–16px radius (`rounded-lg` or `rounded-xl` per the system tokens).
- **Avatars**: Always strictly circular to provide a soft organic contrast to the geometric layout.
- **Badges**: Pill-shaped (fully rounded) for status indicators and unread counts.

## Components
- **Buttons**: Primary buttons are solid Indigo (#7C6FF0) with white text. Secondary buttons use a transparent background with a thin gray border or a light indigo tint.
- **Input Fields**: Ghost-style with a subtle 1px border (#E5E7EB) and 12px horizontal padding. On focus, the border transitions to the Primary Indigo.
- **Message Bubbles**: 
    - *Incoming*: Off-white or subtle gray with a 1px border.
    - *Outgoing*: Soft wash of Lavender (#F0F2FF).
- **Avatars**: Circular, with a 2px "Safe Border" matching the background color when overlapping.
- **Icons**: 24px thin-stroke (1.5px) outline icons. Avoid solid fills unless used for an "active" navigation state.
- **Chips/Badges**: Small, pill-shaped, using `label-caps` typography for high-density information like "Admin" or "Channel Tags."