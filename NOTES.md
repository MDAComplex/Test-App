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

## Phase 5 – Wishlist

- `/wishlist` (Server Component): nicht eingeloggte Visitors sehen einen
  Hinweis ("Erstelle einen kostenlosen Account...") statt der Liste, nie das
  Wort "Warenkorb". Eingeloggte Nutzer sehen ihre gespeicherten Produkte
  (Bild/Poster, Name, Preis, Shopname), je mit "Zum Shop"-Link (`/go/[id]`,
  neuer Tab) und "Entfernen".
- Statistik-Kachel (`components/wishlist/wishlist-view.tsx`, Client-Komponente
  fuer optimistisches Entfernen): Gesamtwert ("Deine Wishlist ist X € wert"),
  Anzahl, Top-Kategorien (haeufigste 3 unter den gespeicherten Produkten) und
  ein optionales, rein kosmetisches Rang-Label nach Anzahl gestaffelt:
  1–4 = "Wishlist Starter", 5–11 = "Style Scout", ab 12 = "Trend Hunter"
  (frei gewaehlte Schwellenwerte, kein echtes Ranking-System).
- End-to-end smoke-getestet: Registrierung → Login → Wishlist-Add via API →
  `/wishlist` zeigt Summe + Rang-Label korrekt.

## Zwischenschritt: Routen-Umbau fuer Admin-Layout

Vor Phase 6 wurde der Root-Layout-Aufbau angepasst: der 430px-"Phone Frame"
lag bisher in `app/layout.tsx` und haette damit auch den Admin-Bereich
eingeengt. Alle Konsumenten-Seiten (`/`, `/login`, `/register`, `/feed`,
`/wishlist`, `/profile`) liegen jetzt in der Route-Group `app/(shop)/`, die
ihr eigenes Layout mit dem Phone-Frame mitbringt; `app/layout.tsx` enthaelt
nur noch `<html>/<body>` + `SessionProvider`. `app/admin/*` liegt ausserhalb
dieser Gruppe und rendert dadurch volle Breite. URLs aendern sich durch
Route-Groups nicht (Klammerordner werden nicht Teil des Pfads).

## Phase 6 – Profil & Admin

- `/profile` (`requireUser()`): Name/E-Mail, Admin-Badge falls Rolle ADMIN,
  eigene Statistik (Likes, Wishlist-Groesse, Shop-Klicks – jeweils aus
  `UserProductEvent`/`WishlistItem`/`AffiliateClick` gezaehlt), Link in den
  Admin-Bereich (nur fuer Admins sichtbar) und Logout-Button
  (`signOut()` von `next-auth/react`).
- `/admin/products` (nur Admin): Tabelle aller Produkte (auch inaktive),
  Aktiv/Inaktiv-Toggle und Loeschen (mit Browser-`confirm()`) direkt in der
  Zeile, Link zu "Neues Produkt" und "Bearbeiten". Formularfelder exakt wie
  im Auftrag: Name, Beschreibung, Preis, Kategorie, Bild-URL, Video-URL?,
  Poster-URL?, MediaType, MediaFit, Affiliate-URL, Shopname, Tags,
  ViralScore, Aktiv/Inaktiv.
- **Umsetzung via Server Actions** (`lib/admin-actions.ts`:
  `createProduct`, `updateProduct`, `toggleProductActive`, `deleteProduct`),
  nicht via `/api`-Routen – passend zur fruehen Architekturentscheidung
  "Server Actions fuer Admin-CRUD, API-Routen fuer nutzerseitige
  Feed/Wishlist/Event-Aktionen".
- **Schutz in zwei Schichten** (defense in depth, wichtig weil Server
  Actions direkt aufrufbar sind und Proxy-Matcher umgehen koennen):
  1. `proxy.ts` blockt `/admin/*` bereits auf Netzwerkebene fuer
     Nicht-Admins (seit Phase 2).
  2. `app/admin/layout.tsx` ruft zusaetzlich `requireAdmin()` bei **jedem**
     Render auf, und jede einzelne Server Action in `lib/admin-actions.ts`
     ruft `requireAdmin()` ebenfalls selbst zu Beginn auf.
  Per curl verifiziert: ein eingeloggter Nicht-Admin, der eine zuvor aus dem
  HTML extrahierte Server-Action-Payload direkt erneut an `/admin/products`
  schickt, wird trotzdem zu `/login` umgeleitet statt die Aktion auszufuehren.
- End-to-end smoke-getestet (curl mit den von Next.js fuer Server Actions
  generierten `multipart/form-data`-Feldern): Produkt erstellen (303 Redirect
  zu `/admin/products`, Zeile erscheint in DB), Aktiv/Inaktiv togglen,
  Bearbeiten-Formular zeigt korrekt vorausgefuellte Werte, Loeschen entfernt
  die Zeile aus der DB.

## Phase 7 – Feed-Algorithmus

`lib/feed.ts` ersetzt die Phase-3-Platzhalter-Sortierung durch die volle, im
Auftrag vorgegebene Formel (Kommentare direkt im Code, hier nur die
Kurzfassung):

