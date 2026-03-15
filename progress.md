# Development Progress

Tracks development from zero to deployed v1. Each phase has a clear deliverable. Phases are sequential but some tasks within a phase can be parallelized.

---

## Phase 0: Project Scaffolding & Dev Environment

**Goal:** A running Astro dev server with all foundational config in place. No visible UI yet -- just the skeleton.

**Deliverable:** `npm run dev` serves a blank page. All tooling works. Git repo initialized.

- [ ] Initialize Astro project (`npm create astro@latest`) with empty template
- [ ] Install core dependencies: `@astrojs/mdx`, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/rss`
- [ ] Configure `astro.config.mjs` (site URL, integrations, Shiki syntax highlighting, MDX)
- [ ] Configure TypeScript (`tsconfig.json` -- strict mode, path aliases)
- [ ] Set up directory structure:
  ```
  src/
    content/
      blog/
      config.ts
    pages/
      blog/
    layouts/
    components/
    styles/
    art/
      components/
      utils/
  ```
- [ ] Define content collection schema in `src/content/config.ts` (Zod schema from spec)
- [ ] Self-host JetBrains Mono (subset to Latin, woff2 only) in `public/fonts/`
- [ ] Add `.gitignore`, `.editorconfig`
- [ ] Git init + initial commit

---

## Phase 1: Design System & Global Styles

**Goal:** Establish the visual identity. All CSS custom properties, typography, and theme switching in place. No content yet -- but any page dropped in looks right.

**Deliverable:** A styled blank page that responds to dark/light toggle and respects system preference.

- [ ] Create `src/styles/reset.css` (minimal CSS reset)
- [ ] Create `src/styles/tokens.css` (CSS custom properties: colors, spacing, type scale)
  - Dark and light palettes via `[data-theme]` selectors
  - Fluid type scale with `clamp()`
  - Spacing scale
- [ ] Create `src/styles/global.css` (base element styles, font-face declarations, font-display: swap)
- [ ] Create `src/styles/prose.css` (shared MDX content region styles)
  - Typography rhythm, headings, paragraphs, lists
  - Code blocks (Shiki token colors for both themes)
  - Blockquotes, tables, links, images
- [ ] Build `<ThemeToggle />` component
  - System preference detection (`prefers-color-scheme`)
  - Manual override persisted to `localStorage`
  - Sets `data-theme` attribute on `<html>`
  - No flash of wrong theme (inline script in `<head>`)
- [ ] Create `src/layouts/BaseLayout.astro` (html head, meta viewport, font preload, global styles, theme script)

---

## Phase 2: Home Page

**Goal:** The landing page. Readers see who you are and what you've written. Functional with zero posts (empty state).

**Deliverable:** Home page at `/` with about blurb, article list (empty or with test data), and theme toggle.

- [ ] Create `src/pages/index.astro`
- [ ] About blurb section (static, inline -- not a separate page)
- [ ] Article list component
  - Queries Content Collections, sorted by date descending
  - Renders title + date per post, stacked vertically
  - Filters out `draft: true` posts in production builds
  - Empty state handling (no posts yet)
  - Category indicators (technical / personal) -- minimal, typographic
- [ ] Wire up `<ThemeToggle />` in header/nav area
- [ ] Responsive layout (mobile-first, fluid)
- [ ] Link to RSS feed in header or footer

---

## Phase 3: Content System & Prose Styles

**Goal:** The MDX pipeline works end-to-end. You can write a post in MDX, it renders with correct prose styling, and it appears in the home page list.

**Deliverable:** A test/draft MDX post renders correctly with all prose elements (headings, code blocks, lists, images, links).

- [ ] Create a test MDX post (`src/content/blog/test-post.mdx`) exercising all prose elements
- [ ] Create a minimal page file (`src/pages/blog/test-post.astro`) that imports and renders the content
- [ ] Verify Shiki syntax highlighting works (test with 2-3 languages)
- [ ] Verify prose.css styles render correctly for all block-level elements
- [ ] Test `draft: true` filtering (draft posts hidden in prod, visible in dev)
- [ ] Add build-time validation: warn if an MDX file exists without a matching `.astro` page file (or vice versa)

---

## Phase 4: Art System & Demo Post

**Goal:** Prove the art architecture works. A real island component loads a GLSL shader, renders to canvas, and coexists with MDX content without interference.

**Deliverable:** A demo post at `/blog/demo-shader` with a working fragment shader rendered to a `<canvas>`, MDX content in a separate region, and theme locked to the art's declared theme.

- [ ] Create `src/art/utils/capabilities.ts` (device tier detection: GPU, memory, connection speed)
- [ ] Create `src/art/components/ShaderCanvas.tsx` (React island)
  - Accepts fragment shader source as prop (or imports inline)
  - Renders to `<canvas>` via WebGL2 (fallback to WebGL1)
  - Respects `prefers-reduced-motion` (static frame or paused)
  - Visibility lifecycle: pause when offscreen or tab hidden (`IntersectionObserver` + `visibilitychange`)
  - Error boundary: catches WebGL context loss, shader compile errors -- falls back to CSS gradient
  - Accepts `className` / `style` for per-post sizing and positioning
- [ ] Create demo post content (`src/content/blog/demo-shader.mdx`)
  - Frontmatter: `theme: dark`, `category: technical`, `draft: false`
  - Content: brief writeup explaining the shader and the art system
- [ ] Create demo post page (`src/pages/blog/demo-shader.astro`)
  - Bespoke layout: shader in hero region, content below
  - Imports `ShaderCanvas` as island (`client:visible`)
  - Theme locked to frontmatter value (no toggle visible)
  - `data-pagefind-body` on content region, `data-pagefind-ignore` on art container
- [ ] Write the GLSL fragment shader (`src/pages/blog/demo-shader/shaders/demo.frag`)
- [ ] Verify: art loads lazily, content renders immediately from static HTML, JS only loads for the shader island
- [ ] Verify: page works with JS disabled (content readable, art absent)

---

## Phase 5: Search

**Goal:** Readers can find posts by keyword. Works from the home page and via Cmd+K from any page.

**Deliverable:** Pagefind-powered search with inline home page bar and global Cmd+K modal.

- [ ] Install and configure Pagefind (runs post-build on static output)
- [ ] Add `data-pagefind-body` attributes to content regions across all pages
- [ ] Add `data-pagefind-ignore` to art containers, nav, footer, non-content elements
- [ ] Build inline search bar component for home page
- [ ] Build Cmd+K modal overlay component (accessible: focus trap, escape to close, aria attributes)
- [ ] Wire Cmd+K listener globally (all pages)
- [ ] Style search results to match site aesthetic
- [ ] Test search with demo post content -- verify art DOM is not indexed

---

## Phase 6: RSS, SEO & Meta

**Goal:** The site is discoverable. RSS readers can subscribe. Social shares look good.

**Deliverable:** Valid RSS feed, proper meta tags on all pages, Open Graph images.

- [ ] Create `src/pages/rss.xml.ts` using `@astrojs/rss` (full-content feed)
- [ ] Add `<head>` meta tags to `BaseLayout.astro`:
  - Title, description, canonical URL
  - Open Graph (og:title, og:description, og:image, og:type)
  - Twitter card meta
  - `theme-color` meta tag (matches current theme)
- [ ] Create per-post meta: pull title, description, ogImage from frontmatter
- [ ] Generate/create a default OG image fallback for posts without a custom one
- [ ] Verify sitemap generation (`@astrojs/sitemap`)
- [ ] Add `robots.txt` to `public/`
- [ ] Validate RSS feed (W3C validator)

---

## Phase 7: 404 & Polish

**Goal:** Handle edge cases. Accessibility pass. Performance audit. The site feels finished.

**Deliverable:** Custom 404, passing Lighthouse audit, no accessibility regressions.

- [ ] Create `src/pages/404.astro` (minimal, on-brand, links back to home)
- [ ] Accessibility audit:
  - Color contrast ratios (both themes)
  - Keyboard navigation through all interactive elements
  - Focus styles visible and consistent
  - Screen reader pass: headings hierarchy, alt text, aria labels
  - Skip-to-content link
- [ ] Performance audit:
  - Lighthouse score targets (aim for 95+ across all categories)
  - Verify zero JS on non-interactive pages
  - Verify art island code-splitting (Three.js/shader deps not in main bundle)
  - Font loading: no layout shift (font-display: swap + proper fallback metrics)
  - Image optimization: verify Astro `<Image>` component used where applicable
- [ ] `prefers-reduced-motion` test: verify art respects this across all posts
- [ ] Test on low-end device / throttled connection (art degrades, content loads fast)
- [ ] Remove test post if still present, ensure demo post is the only published post

---

## Phase 8: Deployment

**Goal:** The site is live on the internet behind a custom domain, served by nginx via Docker on Coolify.

**Deliverable:** Production site accessible at custom domain with HTTPS, proper caching, and security headers.

- [ ] Create `Dockerfile` (multi-stage build)
  - Stage 1: `node:lts-alpine` -- install deps, run `npm run build`, run Pagefind indexing
  - Stage 2: `nginx:alpine` -- copy static output from stage 1, copy nginx config
- [ ] Create `nginx.conf`
  - gzip compression (html, css, js, svg, json, xml)
  - Cache headers: immutable for hashed assets, short TTL for HTML
  - Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP)
  - SPA-style fallback to 404.html for missing routes
  - Reference portfolio's `nginx.conf` as starting point
- [ ] Add `.dockerignore` (node_modules, .git, .env, dist)
- [ ] Test Docker build locally: `docker build -t blog .` && `docker run -p 8080:80 blog`
- [ ] Configure Coolify:
  - Point to Git repo
  - Set build pack to Dockerfile
  - Configure custom domain + HTTPS (Coolify handles Let's Encrypt)
  - Set up health check endpoint
- [ ] DNS: point custom domain to Coolify VPS
- [ ] Verify production site:
  - HTTPS working
  - All pages load correctly
  - Search works
  - RSS feed accessible
  - OG meta renders correctly (test with social share debuggers)
  - Headers correct (check via `curl -I`)
- [ ] Ship it

---

## Post-V1 (Not in scope, tracked for future reference)

- Analytics integration
- CI/CD pipeline (GitHub Actions -> Coolify webhook)
- CMS migration (Astro Content Layer API)
- Additional framework integrations per post (Svelte, Vue, Solid)
- Default post layout for quick/simple posts
- Newsletter / email signup
- Comments system
- Image optimization pipeline (if Astro built-in proves insufficient)
- Reading time field (remark plugin)
