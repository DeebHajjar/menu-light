import { h } from '../utils/dom.js';
import { pluralize } from '../utils/format.js';
import { createMedia } from '../utils/media.js';
import { routes } from '../router.js';

/**
 * The category chooser, hung like a gallery wall: each category is a
 * matted print with a caption underneath.
 */
export function CategoryGrid({ categories }) {
  return h('ul', { class: 'gallery', role: 'list' },
    categories.map((category) => h('li', { class: 'gallery__item' },
      h('a', { class: 'print', href: routes.category(category.slug) },
        h('span', { class: 'print__mat' },
          createMedia({
            src: category.image,
            label: category.name,
            className: 'print__media',
          }),
        ),
        h('span', { class: 'print__caption' },
          h('span', { class: 'print__name' }, category.name),
          category.description && h('span', { class: 'print__description' }, category.description),
          category.dishCount !== null && h('span', { class: 'print__count' },
            pluralize(category.dishCount, 'dish', 'dishes'),
          ),
        ),
      ),
    )),
  );
}
