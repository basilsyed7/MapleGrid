# MapleGrid Data – Landing Site

Production-grade staging site for MapleGrid Data’s sovereign compute offering. Built as a static, desktop-first landing experience with Tailwind CSS, GSAP micro-interactions, and a Canvas-based particle field written in TypeScript.

## Quick start

```bash
npm install
npm run dev
```

- `npm run dev` – builds once, watches Tailwind & TypeScript, and serves the site on `http://localhost:5173`.
- `npm run build` – generates minified `css/styles.css` and `js/main.js` ready for deployment.
- `npm run lint:ts` – strict type-check for the TypeScript sources.

## Project structure

```
/
  index.html           # Single-page layout with all sections
  robots.txt / sitemap.xml
  assets/              # Brand assets, icons, OG artwork
  css/styles.css       # Generated stylesheet (Tailwind + custom layers)
  src/styles.css       # Tailwind source + design tokens + background styles
  src/ts/              # TypeScript sources (particles + UI logic)
  js/main.js           # Bundled ES module for the browser
  functions/           # Cloudflare Pages Functions (contact handler)
  wrangler.toml        # Wrangler preview configuration
  tailwind.config.js   # Tokenised theme extensions
  tsconfig.json
  package.json
```

### Design tokens

- Primary token source lives in `src/styles.css` as CSS custom properties under `:root`.
- Tailwind equivalents are declared in `tailwind.config.js` so utilities and components share the same values.

Update both locations together when adding or changing tokens. Tailwind rebuild (`npm run build:css`) is required to propagate any adjustments.

## Animations & reduced motion

- GSAP powers scroll reveals, CTA/card hover easing, and the nav underline indicator (`src/ts/main.ts`).
- The hero particle field (`src/ts/particles.ts`) exposes an `initParticles` controller used in `main.ts`.
- All motion respects `prefers-reduced-motion: reduce`; canvas rendering downgrades to a static starfield and scroll/hover animations are skipped.

To tweak animation density or behaviour, adjust the constants in `initParticles` and the GSAP blocks in `main.ts`.

## Form handling with Cloudflare Pages + Resend

The contact form posts to a Cloudflare Pages Function (`functions/contact.ts`) which forwards the payload to Resend.

### Environment variables

Configure these in Cloudflare Pages → **Settings → Environment variables** (preview + production):

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | Resend API key with permission to send email from your verified domain. |
| `CONTACT_TO` | Destination email (e.g. `basil@maplegrid.net`). |
| `CONTACT_FROM` | Optional sender display (defaults to `MapleGrid Data <notifications@maplegrid.net>`). |

### Local development preview

Cloudflare Pages Functions run only in deployed or Wrangler preview environments.

```bash
# in one terminal
npm run dev     # static assets + watch server

# in a second terminal
npx wrangler pages dev . --port 8788
```

Then open `http://localhost:8788` to exercise the function locally (Wrangler proxies static assets and the `/contact` endpoint). Set environment variables via `--var NAME=value` or a `.dev.vars` file per Wrangler docs.

## Deploying to Cloudflare Pages

1. Push the repository to your Git provider and connect it to Cloudflare Pages.
2. Set **Build command** to `npm run build`.
3. Set **Build output directory** to the project root (`.`) so the generated `css/` and `js/` assets are used alongside `index.html`.
4. Use Node 18+ runtime.
5. Define the environment variables listed above for preview and production deployments.

A successful build emits a static bundle while Pages Functions powers the `/contact` endpoint.

## Swapping stacks later

- TypeScript sources (`src/ts`) can migrate into a React/Node/Express stack without losing animation logic; they already export clean controllers.
- Form submission is isolated in `setupContactForm`, so swapping the backend simply means pointing the `fetch` call at the new endpoint.

## Future enhancements

- Replace placeholder icons and OG artwork with final brand assets.
- Add production analytics by wiring `window.maplegridAnalytics` (placeholder function) to your analytics service of choice.
- Extend responsive coverage for mobile once the desktop staging site is approved.
