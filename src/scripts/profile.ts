// Shows the current profile photo (Settings in the admin) without waiting for
// the next rebuild. Slots are elements with data-photo-slot; data-photo holds
// the photo the page was built with, data-fallback the image shown without one.
// Slots marked data-photo-slot="about" show the About photo when there is one.
//
// The photo stays hidden (global.css) until this has checked which photo is
// current, so a photo replaced since the last build never flashes on screen.
import { CENTRED, fetchSettings, photoPosStyle } from '../lib/content';

const reveal = (slot: HTMLElement) => slot.classList.add('photo-ready');

async function show(slot: HTMLElement, photo: string, owner: string) {
  const img = slot.querySelector('img')!;
  if ((slot.dataset.photo ?? '') !== photo) {
    slot.dataset.photo = photo;
    slot.classList.toggle('has-photo', Boolean(photo));
    if (!slot.dataset.fallback) slot.hidden = !photo;
    // The built page may carry smaller copies of the old photo.
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = photo || slot.dataset.fallback || '';
    img.alt = photo ? `Photo of ${owner || 'the founder of Trutech Business'}` : '';
  }
  // Fade in once the right image is ready to draw.
  await img.decode().catch(() => {});
  reveal(slot);
}

export async function liveProfilePhoto() {
  const slots = [...document.querySelectorAll<HTMLElement>('[data-photo-slot]')];
  if (!slots.length) return;
  // If the check takes too long (slow connection), show what the page has.
  const fallback = setTimeout(() => slots.forEach(reveal), 4000);
  try {
    const { photo, aboutPhoto, aboutPhotoPos, owner } = await fetchSettings();
    const photoFor = (slot: HTMLElement) => (slot.dataset.photoSlot === 'about' && aboutPhoto) || photo;
    // About photos are placed as set in the admin.
    for (const slot of slots.filter((s) => s.dataset.photoSlot === 'about'))
      slot.setAttribute('style', photoPosStyle(aboutPhoto ? aboutPhotoPos : CENTRED));
    await Promise.all(slots.map((slot) => show(slot, photoFor(slot), owner)));
  } finally {
    clearTimeout(fallback);
    slots.forEach(reveal);
  }
}
