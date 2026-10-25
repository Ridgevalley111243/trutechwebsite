// Smooth scrolling for the public pages (Lenis). Touch scrolling stays native,
// and visitors who prefer reduced motion get normal instant scrolling.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function smoothScroll() {
  return new Lenis({ autoRaf: true, lerp: 0.1 });
}
