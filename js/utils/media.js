import { h } from './dom.js';

/**
 * Creates an image inside a wrapper that handles loading and failure.
 * If the image is missing or fails to load, the wrapper shows the first
 * letter of `label` instead, so layouts never collapse or show a broken icon.
 */
export function createMedia({
  src,
  alt = '',
  label = '',
  className = '',
  loading = 'lazy',
  fetchPriority,
}) {
  const wrapper = h('span', {
    class: ['media', className],
    'data-initial': (label.trim()[0] || '').toUpperCase(),
  });

  if (!src) {
    wrapper.classList.add('is-missing');
    return wrapper;
  }

  const image = h('img', {
    src,
    alt,
    loading,
    decoding: 'async',
    fetchpriority: fetchPriority,
  });

  const markLoaded = () => wrapper.classList.add('is-loaded');
  image.addEventListener('load', markLoaded, { once: true });
  image.addEventListener('error', () => {
    image.remove();
    wrapper.classList.add('is-missing');
  }, { once: true });

  wrapper.append(image);
  if (image.complete && image.naturalWidth > 0) markLoaded();
  return wrapper;
}
