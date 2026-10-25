// HTML for project cards and project pages. The same functions run at build
// time (Astro inserts the HTML) and in the browser (to show newer content from
// Supabase), so both always look the same. Styles: src/styles/portfolio.css.
import { Marked } from 'marked';
import type { Project } from './content';

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Project stories are Markdown written in the admin. Raw HTML is shown as text.
const md = new Marked({ gfm: true, breaks: true });
md.use({ renderer: { html: ({ text }) => esc(text) } });
export const markdown = (body: string) => md.parse(body, { async: false }) as string;

/** Site text in its display form (see src/lib/texts.ts for the kinds). */
export function formatText(kind: string, value: string) {
  const safe = esc(value.trim());
  if (kind === 'hl') return safe.replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');
  if (kind === 'text') return safe.replace(/\n/g, '<br />');
  if (kind === 'paras')
    return safe
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
      .join('');
  return safe.replace(/\n/g, ' ');
}

/** Images uploaded in the admin are full URLs; images in the repo are paths under the site. */
export const assetUrl = (src: string, base: string) => (/^https?:\/\//.test(src) ? src : base + src.replace(/^\/+/, ''));

const svg = (paths: string, size = 18) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ARROW = '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>';
const ARROW_UP_RIGHT = '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>';

/** The project's cover image, or a dark branded cover with the leaf and category. */
/** A smaller copy of an image with its widths (see src/lib/images.ts). */
export type Sized = { src: string; srcset?: string; sizes?: string };
const sizedAttrs = (img?: Sized) => (img?.srcset ? ` srcset="${esc(img.srcset)}" sizes="${esc(img.sizes ?? '100vw')}"` : '');

export function coverHTML(p: Project, _seed: number, base: string, extraClass = '', img?: Sized) {
  const inner = p.cover
    ? `<img src="${esc(img?.src ?? assetUrl(p.cover, base))}"${sizedAttrs(img)} alt="${esc(`${p.title} preview`)}" loading="lazy" decoding="async" />`
    : `<div class="cover-art" aria-hidden="true"><img src="${base}brand/leaf-light-300.webp" alt="" class="cover-mark" loading="lazy" /><span class="cover-label">${esc(p.category)}</span></div>`;
  return `<div class="cover ${extraClass}">${inner}</div>`;
}

const statusClass = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

// Cards drawn after the page loaded are shown at once; cards in the built page
// fade in as they scroll into view (see Base.astro).
const shown = () => typeof document !== 'undefined';

export function cardHTML(p: Project, index: number, base: string, covers?: Record<string, Sized>) {
  return `<article class="p-card reveal${shown() ? ' is-visible' : ''}">
  <a href="${base}work/${esc(p.slug)}/" class="p-link">
    <div class="p-media">${coverHTML(p, index, base, '', covers?.[p.slug])}<span class="p-status ${statusClass(p.status)}">${esc(p.status)}</span></div>
    <div class="p-body">
      <div>
        <p class="p-meta">${esc(p.category)}${p.category ? ' · ' : ''}${p.year}</p>
        <h3>${esc(p.title)}</h3>
        <p class="p-summary">${esc(p.summary)}</p>
      </div>
      <span class="arrow-badge" aria-hidden="true">${svg(ARROW_UP_RIGHT, 16)}</span>
    </div>
  </a>
</article>`;
}

/** Wording on project pages (Site text, under "Work page and project pages"). */
export type ProjectLabels = Record<'back' | 'client' | 'year' | 'status' | 'link' | 'visit' | 'services' | 'next', string>;
export const PROJECT_LABEL_KEYS: ProjectLabels = {
  back: 'project.back',
  client: 'project.client',
  year: 'project.year',
  status: 'project.status',
  link: 'project.link',
  visit: 'project.visit',
  services: 'project.services',
  next: 'project.next',
};
const DEFAULT_LABELS: ProjectLabels = {
  back: 'All work',
  client: 'Client',
  year: 'Year',
  status: 'Status',
  link: 'Link',
  visit: 'Visit site',
  services: 'Services',
  next: 'Next project',
};

/** The whole project page: header, cover, story, gallery and the next project. */
export function projectHTML(
  p: Project,
  index: number,
  base: string,
  next?: { project: Project; index: number },
  labels: ProjectLabels = DEFAULT_LABELS,
) {
  // Labels carry data-t so newer wording from the admin shows straight away.
  const L = (k: keyof ProjectLabels) => `<span data-t="${PROJECT_LABEL_KEYS[k]}">${esc(labels[k])}</span>`;
  const facts = [
    p.client && `<div><dt>${L('client')}</dt><dd>${esc(p.client)}</dd></div>`,
    `<div><dt>${L('year')}</dt><dd>${p.year}</dd></div>`,
    `<div><dt>${L('status')}</dt><dd>${esc(p.status)}</dd></div>`,
    p.link &&
      `<div><dt>${L('link')}</dt><dd><a href="${esc(p.link)}" target="_blank" rel="noopener">${L('visit')} ${svg(ARROW_UP_RIGHT, 16)}</a></dd></div>`,
  ]
    .filter(Boolean)
    .join('');
  const services = p.services.length
    ? `<div class="pd-aside"><h2 class="pd-h">${L('services')}</h2><ul class="tags">${p.services.map((s) => `<li class="tag">${esc(s)}</li>`).join('')}</ul></div>`
    : '<div class="pd-aside"></div>';
  const gallery = p.gallery.length
    ? `<div class="container pd-gallery">${p.gallery
        .map((g) => `<img src="${esc(assetUrl(g.src, base))}" alt="${esc(g.alt)}" loading="lazy" decoding="async" />`)
        .join('')}</div>`
    : '';
  const nextHTML =
    next && next.project.slug !== p.slug
      ? `<section class="section pd-next"><div class="container"><p class="eyebrow">${L('next')}</p><div class="pd-next-card">${cardHTML(next.project, next.index, base)}</div></div></section>`
      : '';
  return `<article>
  <header class="container pd-head">
    <a class="pd-back" href="${base}work/">${svg(ARROW)} ${L('back')}</a>
    ${p.category ? `<p class="eyebrow">${esc(p.category)}</p>` : ''}
    <h1>${esc(p.title)}</h1>
    ${p.summary ? `<p class="lead">${esc(p.summary)}</p>` : ''}
    <dl class="pd-facts">${facts}</dl>
  </header>
  <div class="container pd-media">${coverHTML(p, index, base, 'cover-wide')}</div>
  <div class="container pd-body">${services}<div class="prose">${markdown(p.body)}</div></div>
  ${gallery}
</article>${nextHTML}`;
}

export function filtersHTML(groups: string[], all = 'All') {
  return [`<button type="button" aria-pressed="true" data-filter="all"><span data-t="workPage.all">${esc(all)}</span></button>`]
    .concat(groups.map((g) => `<button type="button" aria-pressed="false" data-filter="${esc(g)}">${esc(g)}</button>`))
    .join('');
}

export function workGridHTML(projects: Project[], base: string, group: (p: Project) => string, covers?: Record<string, Sized>) {
  return projects.map((p, i) => `<div data-group="${esc(group(p))}">${cardHTML(p, i, base, covers)}</div>`).join('');
}
