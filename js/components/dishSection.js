import { h, toDomId } from '../utils/dom.js';
import { routes } from '../router.js';
import { DishCard } from './dishCard.js';
import { DishListSkeleton, EmptyState } from './feedback.js';

function CourseHeader(category) {
  return h('header', { class: 'course__header' },
    h('h2', {
      class: 'course__title',
      id: toDomId('course', category.slug),
      tabindex: '-1',
    }, category.name),
    category.description && h('p', { class: 'course__description' }, category.description),
  );
}

/** A category page: heading, description and its dishes. */
export function DishSection({ category, dishes, formatPrice, onOpenDish }) {
  const body = dishes.length
    ? h('ul', { class: 'dishes', role: 'list' },
        dishes.map((dish) => h('li', { class: 'dishes__item' },
          DishCard({ dish, formatPrice, onOpen: onOpenDish }),
        )))
    : EmptyState({
        title: 'No dishes here yet',
        message: 'This category is empty for now. The other categories are ready to browse.',
        action: { label: 'See all categories', href: routes.menu() },
      });

  return h('section', {
    class: 'course',
    'aria-labelledby': toDomId('course', category.slug),
  }, CourseHeader(category), body);
}

/** Shown while a category's dishes load: real heading, placeholder rows. */
export function DishSectionLoading({ category }) {
  return h('section', { class: 'course', 'aria-busy': 'true' },
    CourseHeader(category),
    DishListSkeleton({ count: Math.min(category.dishCount ?? 6, 8) || 4 }),
  );
}
