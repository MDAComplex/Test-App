# Wishlist Wars – Build Notes

Dieses Dokument haelt die Entscheidungen fest, die waehrend des autonomen Aufbaus
getroffen wurden, sowie den Fortschritt je Phase.

## Phase 0 – Analyse

Das Repository war zu Beginn **vollstaendig leer** (kein Commit, keine Dateien
ausser `.git`). Es gab also keine bestehende Next.js-Codebase, keinen Shop, kein
Auth-System und kein Datenmodell, das wiederverwendet oder versteckt werden
musste. Phase 0 bestand daher aus dem Aufsetzen eines neuen Next.js-Projekts statt
einer Migration eines bestehenden.

Getroffene Grundentscheidungen:

- **Next.js 16.2.9** (App Router, TypeScript, Tailwind v4, ESLint Flat Config) via
  `create-next-app`. Next 16 ist sehr neu, daher wurden die mitgelieferten Docs in
  `node_modules/next/dist/docs` konsultiert. Wichtige Aenderungen, die im weiteren
  Aufbau beruecksichtigt werden:
  - `cookies()`, `headers()`, `params`, `searchParams` sind ausschliesslich async.
  - `middleware.ts` heisst jetzt `proxy.ts` (Export-Name `proxy` statt `middleware`).
  - Turbopack ist Standard fuer `next dev` und `next build`.
- **Datenbank/ORM**: Prisma 7 + SQLite (`better-sqlite3` Driver-Adapter), da Prisma 7
  Datasource-URLs nicht mehr im Schema, sondern nur noch ueber `prisma.config.ts`
  und einen expliziten Driver-Adapter im `PrismaClient`-Konstruktor erlaubt. Adapter:
  `@prisma/adapter-better-sqlite3`. Client wird nach `generated/prisma` generiert
  (nicht ins `app`-Verzeichnis, um Verwechslung mit Routen zu vermeiden) und ist
  `.gitignore`t (wird per `prisma generate` / `postinstall` / `prebuild` neu erzeugt).
- **Auth**: Auth.js (NextAuth) v5 Beta mit Credentials-Provider, JWT-Session-Strategie
  (kein DB-Adapter notwendig), Passwoerter gehasht mit `bcryptjs` (reines JS, keine
  nativen Bindings notwendig – robuster in Sandboxes/CI).
- **Styling**: Tailwind v4, Dark Mode als Basis, Akzentfarbe Violett `#7C3AED`,
  Gruen nur fuer Erfolg/„gespart". Mobile-first, Desktop = zentrierter
  Smartphone-Container (`max-width: 430px`) auf schwarzem Hintergrund.
- **Platzhalter-Medien**: Bilder via `picsum.photos/seed/<slug>/<w>/<h>`
  (deterministisch, kein API-Key). Videos via oeffentliche, frei nutzbare
  Google-Sample-Videos (Blender-Foundation-Filme, gehostet auf
  `commondatastorage.googleapis.com`).
- Da es keinen bestehenden Shop/Warenkorb/Checkout gab, musste nichts entfernt
  oder versteckt werden – das Produkt wird von Anfang an **ohne** diese Konzepte
  gebaut (kein `/cart`, kein `/checkout`, keine Zahlungs-Routen).

## Weiterer Fortschritt

Wird nach jeder Phase unten ergaenzt.

## Phase 2 – Auth & Rollen

Auth.js v5 (Credentials Provider, JWT-Session) implementiert. Rollen: `USER`,
`ADMIN` (Enum in Prisma). Anonyme Besucher bekommen ueber `proxy.ts` einen
`ww_sid`-Cookie (httpOnly, 1 Jahr) zugewiesen, der `userId`-lose Events/Klicks
einer Session zuordnet. `/admin/*` ist sowohl in `proxy.ts` (Server, Redirect zu
`/login`) als auch spaeter client-seitig (Phase 6) geschuetzt. `/login` und
`/register` als mobile-first Dark-Mode-Formulare. Passwoerter mit `bcryptjs`
gehasht, niemals im Klartext oder im Client-Bundle.

## Phase 3 – Feed (Kernstueck)

- **Routen-Struktur**: Route-Group `app/(main)/` mit gemeinsamem Layout
  (`h-dvh`-Container + `BottomNav`, absolut positioniert, nicht `fixed`, damit
  sie innerhalb des 430px-Phone-Frames bleibt statt am echten Browser-Rand zu
  kleben). Enthaelt aktuell `/feed`; `/wishlist` und `/profile` folgen in
  Phase 5/6 (Nav-Links existieren schon, Ziel-Routen noch nicht – erwartet
  in einem mehrphasigen Aufbau).
- **Datenfluss**: `lib/products.ts` mappt Prisma-`Product` → `ProductDTO`
  (`lib/types.ts`). `affiliateUrl` ist bewusst **nicht** Teil des DTOs – der
  Client kennt nur die `productId`, der echte Affiliate-Link wird ausschliesslich
  serverseitig in `/go/[productId]` aufgeloest (nicht im Page-Source/DevTools
  sichtbar).
