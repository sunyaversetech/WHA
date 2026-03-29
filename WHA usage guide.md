# WHA Design System - Usage Guide

## Fonts Inspiration

This design system is inspired by **Fresh.com** (the luxury beauty brand), which uses:

- **Optima** - An elegant humanist sans-serif (not available on Google Fonts)
- **Helvetica** - Classic sans-serif for body text

Our Google Fonts alternatives:

- **Marcellus** - Elegant serif for headlines and display text (similar to Optima's elegance)
- **Montserrat** - Modern geometric sans-serif for body text and UI elements (clean like Helvetica)

## Installation

1. Import the CSS file in your main `globals.css` or `app.css`:

```css
@import "./wha-standards.css";
```

2. Update your `tailwind.config.ts` to include the font families:

```typescript
fontFamily: {
  marcellus: ["var(--font-marcellus)", "serif"],
  montserrat: ["var(--font-montserrat)", "sans-serif"],
}
```

3. Add the fonts to your layout file (see the updated layout.tsx file provided).

## Quick Reference

### Typography Examples

```tsx
// Display Text (Hero Headlines) - Uses Marcellus
<h1 className="text-wha-display text-wha-primary">
  Welcome to WHA Australia
</h1>

// Headings - Marcellus for H1-H3, Montserrat for H4-H6
<h1 className="text-wha-h1 text-wha-primary">Main Heading</h1>
<h2 className="text-wha-h2 text-wha-primary">Subheading</h2>
<h3 className="text-wha-h3 text-wha-primary">Section Title</h3>
<h4 className="text-wha-h4 text-wha-muted">Subsection</h4>

// Body Text - Montserrat
<p className="text-wha-paragraph">
  This is a standard paragraph with proper line height and tracking.
</p>

// Small Text & Captions - Montserrat
<span className="text-wha-caption text-wha-muted">Photo by John Doe</span>
<small className="text-wha-small">Terms and conditions apply</small>

// Links - Montserrat
<a href="#" className="text-wha-link">Learn More</a>
```

### Button Examples

```tsx
// Primary Buttons
<button className="btn-wha-primary">Submit</button>
<button className="btn-wha-primary-lg">Get Started</button>
<button className="btn-wha-primary-sm">Save</button>

// Secondary Buttons
<button className="btn-wha-secondary">Learn More</button>

// Outline Buttons
<button className="btn-wha-outline">Cancel</button>

// Ghost Buttons
<button className="btn-wha-ghost">View Details</button>

// Icon Buttons
<button className="btn-wha-icon">
  <PlusIcon />
</button>
<button className="btn-wha-icon-primary">
  <SearchIcon />
</button>

// Disabled State
<button className="btn-wha-primary" disabled>
  Processing...
</button>
```

### Card & Container Examples

```tsx
// Standard Card
<div className="card-wha">
  <h3 className="text-wha-h3">Card Title</h3>
  <p className="text-wha-body">Card content goes here.</p>
</div>

// Large Card
<div className="card-wha-lg">
  <h2 className="text-wha-h2">Premium Feature</h2>
  <p className="text-wha-paragraph">Detailed description.</p>
</div>

// Primary Colored Card
<div className="card-wha-primary">
  <h3 className="text-wha-h3">Special Offer</h3>
  <p className="text-wha-body">Limited time only!</p>
</div>

// Gradient Card
<div className="card-wha-gradient">
  <h3 className="text-wha-h3">Featured Content</h3>
</div>

// Containers
<div className="container-wha">
  {/* Standard max-width container */}
</div>

<div className="container-wha-sm">
  {/* Narrow container for reading content */}
</div>

<div className="container-wha-lg">
  {/* Wide container for dashboards */}
</div>
```

### Form Input Examples

```tsx
// Input Fields
<div>
  <label className="label-wha">Email Address</label>
  <input type="email" className="input-wha" placeholder="you@example.com" />
</div>

// Small Input
<input type="text" className="input-wha-sm" placeholder="Search..." />

// Large Input
<input type="text" className="input-wha-lg" placeholder="Enter title..." />

// Textarea
<textarea className="textarea-wha" rows={4} placeholder="Your message..."></textarea>

// Select Dropdown
<select className="select-wha">
  <option>Select option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Checkbox
<label className="flex items-center gap-2">
  <input type="checkbox" className="checkbox-wha" />
  <span className="text-wha-body-sm">I agree to terms</span>
</label>

// Radio Button
<label className="flex items-center gap-2">
  <input type="radio" name="choice" className="radio-wha" />
  <span className="text-wha-body-sm">Option A</span>
</label>
```

### Spacing Examples

```tsx
// Padding
<div className="p-wha-md">Medium padding</div>
<div className="px-wha-lg py-wha-sm">Large horizontal, small vertical</div>

// Margin
<div className="my-wha-xl">Extra large vertical margin</div>
<div className="mx-wha-md">Medium horizontal margin</div>

// Gap (for flex/grid)
<div className="flex gap-wha-md">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Layout Examples

```tsx
// Sections
<section className="section-wha bg-wha-light">
  <div className="container-wha">
    <h2 className="text-wha-h1">Our Services</h2>
  </div>
</section>

// Grid Layouts
<div className="grid-wha-2">
  <div className="card-wha">Column 1</div>
  <div className="card-wha">Column 2</div>
</div>

<div className="grid-wha-3">
  <div className="card-wha">Column 1</div>
  <div className="card-wha">Column 2</div>
  <div className="card-wha">Column 3</div>
</div>

// Flex Layouts
<div className="flex-wha-between">
  <h3>Title</h3>
  <button className="btn-wha-primary-sm">Action</button>
</div>

<div className="flex-wha-center">
  <div>Centered Content</div>
</div>
```

### Badge & Tag Examples

```tsx
<span className="badge-wha-primary">New</span>
<span className="badge-wha-secondary">Featured</span>
<span className="badge-wha-outline">Beta</span>
<span className="badge-wha-light">Popular</span>
```

### Table Examples

```tsx
<table className="table-wha">
  <thead className="table-wha-header">
    <tr>
      <th className="table-wha-th">Name</th>
      <th className="table-wha-th">Email</th>
      <th className="table-wha-th">Role</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-wha-row">
      <td className="table-wha-td">John Doe</td>
      <td className="table-wha-td">john@example.com</td>
      <td className="table-wha-td">Admin</td>
    </tr>
  </tbody>
</table>
```

### Alert Examples

```tsx
<div className="alert-wha-info">
  <p className="text-wha-body-sm text-blue-900">
    Your account has been updated successfully.
  </p>
</div>

<div className="alert-wha-success">
  <p className="text-wha-body-sm text-green-900">
    Payment completed!
  </p>
</div>

<div className="alert-wha-warning">
  <p className="text-wha-body-sm text-yellow-900">
    Please verify your email address.
  </p>
</div>

<div className="alert-wha-error">
  <p className="text-wha-body-sm text-red-900">
    An error occurred. Please try again.
  </p>
</div>
```

### Loading & Spinner Examples

```tsx
// Spinner
<div className="flex-wha-center">
  <div className="spinner-wha"></div>
</div>

// Loading Dots (like your LoadingPage component)
<div className="loading-dots-wha">
  <div className="loading-dot-wha [animation-delay:-0.3s]"></div>
  <div className="loading-dot-wha [animation-delay:-0.15s]"></div>
  <div className="loading-dot-wha"></div>
</div>
```

### Background & Color Examples

```tsx
// Backgrounds
<div className="bg-wha-primary text-white p-wha-lg">
  Primary background
</div>

<div className="bg-wha-gradient-primary text-white p-wha-lg">
  Gradient background
</div>

<div className="bg-wha-light p-wha-lg">
  Light background
</div>

// Text Colors
<p className="text-wha-primary">Primary text color</p>
<p className="text-wha-secondary">Secondary text color</p>
<p className="text-wha-muted">Muted text color</p>
```

### Responsive Visibility Examples

```tsx
// Show only on mobile
<div className="show-wha-mobile">
  Mobile menu
</div>

// Hide on mobile
<div className="hide-wha-mobile">
  Desktop navigation
</div>

// Show only on desktop
<div className="show-wha-desktop">
  Advanced features
</div>
```

## Complete Component Example

```tsx
import React from "react";

const ExampleComponent = () => {
  return (
    <section className="section-wha bg-wha-gradient-light">
      <div className="container-wha">
        {/* Hero Section */}
        <div className="flex-wha-col gap-wha-lg text-center">
          <span className="badge-wha-secondary">Featured</span>
          <h1 className="text-wha-display text-wha-primary">
            Transform Your Business
          </h1>
          <p className="text-wha-paragraph text-wha-muted max-w-2xl mx-auto">
            Discover innovative solutions designed to help your business grow
            and succeed in the digital age.
          </p>
          <div className="flex gap-wha-md justify-center flex-wrap">
            <button className="btn-wha-primary-lg">Get Started</button>
            <button className="btn-wha-outline-lg">Learn More</button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid-wha-3 my-wha-2xl">
          <div className="card-wha hover-wha-lift">
            <h3 className="text-wha-h3 text-wha-primary mb-wha-sm">
              Fast & Reliable
            </h3>
            <p className="text-wha-body-sm text-wha-muted">
              Lightning-fast performance with 99.9% uptime guarantee.
            </p>
          </div>
          <div className="card-wha hover-wha-lift">
            <h3 className="text-wha-h3 text-wha-primary mb-wha-sm">
              Secure by Design
            </h3>
            <p className="text-wha-body-sm text-wha-muted">
              Enterprise-grade security protecting your data 24/7.
            </p>
          </div>
          <div className="card-wha hover-wha-lift">
            <h3 className="text-wha-h3 text-wha-primary mb-wha-sm">
              Expert Support
            </h3>
            <p className="text-wha-body-sm text-wha-muted">
              Dedicated team ready to help you succeed.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card-wha-lg max-w-2xl mx-auto">
          <h2 className="text-wha-h2 text-wha-primary mb-wha-md">
            Get in Touch
          </h2>
          <form className="flex-wha-col gap-wha-md">
            <div>
              <label className="label-wha">Full Name</label>
              <input type="text" className="input-wha" placeholder="John Doe" />
            </div>
            <div>
              <label className="label-wha">Email Address</label>
              <input
                type="email"
                className="input-wha"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="label-wha">Message</label>
              <textarea
                className="textarea-wha"
                rows={4}
                placeholder="Tell us about your project..."></textarea>
            </div>
            <button type="submit" className="btn-wha-primary">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ExampleComponent;
```

## Updating Your LoadingPage Component

Here's your LoadingPage component using the new standards and fonts:

```tsx
import React from "react";
import Image from "next/image";

const LoadingPage = () => {
  return (
    <div className="overlay-wha-dark flex-wha-center flex-wha-col">
      <div className="flex-wha-col gap-wha-lg items-center">
        <div className="relative w-32 h-32 md:w-40 md:h-40 animate-pulse">
          <Image
            src="/wha/logo2.png"
            alt="Company Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="flex-wha-col gap-wha-sm items-center">
          <div className="loading-dots-wha">
            <div className="loading-dot-wha [animation-delay:-0.3s]"></div>
            <div className="loading-dot-wha [animation-delay:-0.15s]"></div>
            <div className="loading-dot-wha"></div>
          </div>
          <p className="text-wha-label-sm text-white opacity-80">
            Loading Your Content
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 text-wha-caption-sm text-white/70">
        &copy; {new Date().getFullYear()} WHA
      </div>
    </div>
  );
};

export default LoadingPage;
```

## Color Palette Reference

- **Primary**: `#051e3a` - Main brand color (dark navy)
- **Secondary**: `#3771db` - Accent color (bright blue)
- **Accent**: `#2a59b2` - Mid-tone blue
- **Light**: `#f8fafc` - Light background
- **Dark**: `#020c1a` - Darker navy

## Font Usage Guide

### When to use Marcellus (Elegant Serif):

- Hero headlines and display text
- Main page headings (H1, H2, H3)
- Brand messaging
- Feature titles
- Anything that needs an elegant, luxurious feel

### When to use Montserrat (Modern Sans-Serif):

- Body text and paragraphs
- Sub-headings (H4, H5, H6)
- Buttons and CTAs
- Form inputs and labels
- Navigation menus
- Data tables
- Captions and small text

## Best Practices

1. **Consistency**: Always use WHA classes for consistent spacing, typography, and colors
2. **Responsive**: Classes automatically adjust for mobile, tablet, and desktop
3. **Accessibility**: Maintain proper contrast ratios and focus states
4. **Performance**: Classes are optimized with Tailwind's JIT compiler
5. **Maintenance**: Update the standards file instead of scattered custom CSS
6. **Font Pairing**: Marcellus for impact, Montserrat for readability

## Tips

- Combine classes for complex designs: `btn-wha-primary shadow-wha-lg hover-wha-scale`
- Use semantic class names for better code readability
- Leverage Tailwind's modifiers with WHA classes: `lg:btn-wha-primary-lg`
- Keep custom CSS minimal - use WHA standards first
- Use Marcellus sparingly for maximum impact (headlines only)
- Use Montserrat for all UI elements and body content
