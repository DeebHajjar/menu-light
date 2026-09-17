import { h, render } from '../utils/dom.js';
import { createMedia } from '../utils/media.js';
import { TagList } from './dishCard.js';

/**
 * Dish details in a native <dialog>, styled as a side drawer
 * (a bottom sheet on small screens): focus trapping, Escape to close and
 * the backdrop come from the browser.
 */
export function createDishDialog(dialog, { getFormatPrice }) {
  const supported = typeof dialog?.showModal === 'function';
  let returnFocusTo = null;

  if (supported) {
    // A click that lands on the dialog element itself is a click on the backdrop.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      returnFocusTo?.focus({ preventScroll: true });
      returnFocusTo = null;
    });
  }

  function open(dish, trigger) {
    if (!supported) return;
    const price = getFormatPrice()(dish.price);
    returnFocusTo = trigger ?? document.activeElement;

    render(dialog,
      h('form', { method: 'dialog', class: 'dish-drawer__close-form' },
        h('button', {
          class: 'dish-drawer__close',
          type: 'submit',
          'aria-label': 'Close dish details',
          autofocus: true,
        }, h('span', { 'aria-hidden': 'true' }, '×')),
      ),
      h('div', { class: 'dish-drawer__panel' },
        createMedia({
          src: dish.image,
          alt: dish.name,
          label: dish.name,
          loading: 'eager',
          className: 'dish-drawer__media',
        }),
        h('div', { class: 'dish-drawer__body' },
          h('h2', { class: 'dish-drawer__title', id: 'dish-drawer-title' }, dish.name),
          price && h('p', { class: 'dish-drawer__price' }, price),
          !dish.isAvailable && h('p', { class: 'dish-drawer__status' }, 'Not available today'),
          dish.description && h('p', { class: 'dish-drawer__description' }, dish.description),
          dish.ingredients.length > 0 && h('div', { class: 'dish-drawer__ingredients' },
            h('h3', { class: 'dish-drawer__subtitle' }, 'Ingredients'),
            h('ul', { class: 'ingredient-list', role: 'list' },
              dish.ingredients.map((item) => h('li', {}, item)),
            ),
          ),
          TagList({ tags: dish.tags, className: 'tags dish-drawer__tags' }),
        ),
      ),
    );

    dialog.showModal();
    dialog.querySelector('.dish-drawer__panel')?.scrollTo(0, 0);
  }

  return { open, close: () => supported && dialog.open && dialog.close() };
}
