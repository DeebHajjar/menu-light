import { h, qs, render, prefersReducedMotion } from '../utils/dom.js';
import { routes } from '../router.js';

/**
 * Category contents shown inside a category: a side column on wide
 * screens, a sticky bar on small ones.
 */
export function renderCategoryNav(nav, categories, activeSlug) {
  render(nav,
    h('a', { class: 'menu-nav__back', href: routes.menu() }, 'All categories'),
    h('ul', { class: 'menu-nav__list', role: 'list' },
      categories.map((category) => h('li', {},
        h('a', {
          class: 'menu-nav__link',
          href: routes.category(category.slug),
          'aria-current': category.slug === activeSlug ? 'page' : null,
        }, category.name),
      )),
    ),
  );
  nav.hidden = false;
  const list = qs('.menu-nav__list', nav);
  watchOverflow(list);
  centerActiveLink(nav);
}

export function hideCategoryNav(nav) {
  nav.hidden = true;
  render(nav);
}

const overflowObserver = typeof ResizeObserver === 'function'
  ? new ResizeObserver((entries) => entries.forEach(({ target }) => updateOverflow(target)))
  : null;

function updateOverflow(list) {
  list.classList.remove('is-overflowing');
  list.classList.toggle('is-overflowing', list.scrollWidth > list.clientWidth + 1);
}

function watchOverflow(list) {
  updateOverflow(list);
  overflowObserver?.disconnect();
  overflowObserver?.observe(list);
}

/** Scrolls the horizontal list so the current category is visible (LTR and RTL). */
function centerActiveLink(nav) {
  const list = qs('.menu-nav__list', nav);
  const active = qs('[aria-current="page"]', nav);
  if (!list || !active || !list.classList.contains('is-overflowing')) return;

  const listBox = list.getBoundingClientRect();
  const linkBox = active.getBoundingClientRect();
  const offset = (linkBox.left + linkBox.width / 2) - (listBox.left + listBox.width / 2);
  list.scrollBy({ left: offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
