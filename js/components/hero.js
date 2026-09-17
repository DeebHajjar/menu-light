import { h, qs, render } from '../utils/dom.js';
import { createMedia } from '../utils/media.js';

/**
 * Fills the static hero markup in index.html with restaurant data.
 * Slots are found by their data-hero-* attributes.
 */
export function renderHero(root, restaurant) {
  const slot = (name) => qs(`[data-hero-${name}]`, root);

  render(slot('media'), restaurant.heroImage && createMedia({
    src: restaurant.heroImage,
    alt: '',
    loading: 'eager',
    fetchPriority: 'high',
    className: 'hero__image',
  }));

  render(slot('logo'), restaurant.logo && h('img', {
    src: restaurant.logo,
    alt: `${restaurant.name} logo`,
    width: 96,
    height: 96,
    decoding: 'async',
    onError: (event) => event.currentTarget.remove(),
  }));

  render(slot('name'), restaurant.name);
  render(slot('tagline'), restaurant.tagline);
  render(slot('description'), restaurant.description);

  const [today] = restaurant.openingHours;
  render(slot('hours'), today && [today.days, today.hours].filter(Boolean).join(', '));

  finish(root);
}

/** Used when restaurant details fail to load: the menu still works. */
export function renderHeroFallback(root) {
  render(qs('[data-hero-name]', root), 'Our menu');
  for (const name of ['tagline', 'description', 'hours', 'logo']) {
    render(qs(`[data-hero-${name}]`, root));
  }
  finish(root);
}

function finish(root) {
  root.removeAttribute('aria-busy');
  root.classList.add('is-ready');
}
