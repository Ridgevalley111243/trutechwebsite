// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves a project site under /<repo-name>/. The deploy workflow
// passes the repository's current name, so renaming the repo can't break the
// site. With a custom domain, set SITE_URL to it and BASE_PATH to "/".
const site = process.env.SITE_URL ?? 'https://ridgevalley111243.github.io';
const base = process.env.BASE_PATH ?? '/trutechwebsite';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // CSS in the page itself, so it doesn't hold up the first paint.
  build: { inlineStylesheets: 'always' },
  // Photos uploaded in the admin and files already on the live site are
  // resized at build time (src/lib/images.ts).
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ypliibgdetwgbdlxjirg.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: new URL(site).hostname },
    ],
  },
});
