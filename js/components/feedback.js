import { h } from '../utils/dom.js';

/** Loading, empty and error states shared across views. */

export function CategoryGridSkeleton({ count = 6 } = {}) {
  return h('ul', { class: 'gallery', role: 'list', 'aria-hidden': 'true' },
    Array.from({ length: count }, () => h('li', { class: 'gallery__item' },
      h('span', { class: 'print' },
        h('span', { class: 'print__mat' }, h('span', { class: 'print__media skeleton' })),
        h('span', { class: 'print__caption' },
          h('span', { class: 'skeleton skeleton--line', style: 'width: 55%' }),
          h('span', { class: 'skeleton skeleton--line skeleton--thin', style: 'width: 80%' }),
        ),
      ),
    )),
  );
}

export function DishListSkeleton({ count = 6 } = {}) {
  return h('ul', { class: 'dishes', role: 'list', 'aria-hidden': 'true' },
    Array.from({ length: count }, (_, index) => h('li', { class: 'dishes__item' },
      h('div', { class: 'dish' },
        h('span', { class: 'dish__mat' }, h('span', { class: 'dish__media skeleton' })),
        h('div', { class: 'dish__body' },
          h('span', { class: 'skeleton skeleton--line', style: `width: ${50 + (index % 3) * 12}%` }),
          h('span', { class: 'skeleton skeleton--line skeleton--thin', style: 'width: 85%' }),
        ),
      ),
    )),
  );
}

export function EmptyState({ title, message, action }) {
  return h('div', { class: 'state' },
    h('h2', { class: 'state__title' }, title),
    message && h('p', { class: 'state__message' }, message),
    action && h('a', { class: 'button button--outline', href: action.href }, action.label),
  );
}

const ERROR_MESSAGES = {
  network: 'The menu server could not be reached. Check your internet connection, then try again.',
  timeout: 'The menu server took too long to answer. Try again in a moment.',
  parse: 'The menu data arrived in a format this page does not recognize.',
  not_found: 'The menu could not be found on the server.',
  http: 'The menu server returned an error. Try again in a moment.',
};

export function errorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? ERROR_MESSAGES.http;
}

export function ErrorState({ title = 'The menu didn’t load', error, onRetry }) {
  return h('div', { class: 'state state--error', role: 'alert' },
    h('h2', { class: 'state__title' }, title),
    h('p', { class: 'state__message' }, errorMessage(error)),
    onRetry && h('button', { class: 'button button--outline', type: 'button', onClick: onRetry }, 'Try again'),
  );
}
