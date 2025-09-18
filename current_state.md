## NomNom – Current State

A mobile-first restaurant discovery app with a swipe interface, live data from Google Places (New) API, voice-powered filtering, and device optimizations. The project includes a React + TypeScript frontend (Vite + Tailwind + Radix UI + Framer Motion) and a TypeScript Express backend proxy with unified caching.

### Frontend

- **Tech stack**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Framer Motion, React Router, TanStack Query, Capacitor (Android/iOS)
- **Routing**:
  - `/` → `Index` (main experience)
  - `*` → `NotFound`
  - Note: the UI navigates to `/restaurant/:id` on card tap, but no route is implemented yet (falls through to NotFound).
- **Main UX flow** (`src/pages/Index.tsx` → `src/components/SwipeDeck.tsx`):
  - Welcome flow: `WelcomeScreen` prompts for voice preferences on first launch (persisted via `localStorage.hasSeenWelcome`).
  - Swipe deck: `SwipeDeck` renders stacked `SwipeCard`s with smooth, device-optimized gestures and animations.
  - Filter panel: `FilterPanel` (sliding sheet) exposes a comprehensive filter system, plus a natural-language text input.
  - Voice controls: a voice button applies filters via speech-to-text + NLP.
  - Empty/exhausted states: helpful toasts with actions (e.g., open filters) and refresh handling.

#### Data and state pipeline

- `useFilteredPlaces` (core hook)

  - Gets location via `useGeolocation` (Capacitor Geolocation + browser fallback permissions flow).
  - Queries backend via `useNearbyPlaces`/`placesApi.searchNearby` (TanStack Query) when location and the live-data feature flag are enabled.
  - Transforms Google Places results into `RestaurantCard`s (`src/utils/placeTransformers.ts`).
  - Applies client-side filters via a unified filter engine (`src/hooks/useFilters.ts`).
  - Prefetches details and photos for visible cards, merging data back into cards for richer UI.
  - Maintains swipe history and supports refresh.

- Feature flags (`src/types/Types.ts`):
  - `useGooglePlacesApi`: `VITE_USE_LIVE_DATA === 'true'`
  - `enableLocationServices`: `VITE_ENABLE_LOCATION_SERVICES === 'true'`
  - `enablePhotoPreloading`: true (default)
  - `enableSwipeAnalytics`: `VITE_DEBUG_MODE === 'true'`

#### Filtering system

- Centralized in `src/hooks/useFilters.ts`:
  - Filter definitions include: `openNow` (boolean), `minRating` (range), `priceLevel` (select `$..$$$$`), `cuisine` (multiselect), `keyword` (text), `distance` (km), `dietaryRestrictions` (multiselect), `restaurantFeatures` (multiselect), `ambiance` (multiselect).
  - In-app filtering is applied to cards (post-transform) with heuristics/keywords across card title/description/types.
  - `FilterPanel` renders definitions using Radix UI components; supports apply/reset, badges for active filters, and an NLP-powered text search box.
  - `useFilteredPlaces` also injects certain filters upstream into the Places query (e.g., first cuisine keyword, min rating, open now, price mapping to API enums).

#### Voice + NLP

- Speech-to-text: `src/utils/speechToText.ts` (Web Speech API wrapper) with robust, mobile-aware permission flows and Capacitor/Cordova fallbacks (`src/utils/capacitorPermissions.ts`).
- NLP mapping: `src/utils/nlpFilters.ts` parses natural language queries into structured filters (price, cuisines, dietary, features, ambiance, open-now, rating, location/mealtime context). Includes example phrases and console test helpers.
- UI components: `VoiceButton` (compact), `filters/VoiceSearch` (rich card with transcript and results), `FloatingVoiceSearch` (modal overlay), `VoicePrompt` (welcome flow).

#### Cards and details UI

- `SwipeCard` shows backdrop image (prefetched when possible), title, rating, price, distance, open status; expandable detail overlay with:
  - Address → opens Google/Apple Maps
  - Phone → `tel:` on mobile
  - Website → new tab
  - Hours, editorial summary, reviews (when available from details)
- Interaction and animation tuned per-device with `src/utils/deviceOptimization.ts` (low-end detection, thresholds, reduced animations) and Android/iOS checks in `src/lib/utils.ts`.

#### Services and client

- `src/services/places.ts`
  - Axios client to backend (default base URL from `VITE_BACKEND_URL`, fallback to `http://192.168.1.152:4000`).
  - Endpoints: `/api/places/nearby`, `/api/places/:placeId`, `/api/places/photo` (returns `photoUrl`).
  - React Query hooks: `useNearbyPlaces`, `usePlaceDetails`, `usePhotoUrl` with caching/stale times aligned with backend caching.

#### Styling and components

- Tailwind CSS with a vibrant design system and performance tweaks for mobile.
- Radix UI primitives for consistent, accessible UI (sheet, accordion, dialog, select, slider, switch, toast, tooltip, etc.).
- Lucide icons and Framer Motion animations.

