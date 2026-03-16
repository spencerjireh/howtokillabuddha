# Blog Specification

## Overview

A content-first personal and technical blog. Each post is a bespoke, hand-designed page where the art IS the page -- the MDX content is injected into the design, not the other way around. Think digital magazine or art zine, not a templated blog.

Separate from the portfolio at spencerjireh.com. Mixed audience (developers and non-technical readers).

## Design Principles

1. **Content is king.** Every decision serves readability and content delivery. Art augments the reading experience; it never competes with it.
2. **No JS unless earned.** Pages without interactive elements ship zero JavaScript. Interactive islands hydrate independently.
3. **Every post is a canvas.** No default template. Each post is a custom-designed page. The effort is the point.
4. **Progressive enhancement.** Content is fully readable with JS disabled, on slow connections, on low-end devices.
5. **Minimal, brutalist.** Typography-driven. Monospace-heavy. Clean. Let the design and content speak.

## Architecture

### Framework: Astro

- Zero JS by default -- static HTML/CSS output
- Islands architecture -- each interactive component hydrates independently, can use any UI framework (React, Svelte, Vue, Solid, vanilla JS, Web Components)
- Content Collections -- Zod-validated frontmatter, type-safe queries
- Built on Vite
- Static output deployed to Cloudflare Pages

### Framework-Agnostic Islands

Each post can use any framework for its interactive components. Start with `@astrojs/react` installed, add other framework integrations (`@astrojs/svelte`, `@astrojs/vue`, `@astrojs/solid-js`, `@astrojs/lit`) as individual posts require them. Vanilla JS and Web Components need no integration.

### Two-File Post System

Each post consists of two files:

1. **Content file** (`src/content/blog/[slug].mdx`) -- the writing. Contains frontmatter metadata and MDX content. Managed by Astro Content Collections with Zod schema validation.

2. **Page file** (`src/pages/blog/[slug].astro`) -- the design. A custom `.astro` page that imports the MDX content and places it within the bespoke layout/art design.

```
src/content/blog/on-shader-compilation.mdx   <-- content + metadata
src/pages/blog/on-shader-compilation.astro    <-- custom page design
```

The page file imports the content:
```astro
---
import { getEntry } from 'astro:content';
const post = await getEntry('blog', 'on-shader-compilation');
const { Content } = await post.render();
---
<!-- custom art/layout here -->
<Content />
```

### Content Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    category: z.enum(['technical', 'personal']),  // fixed categories
    tags: z.array(z.string()).default([]),          // freeform tags
    theme: z.enum(['dark', 'light']),               // art dictates this
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),                 // Open Graph image path
  }),
});
```

## Art System

### Core Concept

Art is NOT a background layer behind content. Art is the page itself. Each post's `.astro` file is a bespoke design that incorporates:
- Three.js scenes
- HTML5 canvas renderers
- WASM modules
- GLSL shaders
- Static image/video assets (PNG, SVG, WebM)
- CSS art
- Any combination of the above

The content (MDX) is injected into designated content regions within the art page.

### Art Placement

Art placement varies per post. Possible regions include:
- Hero / banner area at the top
- Between content sections
- Margins, edges, gutters of the viewport
- Header / footer areas
- Dedicated full-width or partial-width slots

Art must NEVER overlap with or obscure readable text. Art and content coexist in separate regions.

### Art + Theme Interaction

Each art piece dictates whether its post is dark or light via the `theme` field in frontmatter. The post page respects this -- the art IS the design decision. The global dark/light toggle only applies to non-art pages (home, about).

### Interactivity

Per-piece decision. Some art is:
- Purely decorative (static or ambient animation)
- Scroll-reactive (parallax, reveal, transform based on scroll position)
- Fully interactive (responds to mouse, click, keyboard)

Each post's `.astro` page handles its own interaction model.

### Performance

Art must never block content rendering:
- Content renders from static HTML immediately
- Art components load as Astro islands with appropriate client directives (`client:idle`, `client:visible`, `client:media`)
- Heavy dependencies (Three.js, WASM) are code-split per post -- only loaded when that post is visited
- `prefers-reduced-motion`: art should respect this (static fallback or paused animation)
- Visibility-based lifecycle: pause rendering when scrolled out of view or tab hidden
- Device capability detection: degrade gracefully on low-end devices

### File Organization

Art assets live alongside their post's page file or in a shared art directory:

```
src/
  pages/blog/
    on-shader-compilation.astro
    on-shader-compilation/
      shaders/
        compilation.vert
        compilation.frag
      assets/
        noise-texture.webp
      Scene.tsx           <-- React Three.js island component
