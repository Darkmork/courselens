# ClassSphere Light Design - Visual Redesign Specification

> **Date:** 2026-06-01
> **Status:** Draft for approval

## Overview

Redesign ClassSphere from dark theme to a clean, professional light theme inspired by Wero Wallet. The redesign focuses on modernizing the visual appearance and improving user experience through better navigation and consistency.

## Design Philosophy

- **Clarity first:** Clean layouts, ample white space, clear hierarchy
- **Professional tone:** Trustworthy blue (#0066CC) with energetic orange accent (#FF6B35)
- **User-friendly:** Easy navigation, consistent patterns, accessible colors
- **Education-focused:** Warm but professional, suitable for daily teacher use

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | `#0066CC` | CTAs, active states, links, sidebar highlight |
| Primary Dark | `#004C99` | Button hover states |
| Accent Orange | `#FF6B35` | Important actions, notifications, highlights |
| Accent Dark | `#E55A2B` | Orange hover states |

### Background Colors

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` | Main page background |
| Background Secondary | `#F5F5F5` | Cards, sections, alternating areas |
| Background Tertiary | `#FAFAFA` | Subtle elevation |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#1A1A1A` | Headings, important text |
| Text Secondary | `#666666` | Body text, descriptions |
| Text Tertiary | `#999999` | Captions, hints, timestamps |
| Text Inverse | `#FFFFFF` | On dark backgrounds |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Positive states, confirmations |
| Warning | `#F59E0B` | Caution, attention needed |
| Error | `#EF4444` | Errors, destructive actions |
| Info | `#3B82F6` | Information, neutral alerts |

### Border & Shadow

| Name | Value | Usage |
|------|-------|-------|
| Border Default | `#E5E5E5` | Card borders, dividers |
| Border Hover | `#D5D5D5` | Interactive element hover |
| Shadow Small | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| Shadow Medium | `0 4px 6px rgba(0,0,0,0.07)` | Cards, dropdowns |
| Shadow Large | `0 10px 15px rgba(0,0,0,0.1)` | Modals, overlays |

---

## Typography

### Font Families

```css
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif
--font-mono: 'JetBrains Mono', ui-monospace, monospace
```

### Font Sizes

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| Display | 2.5rem (40px) | 1.2 | Hero headings |
| H1 | 2rem (32px) | 1.2 | Page titles |
| H2 | 1.5rem (24px) | 1.3 | Section headings |
| H3 | 1.25rem (20px) | 1.4 | Card titles |
| Body | 1rem (16px) | 1.5 | Regular text |
| Small | 0.875rem (14px) | 1.5 | Secondary text |
| Caption | 0.75rem (12px) | 1.4 | Labels, timestamps |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400 | Body text |
| Medium | 500 | Labels, emphasis |
| Semibold | 600 | Headings, buttons |
| Bold | 700 | Display text |

---

## Layout Structure

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar]              │ [Main Content Area]                  │
│                       │                                     │
│ Logo + Name           │ ┌─────────────────────────────────┐ │
│                       │ │ Page Header                     │ │
│ Navigation Items       │ │ Title + Actions                 │ │
│ - Dashboard           │ └─────────────────────────────────┘ │
│ - Students            │                                     │
│ - Sociogram          │ ┌─────────────────────────────────┐ │
│ - Conflicts          │ │ Content Section                 │ │
│ - CourseLife         │ │ (cards, tables, forms)          │ │
│ - Projects           │ │                                 │ │
│ - Spiritual          │ │                                 │ │
│                       │ └─────────────────────────────────┘ │
│                       │                                     │
│ [User Profile]        │                                     │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar (Width: 280px)

