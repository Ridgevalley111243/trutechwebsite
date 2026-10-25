// Portfolio and settings, stored in Supabase (project "Class of 2019 Dues",
// tables prefixed site_). Used both at build time and in the browser, so the
// site can show changes made in the admin before the next rebuild.

// Public values: the anon key only allows what the database's row level
// security permits (reading published projects and settings).
export const SUPABASE_URL = 'https://ypliibgdetwgbdlxjirg.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbGlpYmdkZXR3Z2JkbHhqaXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzAxNjQsImV4cCI6MjEwNzc0NjE2NH0.Ik9Rzgu0ILKq3l734kPGeNb5xouXXphUTp23Kw-g9mA';
export const CLIENT_PORTAL_URL = `${SUPABASE_URL}/functions/v1/client-portal`;

export const STATUSES = ['Completed', 'Live', 'In development', 'Planned'] as const;
export type Status = (typeof STATUSES)[number];

export type GalleryImage = { src: string; alt: string };
export type Project = {
  slug: string;
  title: string;
  client: string;
  category: string;
  year: number;
  status: Status;
  summary: string;
  cover: string | null;
  gallery: GalleryImage[];
  services: string[];
  link: string | null;
  featured: boolean;
  order: number;
  body: string;
};

export type Social = { label: string; handle: string; url: string; icon: string };
/** How the About photo sits in its rectangle: the point to keep in view, as
 * percentages from the left and top, and how far it is zoomed in. */
export type PhotoPos = { x: number; y: number; zoom: number };
export const CENTRED: PhotoPos = { x: 50, y: 50, zoom: 1 };
export type Settings = {
  owner: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  whatsappName: string;
  /** Profile photo URL (uploaded in the admin), or '' for none. */
  photo: string;
  /** Photo for the About section and page, or '' to use the profile photo. */
  aboutPhoto: string;
  aboutPhotoPos: PhotoPos;
  socials: Social[];
  /** Site text edited in the admin: { key: text } (see src/lib/texts.ts). */
  texts: Record<string, string>;
};

const PROJECT_COLUMNS = 'slug,title,client,category,year,status,summary,cover,gallery,services,link,featured,sort_order,body';

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

export function normalizeProject(row: Record<string, unknown>): Project {
  const gallery = Array.isArray(row.gallery) ? row.gallery : [];
  return {
    slug: str(row.slug),
    title: str(row.title),
    client: str(row.client),
    category: str(row.category),
    year: Number(row.year) || new Date().getFullYear(),
    status: (STATUSES as readonly string[]).includes(str(row.status)) ? (row.status as Status) : 'Completed',
    summary: str(row.summary),
    cover: str(row.cover) || null,
    gallery: gallery
      .map((g: Record<string, unknown>) => ({ src: str(g?.src), alt: str(g?.alt) }))
      .filter((g: GalleryImage) => g.src),
    services: Array.isArray(row.services) ? row.services.map(str).filter(Boolean) : [],
    link: str(row.link) || null,
    featured: Boolean(row.featured),
    order: Number(row.sort_order) || 0,
    body: str(row.body),
  };
}

const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.min(max, Math.max(min, Number(v))) : fallback;

export function photoPos(v: unknown): PhotoPos {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return { x: clamp(o.x, 0, 100, 50), y: clamp(o.y, 0, 100, 50), zoom: clamp(o.zoom, 1, 3, 1) };
}

/** CSS variables that place a photo (see [data-photo-slot] in global.css). */
export const photoPosStyle = (p: PhotoPos) => `--px:${p.x}%;--py:${p.y}%;--zoom:${p.zoom}`;

export function normalizeSettings(data: Record<string, unknown> | null | undefined): Settings {
  const d = data ?? {};
  const socials = Array.isArray(d.socials) ? d.socials : [];
  return {
    owner: str(d.owner),
    location: str(d.location) || 'Ghana',
    email: str(d.email),
    phone: str(d.phone),
    whatsapp: str(d.whatsapp).replace(/\D/g, ''),
    whatsappName: str(d.whatsappName),
    photo: /^https?:\/\//.test(str(d.photo)) ? str(d.photo) : '',
    aboutPhoto: /^https?:\/\//.test(str(d.aboutPhoto)) ? str(d.aboutPhoto) : '',
    aboutPhotoPos: photoPos(d.aboutPhotoPos),
    socials: socials
      .map((s: Record<string, unknown>) => ({ label: str(s?.label), handle: str(s?.handle), url: str(s?.url), icon: str(s?.icon) }))
      .filter((s: Social) => s.url),
    texts: Object.fromEntries(
      Object.entries(d.texts && typeof d.texts === 'object' ? (d.texts as Record<string, unknown>) : {}).filter(
        (e): e is [string, string] => typeof e[1] === 'string',
      ),
    ),
  };
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, ...init?.headers },
  });
  if (!res.ok) throw new Error(`Supabase ${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Published projects, in Work page order. */
export async function fetchProjects(): Promise<Project[]> {
  const rows = await rest<Record<string, unknown>[]>(
    `site_projects?select=${PROJECT_COLUMNS}&published=eq.true&order=sort_order.asc,created_at.asc`,
  );
  return rows.map(normalizeProject);
}

// One request per page, however many parts of the page need the settings.
type SettingsRows = { data: Record<string, unknown> }[];
let settingsRequest: Promise<Settings> | undefined;
export function fetchSettings(): Promise<Settings> {
  const ask = () => rest<SettingsRows>('site_settings?select=data&id=eq.1');
  // Started early by Base.astro; null if that request failed.
  const early = (globalThis as { __settings?: Promise<SettingsRows | null> }).__settings;
  settingsRequest ??= (early ? early.then((rows) => rows ?? ask()) : ask()).then((rows) => normalizeSettings(rows[0]?.data));
  return settingsRequest;
}

/** Changes whenever any published project or the settings change. */
export async function fetchContentVersion(): Promise<string> {
  return rest<string>('rpc/site_content_version', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
}

/** Short fingerprint of some data, to tell whether the page is out of date. */
export function fingerprint(value: unknown): string {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** The part of a type before "·" groups projects on the Work page. */
export const groupOf = (p: Project) => p.category.split('·')[0].trim() || 'Other';

/** A project page shows the project and the next one. */
export const projectFingerprint = (projects: Project[], i: number) =>
  fingerprint([projects[i], projects.length > 1 ? projects[(i + 1) % projects.length] : null]);

export const featuredOf = (projects: Project[]) => projects.filter((p) => p.featured).slice(0, 3);