```

Or for shared/reusable art components:

```
src/
  art/
    components/
      ParticleField.tsx
      ShaderCanvas.tsx
    utils/
      capabilities.ts    <-- device tier detection
```

## Pages

### Home Page (`/`)

- Inline "about me" blurb (short, no separate page)
- Simple article list: title + date, stacked vertically
- No thumbnails, no excerpts, no art previews -- pure text list
- No pagination -- all posts on one page
- Search bar (inline, always visible)
- Dark/light theme toggle (system preference default + manual override)

### Blog Post (`/blog/[slug]`)

- Custom-designed `.astro` page per post
- MDX content imported from Content Collections
- Theme (dark/light) dictated by the art/frontmatter
- Art and content in separate, non-overlapping regions

### Search (Cmd+K)

- Pagefind (static, client-side, indexes HTML output at build time)
- Accessible from:
  - Inline search bar on home page
  - Cmd+K keyboard shortcut from any page (modal overlay)

### RSS (`/rss.xml`)

- Full-content RSS feed via `@astrojs/rss`

### 404

- Custom 404 page (minimal, on-brand)

## Styling

### Approach

Vanilla CSS with custom properties. Fresh design identity (not shared with portfolio).

### Typography

- **Primary font:** JetBrains Mono -- used for body text, headings, code, UI
- Monospace-heavy aesthetic throughout
- Fluid sizing with `clamp()` for responsive typography
- Type scale TBD (to be refined during implementation)

### Theme System

- CSS custom properties for all colors
- `data-theme="dark"` / `data-theme="light"` attribute on `<html>`
- System preference detection via `prefers-color-scheme` media query
- Manual toggle persisted to `localStorage`
- On post pages: theme is locked to the art's declared theme (no toggle)

### Content Styles

Shared `prose.css` styles for MDX content regions:
- Consistent typography, spacing, and rhythm across all posts
- Syntax highlighting via Shiki (built into Astro)
- Responsive images
- Code blocks, blockquotes, tables, lists

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Astro | Zero JS default, islands architecture, Content Collections, multi-framework support |
| Content | MDX (local files) | Rich content with embedded components, CMS migration path via Content Layer API |
| Styling | Vanilla CSS + custom properties | Full control, no framework overhead, matches brutalist aesthetic |
| Search | Pagefind | Static indexing, zero runtime cost, client-side search |
| RSS | @astrojs/rss | Built-in Astro integration |
| Syntax highlighting | Shiki | Built into Astro, accurate language grammars |
| Font | JetBrains Mono | Open source, monospace, highly legible |
| Hosting | Cloudflare Pages | Static deploy via GitHub Actions CI/CD with wrangler |
| Islands | Framework-agnostic | React by default, add Svelte/Vue/Solid/Lit per post as needed |

### Key Dependencies

```
astro
@astrojs/mdx
@astrojs/react         (default island framework)
@astrojs/sitemap
@astrojs/rss
pagefind
three                  (peer dep, loaded per-post)
```

Additional framework integrations added as needed per post.

## Features NOT Included

- No comments / reactions system
- No newsletter / email signup
- No social sharing buttons
- No pagination
- No analytics (for now)
- No CMS (for now -- migration path exists via Astro Content Layer API)

## Deployment

- Cloudflare Pages static hosting
  - GitHub Actions CI/CD: tests gate deployment, wrangler deploys on main push
  - `public/_headers` file: security headers, cache-control rules (Cloudflare-native)
  - Compression (Brotli + gzip) and 404 routing handled automatically by Cloudflare
- Branch protection: main requires "Test" status check to pass
- Custom domain: `blog.spencerjireh.com` (CNAME to `howtokillabuddha.pages.dev`)

## V1 Scope

What ships in v1:

1. Home page with article list, about blurb, search bar, dark/light toggle
2. Custom-designed post pages with MDX content (at least 1 post)
3. Art system architecture (island-based, per-post bespoke designs)
4. Search (Pagefind, inline + Cmd+K)
5. Categories + tags in frontmatter schema
6. Dark/light theme system
7. RSS feed
8. SEO + Open Graph meta
9. Cloudflare Pages deployment with CI/CD
10. 404 page

## Open Questions

- Domain name
- Specific type scale values
- Image optimization strategy (Astro built-in vs external)