`FeedScore = categoryMatch + tagMatch + viralScore + globalEngagementScore + noveltyBonus + randomExploration - alreadySeenPenalty`

- **categoryMatch / tagMatch**: `lib/preferences.ts` speichert je Nutzer
  `UserPreference.categoryWeights`/`tagWeights` (JSON-Maps). Jeder
  Wishlist-Add/-Remove (`/api/wishlist`) erhoeht/verringert das Gewicht der
  betroffenen Kategorie um 1 und jedes Tags um 1 (floor bei 0). Anonyme/neue
  Nutzer haben leere Maps → Term ist 0, der Feed funktioniert also auch ohne
  Historie.
- **viralScore**: direkt aus dem Produkt (Admin-gepflegt).
- **globalEngagementScore**: aggregiert `product_like`/`product_wishlist_add`-
  Events (Gewicht 2) und `AffiliateClick`-Eintraege (Gewicht 3, staerkeres
  Kaufsignal) je Produkt ueber **alle** Nutzer, log-skaliert und auf 40
  gekappt, damit einzelne virale Ausreisser nicht alles andere verdraengen.
- **noveltyBonus**: faellt linear von 20 auf 0 ueber 14 Tage seit `createdAt`.
- **randomExploration**: Zufallswert 0–15, sorgt fuer Abwechslung.
- **alreadySeenPenalty**: feste Strafe (35) fuer Produkte in der vom Client
  mitgeschickten `exclude`-Liste – bewusst kein Hard-Filter, damit der Feed
  bei nur ~34 Seed-Produkten recyceln kann statt leerzulaufen.

Per curl verifiziert: ein Wishlist-Add fuer ein Gaming-Produkt erzeugt sofort
einen `UserPreference`-Eintrag (`{"Gaming":1}` + die zugehoerigen Tags), und
ein anschliessender `/api/feed`-Abruf rankt ein zweites Gaming-Produkt
sichtbar weiter oben, als es allein nach `viralScore` der Fall waere – die
Personalisierung wirkt additiv (sie kann viralScore/Engagement nicht
komplett ueberschreiben), genau wie eine einfache, nicht-ML-basierte
Heuristik es tun sollte.

## Phase 8 – PWA & Rechtliches

- **Icons**: `public/icon-192.png`/`icon-512.png` wurden ohne neue
  Abhaengigkeit erzeugt – ueber Next.js' eingebautes `next/og`
  (`ImageResponse`), per einmaligem, danach geloeschtem Node-Skript im
  Projektroot ausgefuehrt (schwarzes Quadrat, zentriertes fettes violettes
  "W", Marke `#7C3AED`).
- **Manifest**: `public/manifest.json` (Name/Short-Name "Wishlist Wars",
  `start_url: "/feed"`, `display: "standalone"`, Hintergrund/Theme schwarz,
  beide Icon-Groessen). `app/layout.tsx` verweist bereits seit Phase 0 per
  `metadata.manifest` darauf; in Phase 8 ergaenzt um `metadata.icons`
  (Browser-Favicon/Apple-Touch-Icon auf dieselben PNGs).
- **Rechtliche Platzhalterseiten** (`components/legal/legal-page.tsx` als
  gemeinsames Geruest mit Zurueck-Link, Titel und gut sichtbarem gelben
  Banner "Platzhalter – muss vor echtem Launch juristisch geprüft werden."):
  - `/impressum`: Platzhalter-Anbieterangaben, Hinweis dass Wishlist Wars
    selbst nichts verkauft.
  - `/datenschutz`: welche Daten verarbeitet werden (Account-Daten, anonyme
    `ww_sid`-Session, Interaktionsdaten), Affiliate-Klick-Tracking,
    **Hinweis auf Moeglichkeit der Account-Loeschung** (aktuell per
    Kontakt-E-Mail, kein Self-Service-Loeschbutton im MVP).
  - `/agb`: kein eigener Verkauf/Checkout, Kaufvertrag/Versand/Widerruf
    laufen ausschliesslich ueber den externen Shop, Preise/Verfuegbarkeit
    bei externen Shops jederzeit aenderbar und nicht in Echtzeit
    synchronisiert.
  - `/affiliate-hinweis`: enthaelt woertlich die geforderte Formulierung
    "Wir erhalten ggf. eine Provision, wenn du über unsere Links kaufst.
    Für dich ändert sich der Preis nicht.", plus Hinweis dass die
    Produktreihenfolge nicht von der Provisionshoehe abhaengt.
  - Alle vier Seiten liegen in der `(shop)`-Route-Group (Phone-Frame +
    schwarzes Theme bleiben erhalten) und sind von `/profile` aus unter
    einer neuen "Rechtliches"-Sektion verlinkt.
- `npm run build` und `npm run lint` liefen nach den Aenderungen fehlerfrei
  durch (alle vier Rechtsseiten werden als statische Routen `○` gebaut).
  Smoke-Test per curl gegen einen lokalen Dev-Server: `manifest.json`,
  beide Icons und alle vier Rechtsseiten antworten mit `200`; der
  Affiliate-Hinweis-Text wurde per `grep` im HTML-Response verifiziert.
