# API contract

> This is the same contract as the first design (Cèdre). Either front end works with the same API.

The front end reads three read-only endpoints. The files in `/mock` are exact examples of each response. If your API returns the same JSON, the site works with no code changes.

| Endpoint | Returns | Used for |
|---|---|---|
| `GET /api/v1/restaurant/` | one object | Hero, footer, currency |
| `GET /api/v1/categories/` | list | Category chooser and category bar |
| `GET /api/v1/dishes/?category=<slug>` | list | Dishes of one category |

Paths and the filter parameter name are set in `js/config.js` (`api.endpoints`, `api.categoryParam`).

---

## Conventions

- **Field names** use `snake_case`.
- **Lists** can be a plain array, or DRF paginated (`{ "count", "next", "previous", "results" }`). The client follows `next` links automatically (up to `api.maxPages`).
- **Prices** are decimal strings, e.g. `"12.50"`. This is DRF's default for `DecimalField`, and it avoids floating-point rounding. Numbers are also accepted.
- **Images** should be absolute URLs (DRF builds these when the serializer has `request` in its context, which generic views do by default). Relative paths such as `/media/dishes/x.jpg` are resolved against the API origin. Only `http`, `https`, `blob` and `data:image/*` URLs are displayed.
- **Ordering**: items are sorted by `order`, then by `name`. Sorting on the server as well is recommended.
- **Errors**: any non-2xx status shows an error state with a "Try again" button. Network errors, timeouts, `429` and `5xx` responses are retried automatically first (`api.retries`).
- **Unknown fields are ignored**, so you can add fields freely.

---

## `GET /restaurant/`

```json
{
  "name": "Aster",
  "tagline": "Seasonal cooking, served with care",
  "description": "A quiet dining room built around the day's best produce…",
  "logo": "https://api.example.com/media/brand/logo.svg",
  "hero_image": "https://api.example.com/media/brand/hero.jpg",
  "currency": "USD",
  "address": "14 Linden Square, Old Town",
  "phone": "+1 (555) 010-0142",
  "email": "reservations@aster.example",
  "opening_hours": [
    { "days": "Wednesday to Saturday", "hours": "18:30 – 23:00" },
    { "days": "Monday and Tuesday", "hours": "Closed" }
  ],
  "social_links": [
    { "label": "Instagram", "url": "https://instagram.com/aster" }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Shown in the hero, footer and page title |
| `tagline` | string | no | Short line under the name |
| `description` | string | no | Keep it to one or two sentences |
| `logo` | URL | no | SVG or transparent PNG, dark artwork (it sits on a white card) |
| `hero_image` | URL | no | Landscape, at least 1920 × 1080; keep the lower-left calm, the card sits there |
| `currency` | ISO 4217 code | no | `USD`, `EUR`, `GBP`… Defaults to `fallbackCurrency` |
| `address`, `phone`, `email` | string | no | Footer; phone and email become links |
| `opening_hours` | array of `{ days, hours }` | no | The first row is also shown at the bottom of the hero |
| `social_links` | array of `{ label, url }` | no | Footer links |

If this request fails, the menu still works: the hero shows a generic title and prices use `fallbackCurrency`.

---

## `GET /categories/`

```json
[
  {
    "id": 1,
    "slug": "starters",
    "name": "Starters",
    "description": "Light, bright plates to open the meal.",
    "image": "https://api.example.com/media/categories/starters.jpg",
    "order": 1,
    "dish_count": 5
  }
]
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | yes* | Used in the URL (`#menu/starters`) and as the dish filter. *Generated from `name` if missing |
| `name` | string | yes | |
| `description` | string | no | Shown under the category heading |
| `image` | URL | no | Displayed as a 4:5 matted print; portrait images crop best. Falls back to the first letter |
| `order` | integer | no | |
| `dish_count` | integer | no | Shows "6 dishes" under the arch when present |
| `id` | any | no | |

---

## `GET /dishes/?category=<slug>`

```json
[
  {
    "id": 1,
    "slug": "scallops",
    "name": "Hand-dived scallops",
    "description": "Seared scallops on cauliflower purée…",
    "ingredients": ["Scallops", "Cauliflower", "Brown butter", "Capers"],
    "price": "24.00",
    "image": "https://api.example.com/media/dishes/scallops.jpg",
    "category": "starters",
    "tags": ["gluten_free"],
    "is_available": true,
    "order": 1
  }
]
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Items without a name are skipped |
| `price` | decimal string or number | yes | Formatted with the restaurant currency |
| `image` | URL | yes | Displayed square in a white mat (4:3 in the phone sheet); min. 800 × 800 |
| `ingredients` | array of strings | yes | Also accepts `[{ "name": "…" }]` or `"a, b, c"` |
| `description` | string | no | Shown in the dish details window |
| `tags` | array of strings | no | Known labels: `signature`, `vegan`, `vegetarian`, `gluten_free`, `spicy`, `new`, `alcohol_free`. Others are shown with underscores turned into spaces |
| `is_available` | boolean | no | `false` fades the dish and adds "Not available today" (or hides it, see `showUnavailableDishes`) |
| `category` | slug or `{ slug }` | no | |
| `order` | integer | no | |

An unknown `category` value should return an empty list (`[]`), which is what `django-filter` does by default.

---

## Django REST Framework implementation

A minimal implementation that produces exactly this contract.

### `models.py`

```python
from django.db import models