- **Feed-Scoring (Platzhalter)**: `lib/feed.ts` → `getFeedBatch()` rankt aktuell
  nur nach `viralScore + Zufalls-Jitter`, bereits gesehene Produkte (Client
  schickt `exclude`-Liste) werden ans Ende geschoben und erst recycelt, wenn der
  ungesehene Pool erschoepft ist (relevant bei nur ~34 Seed-Produkten). Die
  Funktionssignatur ist bewusst stabil gehalten, damit Phase 7 nur die
  Scoring-Formel ersetzen muss.
- **API**: `GET /api/feed?exclude=id1,id2` (Batch von 15), `POST/DELETE
  /api/wishlist` (Toggle, 401 bei fehlendem Login), `POST /api/events`
  (Tracking, validiert `eventType` gegen die 11 erlaubten Werte, gibt bei
  jedem Fehler `200 {ok:false}` zurueck statt eines Fehlerstatus – Tracking
  darf den Feed nie blockieren).
- **Feed-UI**: `FeedClient` (`components/feed/feed-client.tsx`) ist der
  Scroll-Container (`snap-y snap-mandatory`, `h-dvh` pro Slide). Ein
  `IntersectionObserver` (Threshold 0.6) bestimmt den aktiven Slide, feuert
  `product_view`/`product_scroll_next`/`product_scroll_previous` und
  startet 2s/5s-Timer fuer `product_visible_2s/5s` (Timer werden bei
  Slide-Wechsel verworfen). Naehert sich der Nutzer dem Ende der geladenen
  Liste (`PREFETCH_THRESHOLD = 5`), wird automatisch nachgeladen.
- **Medien**: `ProductMedia` rendert je `mediaFit`: `cover` = volles Bild/Video
  `object-cover`; `hybrid` = verschwommene/abgedunkelte Hintergrundkopie +
  scharfe, zentrierte `object-contain`-Vordergrundkopie; `contain`/`auto`
  (kein direktes CSS-Aequivalent fuer "auto", daher wie `contain` behandelt)
  = zentriert auf Schwarz. Video-Elemente werden nur im DOM gehalten, wenn ein
  Slide innerhalb von 1 Index zum aktiven liegt (`shouldMount`), und spielen
  nur ab, wenn er exakt aktiv ist (kein gleichzeitiges Abspielen mehrerer
  Videos).
- **Doppeltipp/Wishlist**: Doppeltipp auf das Medium loest immer ein
  **Hinzufuegen** aus (idempotent, nie ein Entfernen) + Herz-Pop-Animation
  (`animate-heart-pop`, neu gemountet pro Tap via React-Key). Der
  Herz-Button in der Action-Bar **toggelt** (hinzufuegen/entfernen). Beide
  Wege feuern sowohl `product_wishlist_add/remove` als auch
  `product_like/unlike` – das UI exponiert nur eine einzige Herz-Geste
  (wie bei TikTok "Like" = "Save"), daher werden beide Event-Paare an
  denselben Momenten ausgeloest statt eine zweite, eigene UI-Geste dafuer zu
  bauen.
- **Anonyme Besucher**: Versucht ein nicht eingeloggter Visitor zu wishlisten,
  antwortet `/api/wishlist` mit 401, der Client zeigt ein Inline-Toast
  ("Erstelle einen kostenlosen Account...") mit Link zu `/register`
  (vollstaendige Wishlist-Seite mit Statistiken folgt in Phase 5).
- **"Social Proof" (Sterne/Bewertungszahl)**: Da es in diesem MVP keine echten
  Bewertungen/Kommentare gibt (explizit nicht zu bauen), werden `rating` und
  `ratingCount` in `lib/products.ts` deterministisch aus `viralScore` + Produkt-
  ID abgeleitet – rein kosmetisch, keine echten Nutzerdaten. Diese Entscheidung
  wurde getroffen, nachdem ein UI-Mockup als Referenz geteilt wurde; eine
  echte Kommentarspalte wurde bewusst **nicht** gebaut (siehe "Nicht zu
  bauen"-Liste), nur dieses kosmetische Substitut.
- **"/"**: Kurze, gebrandete Landing-Page mit "Feed starten"-Button (statt
  Hard-Redirect), wie im Auftrag als Alternative explizit erlaubt.

## Phase 4 – Redirect & Tracking

- `app/go/[productId]/route.ts`: einziger Ort, an dem `affiliateUrl` gelesen
  wird. Schreibt einen `AffiliateClick`-Eintrag (inkl. `referrer`-Header) und
  parallel ein `UserProductEvent` (`product_affiliate_click`), danach
  **sofort** ein `302`-Redirect zur echten Affiliate-URL – kein Zwischenstopp,
  kein Popup. Tracking-Fehler werden abgefangen und blockieren den Redirect
  nicht; existiert die Produkt-ID nicht, wird stattdessen zu `/feed`
  umgeleitet.
- Alle 11 Event-Typen sind jetzt mindestens an einer Stelle auslösbar (Scroll,
  View, Visible 2s/5s, Like/Unlike, Wishlist Add/Remove, Affiliate-Click,
  Share, Scroll Next/Previous) und end-to-end smoke-getestet (curl gegen
  einen lokalen Dev-Server, inkl. ungueltigem `eventType` → `{ok:false}`
  statt Fehlerstatus, 401 bei anonymem Wishlist-Versuch).