### Backend

- **Tech stack**: Express 5 + TypeScript, Axios, Zod, Helmet, CORS, rate limiting, dotenv-flow.
- **Server** (`backend/src/index.ts`):

  - Middleware: Helmet, CORS (localhost, emulator IPs, capacitor), JSON parsing, rate limiting.
  - Health check: `GET /health`.
  - Routes mounted at `/api/places`.
  - Central error handler with friendly messages for common upstream API errors.

- **Places routes** (`backend/src/routes/places.ts`):

  - `GET /nearby` → Validates `lat`, `lng`, optional `radius`, `keyword`, `type`. Calls Google Places `places:searchNearby` via client.
  - `GET /nearbyAdvanced` → Text search (`places:searchText`) with optional `lat/lng/radius`.
  - `GET /:placeId` → Detailed place data.
  - `GET /photo/:photoReference` → Returns direct `photoUrl` (uses Google Photos media with `skipHttpRedirect=true`). Accepts the reference via query or path param.
  - Dev-only:
    - `DELETE /dev-cache` → clear dev cache
    - `GET /dev-cache/stats` → dev cache breakdown

- **Google Places client** (`backend/src/google/liveClient.ts`):

  - Uses Places API (New) v1 endpoints with field masks for minimal payloads.
  - Wraps all calls with unified caching (`withCache`).
  - Endpoints used:
    - `POST /places:searchNearby`
    - `GET /places/{id}` (details)
    - `GET /{name=places/*/photos/*}/media` (photo URI)
    - `POST /places:searchText` (text search)

- **Unified caching** (`backend/src/cache/unifiedCache.ts`):

  - Dev mode: file-based cache `dev-cache-nearby.json` with TTL and on-disk persistence; sections for nearby, details, photos.
  - Prod: in-memory `node-cache` with per-key TTL (defaults derived from `CACHE_TTL_DAYS`).
  - Keys: SHA1-hashed parameterized keys for nearby/textSearch; plain `details:{id}`, `photo:{ref}:{dims}`.

- **Config and validation** (`backend/src/config/index.ts`):
  - Loads env via `dotenv-flow` and exposes typed config.
  - Strict validation logs and exits if required envs are missing. Note: validation currently expects more vars than `env.example` documents (rate limit and cache TTLs), so ensure these are provided in real environments.

### Configuration

- Frontend `.env.local` (see root `README.md`):

  - `VITE_BACKEND_URL=http://localhost:4000`
  - `VITE_USE_LIVE_DATA=true`
  - `VITE_ENABLE_LOCATION_SERVICES=true`

- Backend `backend/.env` (see `backend/README.md` and `env.example`):

  - `GOOGLE_PLACES_API_KEY`
  - `PLACES_BASE_URL=https://places.googleapis.com/v1`
  - `PORT=4000`
  - Additional recommended/validated vars: `CACHE_TTL_DAYS`, `USE_DEV_CACHE`, `ENABLE_CACHE_FEATURE`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`.

- Capacitor (`capacitor.config.ts`): includes Android audio and network permissions, SplashScreen config, Geolocation defaults.

### Build & run

- Backend:
  - `cd backend && npm run dev` (dev)
  - `npm run build && npm start` (prod)
- Frontend:
  - `npm run dev` (Vite dev server)
- Mobile:
  - `npm run build && npx cap sync android && npx cap run android`
  - Similarly for iOS on macOS

### Testing

- Backend uses Jest with test suites under `backend/src/__tests__/` (cache core, Google integration, places routes, key derivation). Scripts: `npm test`, `npm run test:watch`.

### Notable behaviors and gaps

- Detail route not implemented: Tapping a card navigates to `/restaurant/:id`, but no route exists; it will land on NotFound.
- Places photo URL path: the frontend calls `/api/places/photo/givememyphoto?photoReference=...`; the backend also accepts the `photoReference` via query and returns the URL. The literal path segment is unused but tolerated.
- Default search radius comment mismatch: `defaultSearchConfig.radius` is `20000` (meters) with a comment “5km” (should be 20km). The UI often supplies its own radius (e.g., 5km in `Index`).
- Frontend default backend URL falls back to a hardcoded LAN IP if `VITE_BACKEND_URL` is unset; set the env in development/production to avoid surprises.
- Strict backend env validation expects additional vars beyond `env.example`; provide rate limit and cache toggles to avoid early exit in some setups.

### High-level data flow

1. App requests geolocation (via Capacitor or browser), then calls backend `/api/places/nearby` with `lat/lng` and filters-derived params.
2. Backend proxies to Google Places (with field masks), caches responses per unified cache rules, and returns normalized JSON.
3. Frontend transforms Places results to `RestaurantCard`s, applies client-side filters, and prefetches details/photos for visible cards.
4. Voice/text queries map to structured filters via NLP and update the results accordingly.

This document reflects the branch state `features/resturant-filtering` at the time of writing.
