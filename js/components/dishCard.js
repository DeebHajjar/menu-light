import { h } from '../utils/dom.js';
import { createMedia } from '../utils/media.js';

const TAG_LABELS = {
  signature: "Chef's signature",
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  gluten_free: 'Gluten-free',
  spicy: 'Spicy',
  new: 'New',
  alcohol_free: 'Alcohol-free',
};

export function tagLabel(tag) {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  const words = tag.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function TagList({ tags, className = 'tags' }) {
  if (!tags.length) return null;
  return h('ul', { class: className, role: 'list', 'aria-label': 'Dietary and house notes' },
    tags.map((tag) => h('li', { class: ['tag', `tag--${tag.replace(/[^a-z0-9_-]/g, '')}`] }, tagLabel(tag))),
  );
}

/**
 * One dish: a matted square image, then name and price on one line,
 * ingredients below. The whole card opens the dish details.
 */
export function DishCard({ dish, formatPrice, onOpen }) {
  const price = formatPrice(dish.price);

  return h('article', { class: ['dish', !dish.isAvailable && 'dish--unavailable'] },
    h('span', { class: 'dish__mat' },
      createMedia({ src: dish.image, label: dish.name, className: 'dish__media' }),
    ),
    h('div', { class: 'dish__body' },
      h('div', { class: 'dish__head' },
        h('h3', { class: 'dish__name' },
          h('button', {
            type: 'button',
            class: 'dish__trigger',
            'aria-haspopup': 'dialog',
            onClick: (event) => onOpen(dish, event.currentTarget),
          }, dish.name),
        ),
        price && h('p', { class: 'dish__price' },
          h('span', { class: 'visually-hidden' }, 'Price: '),
          price,
        ),
      ),
      dish.ingredients.length > 0 && h('p', { class: 'dish__ingredients' },
        h('span', { class: 'visually-hidden' }, 'Ingredients: '),
        dish.ingredients.join(', '),
      ),
      TagList({ tags: dish.tags, className: 'tags dish__tags' }),
      !dish.isAvailable && h('p', { class: 'dish__status' }, 'Not available today'),
    ),
  );
}
