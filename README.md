# Restaurant menu: light design

A second front end for the same menu API: a light interface for a contemporary fine-dining restaurant. Plain HTML, CSS and JavaScript (ES modules, no build step, no dependencies). It ships with mock data, so it runs before the API exists.

- **Hero**: your photograph fills the screen, with the logo, name, tagline, description and opening hours on a white card laid over it
- **Menu**: categories hang like matted prints on a gallery wall; choosing one opens that category, with a contents column on the side and each dish's image, name, ingredients and price
- **Dish details**: selecting a dish opens a drawer from the side (a sheet from the bottom on phones)

The API contract is identical to the first design, so either front end works with the same Django API. Details and Django REST Framework code are in [`docs/API.md`](docs/API.md).

## Run it

```bash
cd restaurant-menu-light
python -m http.server 5500
# open http://127.0.0.1:5500
```

ES modules must be served over HTTP; opening `index.html` from disk will not work.

## Project structure

```
restaurant-menu-light/
├── index.html                  Page shell: hero card, menu, footer, drawer
├── css/
│   ├── main.css                Entry point, imports everything in order
│   ├── base/
│   │   ├── tokens.css          Palette, fonts, type scale, spacing, shadows
│   │   ├── reset.css
│   │   └── typography.css
│   ├── components/
│   │   ├── button.css
│   │   ├── media.css           Image wrapper, loading and missing-image states
│   │   ├── hero.css            Photo + invitation card
│   │   ├── menu.css            Menu section; category contents (side column / sticky bar)
│   │   ├── gallery.css         Category prints on a gallery wall
│   │   ├── dishes.css          Dish cards and tags
│   │   ├── drawer.css          Dish details drawer / bottom sheet
│   │   ├── feedback.css        Skeletons, empty and error states
│   │   └── footer.css
│   └── utilities.css
├── js/
│   ├── main.js                 Entry point: picks mock or live API, starts the app
│   ├── config.js               All settings (API URL, endpoints, currency…)
│   ├── app.js                  Controller: routes → data → views
│   ├── router.js               Hash routes: #menu and #menu/<category-slug>
│   ├── api/                    HTTP client, mock client, menu service, errors
│   ├── models/normalize.js     Validates API data into safe view models
│   ├── components/             Pure render functions (no fetching)
│   └── utils/                  DOM builder, price formatting, images, URL checks
├── mock/                       Example API responses (= the API contract)
├── assets/
│   ├── images/                 Placeholder artwork; replace with real photos
│   └── icons/favicon.svg
└── docs/
    └── API.md
```

`js/api`, `js/models`, `js/utils`, `router.js` and `main.js` are the same files as in the first design. What differs: the CSS, the markup components (`categoryGrid`, `dishCard`, `dishDialog`, skeletons), `config.js` (no theme switch) and a small hook in `app.js` that sets `data-view` on the menu for the two-column category layout.

## Connecting your API

1. Build the endpoints described in `docs/API.md`.
2. In `js/config.js`, set `api.baseUrl` and switch `mock.enabled` to `false`.
3. Allow the front end's origin in CORS (`django-cors-headers`).

Or override per environment, before `js/main.js` loads:

```html
<script>
  window.MENU_CONFIG = {
    api: { baseUrl: 'https://api.aster.com/api/v1' },
    mock: { enabled: false },
  };
</script>
```

### Settings

| Setting | Default | Purpose |
|---|---|---|
| `api.baseUrl` | `http://127.0.0.1:8000/api/v1` | API root, no trailing slash |
| `api.endpoints` | `/restaurant/`, `/categories/`, `/dishes/` | Endpoint paths |
| `api.categoryParam` | `category` | Query parameter for filtering dishes |
| `api.timeoutMs` | `10000` | Per-request timeout |
| `api.retries` | `2` | Automatic retries on network errors, timeouts, 429 and 5xx |
| `api.maxPages` | `20` | Limit when following paginated `next` links |
| `mock.enabled` | `true` | Use `/mock` JSON instead of the API |
| `mock.latencyMs` | `350` | Fake delay, to see loading states |
| `locale` | `en-US` | Number formatting for prices |
| `fallbackCurrency` | `USD` | Used if the API sends no currency |
| `showUnavailableDishes` | `true` | `false` hides dishes with `is_available: false` |

## Customizing

- **Always light**: the page declares `color-scheme: light` and does not switch with the visitor's system setting.
- **Colors** live in `css/base/tokens.css`: porcelain page, white mats, ink text and a Bordeaux accent. Changing `--bordeaux` recolors prices, the current category and details in one place.
- **Fonts**: Bodoni Moda (display) and Jost (text) from Google Fonts, loaded in `index.html`. Change `--font-display` and `--font-body` to switch.
- **Hero photo**: the card covers the lower-left on large screens, and the photo sits above the card on phones. Pick an image whose subject is centred or to the right.
- **Dish photos** are shown square inside a white mat; overhead or three-quarter shots both work.
- **Tag labels**: edit `TAG_LABELS` in `js/components/dishCard.js`.
- **Arabic / RTL**: layout uses logical CSS properties and the drawer slides in from the correct side, so `<html lang="ar" dir="rtl">` mirrors it. Add an Arabic-capable font too.

## Behaviour details

- Each category has its own address (`/#menu/fish`), and the back button works.
- Skeletons appear only if a request takes longer than 150 ms; responses are cached for the session.
- Failures explain what went wrong and offer "Try again". If restaurant details fail, the menu still loads.
- Switching categories quickly never shows stale results.
- API text is always inserted as text, never HTML; image and link URLs are checked first.
- Accessibility: skip link, keyboard-operable dish cards, native `<dialog>` (focus trap, Escape to close, focus returns to the dish), focus moved to the category heading on navigation, screen-reader announcements, visible focus, reduced-motion support.

## Production notes

```bash
npx esbuild css/main.css --bundle --minify --outfile=dist/main.css
npx esbuild js/main.js --bundle --minify --format=esm --outfile=dist/main.js
```

Replace the placeholder SVGs in `assets/images` with real photography (WebP or AVIF). Supported browsers: current Chrome, Edge, Firefox and Safari.
