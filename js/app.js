import { qs, render, prefersReducedMotion, toDomId } from './utils/dom.js';
import { createPriceFormatter, pluralize } from './utils/format.js';
import { parseHash, routes, startRouter } from './router.js';
import { renderHero, renderHeroFallback } from './components/hero.js';
import { CategoryGrid } from './components/categoryGrid.js';
import { hideCategoryNav, renderCategoryNav } from './components/categoryNav.js';
import { DishSection, DishSectionLoading } from './components/dishSection.js';
import { createDishDialog } from './components/dishDialog.js';
import { CategoryGridSkeleton, EmptyState, ErrorState } from './components/feedback.js';
import { renderFooter } from './components/footer.js';

/** Skeletons only appear if data takes longer than this, to avoid flicker. */
const SKELETON_DELAY_MS = 150;

/**
 * App controller: reacts to routes, asks the service for data and decides
 * which view to render. Components stay free of data-fetching logic.
 */
export function createApp({ config, service, root = document }) {
  const el = {
    hero: qs('[data-hero]', root),
    menu: qs('[data-menu]', root),
    menuHeader: qs('[data-menu-header]', root),
    nav: qs('[data-menu-nav]', root),
    view: qs('[data-menu-view]', root),
    status: qs('[data-status]', root),
    footer: qs('[data-footer]', root),
    dialog: qs('[data-dish-dialog]', root),
  };

  let formatPrice = createPriceFormatter({ locale: config.locale, currency: config.fallbackCurrency });
  let renderToken = 0;
  const dishDialog = createDishDialog(el.dialog, { getFormatPrice: () => formatPrice });
  const restaurantReady = loadRestaurant();

  /* ---------- restaurant (hero + footer) ---------- */

  async function loadRestaurant() {
    try {
      const restaurant = await service.getRestaurant();
      formatPrice = createPriceFormatter({ locale: config.locale, currency: restaurant.currency });
      renderHero(el.hero, restaurant);
      renderFooter(el.footer, restaurant);
      document.title = restaurant.tagline ? `${restaurant.name} | Menu` : restaurant.name;
      if (restaurant.description) {
        qs('meta[name="description"]')?.setAttribute('content', restaurant.description);
      }
    } catch (error) {
      console.error('[menu] Restaurant details failed to load:', error);
      renderHeroFallback(el.hero);
    }
  }

  /* ---------- helpers ---------- */

  const isCurrent = (token) => token === renderToken;

  function announce(message) {
    el.status.textContent = '';
    // A fresh text node guarantees screen readers announce repeated messages.
    requestAnimationFrame(() => { el.status.textContent = message; });
  }

  function scrollToMenu({ instant = false } = {}) {
    const top = el.menu.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(window.scrollY - top) < 2) return;
    // 'instant' overrides the smooth scroll-behavior set in CSS.
    const behavior = instant || prefersReducedMotion() ? 'instant' : 'smooth';
    window.scrollTo({ top, behavior });
  }

  /** Renders `content` unless newer navigation happened meanwhile. */
  function show(token, ...content) {
    if (isCurrent(token)) render(el.view, ...content);
  }

  /** Shows a skeleton only if `promise` is still pending after a short delay. */
  function withSkeleton(token, promise, skeleton) {
    const timer = setTimeout(() => show(token, skeleton()), SKELETON_DELAY_MS);
    return promise.finally(() => clearTimeout(timer));
  }

  function retry() {
    handleRoute(parseHash(), { initial: false, retry: true });
  }

  /* ---------- views ---------- */

  async function showCategories(token) {
    el.menu.dataset.view = 'categories';
    el.menuHeader.hidden = false;
    hideCategoryNav(el.nav);

    try {
      const categories = await withSkeleton(token, service.getCategories(), CategoryGridSkeleton);
      if (!isCurrent(token)) return;

      show(token, categories.length
        ? CategoryGrid({ categories })
        : EmptyState({
            title: 'The menu is being updated',
            message: 'Categories will appear here as soon as they are published.',
          }));
    } catch (error) {
      console.error('[menu] Categories failed to load:', error);
      show(token, ErrorState({ error, onRetry: retry }));
    }
  }

  async function showCategory(token, slug, { moveFocus }) {
    el.menu.dataset.view = 'category';
    el.menuHeader.hidden = true;

    let categories;
    try {
      categories = await withSkeleton(token, service.getCategories(), CategoryGridSkeleton);
    } catch (error) {
      console.error('[menu] Categories failed to load:', error);
      hideCategoryNav(el.nav);
      el.menu.dataset.view = 'categories';
      show(token, ErrorState({ error, onRetry: retry }));
      return;
    }
    if (!isCurrent(token)) return;

    const category = categories.find((item) => item.slug === slug);
    renderCategoryNav(el.nav, categories, category?.slug);

    if (!category) {
      show(token, EmptyState({
        title: 'This category isn’t on the menu',
        message: 'It may have been renamed or removed. Pick one of the current categories instead.',
        action: { label: 'See all categories', href: routes.menu() },
      }));
      return;
    }

    try {
      const [dishes] = await withSkeleton(
        token,
        Promise.all([service.getDishes(category.slug), restaurantReady]),
        () => DishSectionLoading({ category }),
      );
      if (!isCurrent(token)) return;

      const visible = config.showUnavailableDishes ? dishes : dishes.filter((dish) => dish.isAvailable);
      show(token, DishSection({
        category,
        dishes: visible,
        formatPrice,
        onOpenDish: dishDialog.open,
      }));

      if (moveFocus) {
        qs(`#${toDomId('course', category.slug)}`, el.view)?.focus({ preventScroll: true });
      }
      announce(`${category.name}, ${pluralize(visible.length, 'dish', 'dishes')}`);
    } catch (error) {
      console.error(`[menu] Dishes for "${slug}" failed to load:`, error);
      show(token, ErrorState({ title: `${category.name} didn’t load`, error, onRetry: retry }));
    }
  }

  /* ---------- routing ---------- */

  function handleRoute(route, { initial, retry: isRetry = false }) {
    renderToken += 1;
    const token = renderToken;
    dishDialog.close();

    // Arriving from a link (or a deep link) should bring the menu into view.
    if (route.name !== 'home' && !isRetry) {
      if (initial) {
        // The hero changes height once its content arrives, so wait for it.
        restaurantReady.then(() => requestAnimationFrame(() => scrollToMenu({ instant: true })));
      } else {
        requestAnimationFrame(() => scrollToMenu());
      }
    }

    if (route.name === 'category') {
      return showCategory(token, route.slug, { moveFocus: !initial && !isRetry });
    }

    if (route.name === 'menu' && !initial && !isRetry) {
      el.menu.focus({ preventScroll: true });
    }
    return showCategories(token);
  }

  return {
    start() {
      startRouter(handleRoute);
    },
  };
}
