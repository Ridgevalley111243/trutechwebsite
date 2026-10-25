---
name: lenis
description: Add smooth scrolling with Lenis (lenis.dev, by darkroom.engineering): setup in plain JS, Astro, React/Next.js or Vue, options, scrollTo and anchor links, stopping scroll for modals, scrollable areas that must keep native scroll (data-lenis-prevent), snapping, and syncing with GSAP ScrollTrigger or Framer Motion. Use whenever the user asks for smooth scroll, inertia or buttery scrolling, Lenis, or scroll that feels like an award-winning site.
---

# Lenis smooth scroll

Lenis smooths the page's own native scroll. It doesn't fake scrolling with transforms, so `position: sticky`, `IntersectionObserver`, scroll-linked animations and the browser's scroll position all keep working.

Use the `lenis` package, currently 1.x. The old `@studio-freight/lenis` and `@studio-freight/react-lenis` packages are deprecated. If a project still uses them, migrate unless it pins them on purpose.

```bash
npm i lenis
```

## Rules that always apply

- **Include the CSS** (`import 'lenis/dist/lenis.css'`). Without it, stopping and nested scrolling misbehave.
- **Remove `scroll-behavior: smooth`** from `html` in CSS. It fights Lenis. Use the `anchors` option for in-page links instead.
- **Only one Lenis on the page,** and only one animation-frame loop drives it: `autoRaf: true`, your own `requestAnimationFrame`, or GSAP's ticker. Never two.
- **Reduced motion:** Lenis honours `prefers-reduced-motion` by default (`respectReducedMotion: true`), so don't turn that off.
- **Touch:** leave touch scrolling native (`syncTouch: false`, the default). Phones already have good momentum scrolling.
- **Scrollable areas inside the page** (modals, drawers, menus, code blocks, maps, full-screen viewers, chat boxes) need `data-lenis-prevent`. Without it, the page scrolls instead of the box.
- **While a modal or full-screen view is open,** call `lenis.stop()`, and `lenis.start()` when it closes.
- **Admin dashboards and long forms** usually shouldn't get smooth scroll. Leave those pages out.
- **Clean up** with `lenis.destroy()` when the page or component goes away: SPA route changes, Astro View Transitions, React unmount.

## Plain JS / Astro

```ts
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const lenis = new Lenis({
  autoRaf: true, // Lenis runs its own animation loop
  anchors: true, // smooth <a href="#id"> links
  lerp: 0.1, // 0–1; lower = smoother and slower (default 0.1)
});

lenis.on('scroll', (l) => {
  // l.scroll, l.velocity, l.direction (1 or -1), l.progress (0–1), l.isScrolling
});
```

In Astro, put this in a `<script>` in the layout (for example `Base.astro`) so it runs once per page. For pages that shouldn't have it, such as the admin, pass a prop and skip the script. With `<ClientRouter />` (View Transitions), destroy it on `astro:before-swap` and create it again on `astro:page-load`.

To drive Lenis from your own loop instead of `autoRaf`:

```ts
const lenis = new Lenis();
function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

### Options

| Option | Default | What it does |
| --- | --- | --- |
| `lerp` | `0.1` | How smooth the scroll is (0–1). Overrides `duration`. |
| `duration` | `1.2` | Scroll length in seconds; used only if `lerp` is not set. |
| `easing` | ease-out-expo | `(t) => number`; used with `duration`. |
| `smoothWheel` | `true` | Smooth mouse-wheel and trackpad scrolling. |
| `syncTouch` | `false` | Smooth touch too (`syncTouchLerp`, `touchMultiplier`). Usually leave off. |
| `wheelMultiplier` | `1` | Scroll speed for the wheel. |
| `orientation` / `gestureOrientation` | `'vertical'` | Use `'horizontal'` for horizontal pages. |
| `autoRaf` | `false` | Run its own animation loop. |
| `anchors` | `false` | `true` or ScrollTo options such as `{ offset: -80 }` for sticky headers. |
| `prevent` | none | `(node) => boolean`; return true to leave a node's scroll native. |
| `allowNestedScroll` | `false` | Detect nested scrollable areas automatically (slower than the data attributes). |
| `stopInertiaOnNavigate` | `false` | Stop the glide when an internal link is clicked. |
| `wrapper` / `content` | window / `<html>` | For scrolling inside a container instead of the page. |
| `infinite` | `false` | Endless looping scroll. |
| `autoResize` | `true` | Recalculate sizes when the content changes size. |
| `respectReducedMotion` | `true` | Honour reduced motion. |

### Methods and properties

- `lenis.scrollTo(target, options)`
  - **target:** a number, selector (`'#contact'`), element, or `'top'` / `'bottom'`.
  - **options:** `{ offset, duration, easing, lerp, immediate, lock, force, onComplete }`.
- `lenis.stop()` / `lenis.start()` pause and resume scrolling (for example under a modal). `lenis.isStopped` tells you which.
- `lenis.on('scroll', fn)` returns an unsubscribe function. `'virtual-scroll'` gives `{ deltaX, deltaY, event }`.
- `lenis.resize()` recalculates sizes after big layout changes, if `autoResize` misses them.
- `lenis.destroy()` removes all listeners.
- **Read-only properties:** `scroll`, `animatedScroll`, `velocity`, `direction`, `progress`, `limit`, `isScrolling`, `isSmooth`.

### Keep native scroll in a scrollable area

```html
<div class="modal-body" data-lenis-prevent>…</div>
<!-- or only some input: data-lenis-prevent-wheel, -touch, -vertical, -horizontal -->
```

## React / Next.js

```tsx
'use client';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return <ReactLenis root options={{ lerp: 0.1, anchors: true }}>{children}</ReactLenis>;
}

// In any child:
const lenis = useLenis(({ scroll }) => { /* every frame while scrolling */ });
lenis?.scrollTo('#contact', { offset: -80 });
```

Put `SmoothScroll` around the body in `app/layout.tsx` (Next.js App Router) or around the app root. For Vue and Nuxt there are `lenis/vue` and `lenis/nuxt`.

## Snapping

```ts
import Snap from 'lenis/snap';
const snap = new Snap(lenis, { type: 'proximity' }); // or 'mandatory', 'lock'
snap.addElements([...document.querySelectorAll<HTMLElement>('section')], { align: 'start' });
```

## With animation libraries

- **Framer Motion / Motion:** `scroll()` and `useScroll()` read the native scroll position, so they work with Lenis as they are. Nothing to sync.
- **GSAP ScrollTrigger:** let GSAP's ticker drive Lenis, and don't use `autoRaf`:
  ```ts
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
- **CSS scroll-driven animations and IntersectionObserver** work as they are.

## Before you finish

1. Wheel and trackpad scrolling feel smooth, and the keyboard (Space, PageDown, arrows, Home/End) still scrolls.
2. Anchor links land correctly below a sticky header (`anchors: { offset: -headerHeight }`).
3. Every modal, menu and inner scroll box scrolls on its own (`data-lenis-prevent`), and the page doesn't scroll behind an open modal (`stop()`).
4. With reduced motion turned on, scroll is instant.
5. On phones, touch scrolling still feels native, with no lag.
6. Nothing errors after page navigation; destroy and recreate it if needed.