- Fixed position, full height
- Background: white with right border (#E5E5E5)
- Logo: "ClassSphere" in Inter Bold, color primary blue
- Navigation items: icon + label, vertical stack
- Active state: 4px left border in primary blue, background blue-50
- Hover state: background #F5F5F5
- User section at bottom: avatar, name, role badge

### Main Content

- Maximum width: 1280px centered
- Padding: 32px (desktop), 24px (tablet), 16px (mobile)
- Background: white with subtle texture

---

## Components

### Buttons

#### Primary Button
```css
background: #0066CC
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600

hover: background #004C99
active: scale 0.98
disabled: opacity 0.5, cursor not-allowed
```

#### Secondary Button
```css
background: white
color: #0066CC
border: 2px solid #0066CC
padding: 12px 24px
border-radius: 8px
font-weight: 600

hover: background #F0F7FF
```

#### Accent Button (Orange)
```css
background: #FF6B35
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600

hover: background #E55A2B
```

### Cards

#### Standard Card
```css
background: white
border: 1px solid #E5E5E5
border-radius: 12px
padding: 24px
box-shadow: 0 4px 6px rgba(0,0,0,0.07)

hover: border-color #D5D5D5
```

#### Elevated Card
```css
background: white
border: none
border-radius: 12px
padding: 24px
box-shadow: 0 10px 15px rgba(0,0,0,0.1)

hover: transform translateY(-2px)
```

### Form Elements

#### Text Input
```css
border: 1px solid #E5E5E5
border-radius: 8px
padding: 12px 16px
font-size: 16px
background: white

focus: border-color #0066CC, box-shadow 0 0 0 3px rgba(0,102,204,0.1)
error: border-color #EF4444
disabled: background #F5F5F5, cursor not-allowed
```

#### Select
```css
Same as text input
Chevron icon on right
Dropdown: white bg, border, shadow, max-height with scroll
```

### Navigation

#### Nav Item (Sidebar)
```css
Default: padding 12px 16px, color #666666
Hover: background #F5F5F5, color #1A1A1A
Active: background #F0F7FF, color #0066CC, 4px left border blue
Icon: 20px, margin-right 12px
```

### Badges & Tags

#### Status Badge
```css
background: #0066CC15 (10% opacity)
color: #0066CC
padding: 4px 12px
border-radius: 100px
font-size: 14px
font-weight: 500
```

#### Label Tag
```css
background: #F5F5F5
color: #666666
padding: 4px 8px
border-radius: 4px
font-size: 12px
font-weight: 500
text-transform: uppercase
letter-spacing: 0.05em
```

### Alerts

```css
border-radius: 8px
padding: 16px
border-left: 4px solid [color]
background: [color]_50 (very light)

Success: border #10B981, bg #F0FDF4
Warning: border #F59E0B, bg #FFFBEB
Error: border #EF4444, bg #FEF2F2
Info: border #3B82F6, bg #EFF6FF
```

---

## Page-Specific Styles

### Login Page

- Centered card (max-width 420px)
- Card shadow: large
- Logo: 80px, centered
- Title: "ClassSphere" in blue, Inter Bold
- Tagline: gray, centered below title
- Button: Primary blue with Google icon
- Background: subtle gradient (blue to white)

### Dashboard

- Header: "Buenos días, Profe" in H1
- Stats grid: 4 columns (responsive to 2 on tablet, 1 on mobile)
- Scorecards: Elevated cards with colored icon circles
- Chart section: Card with donut chart
- Alerts section: Cards with colored left borders
- CourseLife section: 3 cards in row with gradient backgrounds

### CourseLife / StudentLife

- Tab navigation: Underline style, blue active indicator
- Progress indicator: Horizontal stepper with icons
- Timeline: Vertical with connected dots
- Narrative sections: Card with subtle blue left border

### Student List (Sociogram)

- Table: Clean header, alternating row colors
- Sortable columns: Icon indicator
- Row hover: Light blue background
- Actions: Icon buttons on right

---

## Responsive Breakpoints

| Name | Width | Layout Changes |
|------|-------|----------------|
| Mobile | < 640px | Single column, hamburger menu |
| Tablet | 640-1024px | Collapsed sidebar, 2-column grids |
| Desktop | > 1024px | Full sidebar, 4-column grids |

### Mobile Navigation

- Hamburger icon in top-left
- Full-screen overlay drawer
- Sidebar slides in from left
- Close button or tap outside to dismiss

---

## Animation & Interaction

### Transitions

```css
--transition-fast: 150ms ease
--transition-normal: 250ms ease
--transition-slow: 350ms ease
```

### Button Hover
```css
transform: translateY(-1px)
box-shadow: 0 4px 8px rgba(0,0,0,0.1)
```

### Card Hover
```css
transform: translateY(-2px)
box-shadow: 0 8px 16px rgba(0,0,0,0.1)
```

### Page Transitions
```css
fade-in: opacity 0→1, 200ms
slide-up: translateY(10px)→0, 200ms
```

---

## Icon System

Use Lucide React icons throughout:
- Consistent 20px size in navigation
- 24px size in cards and sections
- Stroke width: 1.5 (outline style)

---

## Shadows & Elevation

| Level | CSS | Usage |
|-------|-----|-------|
| 0 | none | Flat elements |
| 1 | 0 1px 2px rgba(0,0,0,0.05) | Cards at rest |
| 2 | 0 4px 6px rgba(0,0,0,0.07) | Cards hover, dropdowns |
| 3 | 0 10px 15px rgba(0,0,0,0.1) | Modals, overlays |
| 4 | 0 20px 25px rgba(0,0,0,0.15) | Dialogs |

---

## Implementation Notes

### CSS Architecture

1. Define CSS variables in `:root`
2. Use Tailwind for utilities
3. Custom classes for components

### Color Application

```css
/* Primary Blue */
.bg-primary { background: #0066CC; }
.text-primary { color: #0066CC; }
.border-primary { border-color: #0066CC; }
.hover\:bg-primary:hover { background: #004C99; }

/* Accent Orange */
.bg-accent { background: #FF6B35; }
.text-accent { color: #FF6B35; }
.hover\:bg-accent:hover { background: #E55A2B; }
```

### Dark Mode (Future)

Not in scope for this redesign, but design should be compatible:
- Use semantic color names
- Avoid hardcoded dark colors in components
- Light theme only for now

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | CSS variables, theme, typography |
| `src/components/Layout.tsx` | Sidebar styling, navigation |
| `src/components/Login.tsx` | Card style, button, background |
| `src/pages/Dashboard.tsx` | Cards, grids, metrics styling |
| `src/pages/Students.tsx` | Table, modals, list styling |
| `src/pages/Sociogram.tsx` | Table, cards |
| `src/pages/CourseLife.tsx` | Tabs, narrative sections |
| `src/pages/StudentLife.tsx` | Timeline, journey styling |
| Other pages | Consistent application |

---

## Success Criteria

- [ ] All pages have consistent light theme
- [ ] Navigation is clear and intuitive
- [ ] Color palette is consistently applied
- [ ] Typography hierarchy is clear
- [ ] Components are consistent across pages
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] No dark elements remain (except where intentional)
- [ ] TypeScript compiles without errors
- [ ] All functionality works correctly