class Restaurant(models.Model):
    """Single row holding the restaurant's details."""
    name = models.CharField(max_length=120)
    tagline = models.CharField(max_length=160, blank=True)
    description = models.TextField(blank=True)
    logo = models.FileField(upload_to="brand/", blank=True)  # FileField allows SVG
    hero_image = models.ImageField(upload_to="brand/", blank=True)
    currency = models.CharField(max_length=3, default="USD")
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return self.name


class OpeningHours(models.Model):
    restaurant = models.ForeignKey(Restaurant, related_name="opening_hours", on_delete=models.CASCADE)
    days = models.CharField(max_length=60)
    hours = models.CharField(max_length=60)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class SocialLink(models.Model):
    restaurant = models.ForeignKey(Restaurant, related_name="social_links", on_delete=models.CASCADE)
    label = models.CharField(max_length=40)
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class Category(models.Model):
    name = models.CharField(max_length=80)
    slug = models.SlugField(unique=True)
    description = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="categories/", blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Tag(models.Model):
    code = models.SlugField(unique=True, help_text="e.g. vegan, gluten_free, signature")

    def __str__(self):
        return self.code


class Dish(models.Model):
    category = models.ForeignKey(Category, related_name="dishes", on_delete=models.PROTECT)
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    ingredients = models.JSONField(default=list, blank=True)  # ["Chickpeas", "Tahini"]
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to="dishes/")
    tags = models.ManyToManyField(Tag, blank=True)
    is_available = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "dishes"

    def __str__(self):
        return self.name
```

### `serializers.py`

```python
from rest_framework import serializers
from .models import Category, Dish, OpeningHours, Restaurant, SocialLink


class OpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ["days", "hours"]


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ["label", "url"]


class RestaurantSerializer(serializers.ModelSerializer):
    opening_hours = OpeningHoursSerializer(many=True, read_only=True)
    social_links = SocialLinkSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            "name", "tagline", "description", "logo", "hero_image", "currency",
            "address", "phone", "email", "opening_hours", "social_links",
        ]


class CategorySerializer(serializers.ModelSerializer):
    dish_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "slug", "name", "description", "image", "order", "dish_count"]


class DishSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    tags = serializers.SlugRelatedField(slug_field="code", many=True, read_only=True)

    class Meta:
        model = Dish
        fields = [
            "id", "slug", "name", "description", "ingredients", "price", "image",
            "category", "tags", "is_available", "order",
        ]
```

### `views.py`

```python
from django.db.models import Count, Q
from django.http import Http404
from rest_framework import generics, viewsets
from .models import Category, Dish, Restaurant
from .serializers import CategorySerializer, DishSerializer, RestaurantSerializer


class RestaurantView(generics.RetrieveAPIView):
    serializer_class = RestaurantSerializer

    def get_object(self):
        restaurant = Restaurant.objects.prefetch_related("opening_hours", "social_links").first()
        if restaurant is None:
            raise Http404
        return restaurant


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Category.objects.filter(is_active=True).annotate(
            dish_count=Count("dishes", filter=Q(dishes__is_published=True))
        )


class DishViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DishSerializer

    def get_queryset(self):
        queryset = (
            Dish.objects.filter(is_published=True, category__is_active=True)
            .select_related("category")
            .prefetch_related("tags")
        )
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset
```

### `urls.py`

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, DishViewSet, RestaurantView

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("dishes", DishViewSet, basename="dish")

urlpatterns = [
    path("api/v1/restaurant/", RestaurantView.as_view(), name="restaurant"),
    path("api/v1/", include(router.urls)),
]
```

### Settings to check

```python
INSTALLED_APPS += ["rest_framework", "corsheaders"]
MIDDLEWARE.insert(0, "corsheaders.middleware.CorsMiddleware")

# The origin(s) where the front end is served
CORS_ALLOWED_ORIGINS = ["http://127.0.0.1:5500", "https://menu.example.com"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

REST_FRAMEWORK = {
    # Optional: the front end also follows pagination
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}
```

The menu changes rarely, so caching these responses (for example `cache_page(60 * 5)` on the views, or a CDN) keeps the site fast.
