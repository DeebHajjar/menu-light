/**
 * Tiny DOM helpers. All dynamic text is inserted as text nodes, never as
 * HTML, so API content cannot inject markup.
 */

function appendChildren(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === '') continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/**
 * h('a', { class: 'link', href: '#menu', onClick: fn }, 'Label')
 * - `class` accepts a string or an array (falsy entries are skipped)
 * - `on*` functions become event listeners
 * - null / undefined / false attributes are skipped, true becomes ""
 */
export function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes ?? {})) {
    if (value === null || value === undefined || value === false) continue;

    if (name === 'class') {
      element.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
    } else if (name === 'dataset') {
      Object.assign(element.dataset, value);
    } else if (name.startsWith('on') && typeof value === 'function') {
      element.addEventListener(name.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(name, value === true ? '' : String(value));
    }
  }

  appendChildren(element, children);
  return element;
}

export function render(container, ...children) {
  container.replaceChildren();
  appendChildren(container, children);
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/** Makes any string safe to use inside an id attribute. */
export function toDomId(prefix, value) {
  return `${prefix}-${String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`;
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
