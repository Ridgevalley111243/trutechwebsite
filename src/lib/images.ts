// Smaller copies of photos for the built pages (Astro's image service, at
// build time). Each image gets a few widths, and the browser picks the one
// that fits the screen. If an image can't be fetched, the original is used.
import { getImage } from 'astro:assets';
import type { Project } from './content';

import { assetUrl, type Sized } from './render';

export type Img = Sized;

const cache = new Map<string, Promise<Img>>();

/** A set of widths for an image (a full URL, or a path in public/). */
export function responsive(url: string, widths: number[], sizes: string): Promise<Img> {
  if (!url) return Promise.resolve({ src: url });
  const key = `${url}|${widths}|${sizes}`;
  if (!cache.has(key)) {
    // Files in public/ are fetched from the live site, where they already are.
    const remote = /^https?:\/\//.test(url) ? url : new URL(url.replace(/^\//, ''), siteRoot()).href;
    cache.set(
      key,
      getImage({ src: remote, inferSize: true, widths, sizes, format: 'webp', quality: 80 })
        .then((img) => ({ src: img.src, srcset: img.srcSet.attribute || undefined, sizes }))
        .catch(() => ({ src: assetUrl(url, import.meta.env.BASE_URL.replace(/\/?$/, '/')) })),
    );
  }
  return cache.get(key)!;
}

const siteRoot = () => new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), import.meta.env.SITE).href;

/** Card covers for these projects, by slug. */
export async function coverImages(projects: Project[], sizes: string): Promise<Record<string, Img>> {
  const entries = await Promise.all(
    projects
      .filter((p) => p.cover)
      .map(async (p) => [p.slug, await responsive(p.cover!, [400, 640, 960], sizes)] as const),
  );
  return Object.fromEntries(entries);
}

/** Attributes for an <img> built from an Img. */
export const imgAttrs = (img: Img) => ({ src: img.src, srcset: img.srcset, sizes: img.srcset ? img.sizes : undefined });
