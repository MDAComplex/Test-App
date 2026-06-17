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

---

# Abschlussbericht

Alle acht Phasen (0–8) sind abgeschlossen. `npm run build` und `npm run lint`
laufen fehlerfrei (19 Routen, siehe Routenliste unten), nach jeder Phase
wurde committet und gepusht. Dieser Abschnitt fasst den fertigen Stand
zusammen.

## 1. Was wurde gebaut

Eine vollstaendige Next.js-16-App ("TikTok fuer Produkte"): vertikaler
Snap-Feed mit Bild/Video-Produkten, Doppeltipp-zu-Wishlist, eine echte
Wishlist-Seite mit Statistiken, serverseitige Affiliate-Redirects mit
Tracking, ein additiver (nicht-ML) Personalisierungs-Feed-Algorithmus,
Auth (Registrierung/Login, USER/ADMIN-Rollen), ein Admin-Backoffice fuer
Produktpflege, vier rechtliche Platzhalterseiten und PWA-Grundausstattung
(Manifest + Icons). Kein Checkout, kein Warenkorb, keine Zahlungs-Routen –
wie im Auftrag verlangt.

## 2. Neue Routen

Konsument (Route-Group `(shop)`, 430px-Phone-Frame, schwarzes Theme):
- `/` – Landing-Page ("Feed starten")
- `/login`, `/register`
- `/feed` – der eigentliche Swipe-/Scroll-Feed
- `/wishlist` – gespeicherte Produkte + Statistik
- `/profile` – eigene Statistik, Admin-Link (falls Rolle ADMIN), Logout,
  Links zu den vier Rechtsseiten
- `/impressum`, `/datenschutz`, `/agb`, `/affiliate-hinweis`

Redirect/Tracking:
- `/go/[productId]` – einziger Ort, der die echte Affiliate-URL aufloest,
  trackt Klick + Event, leitet sofort per 302 weiter

Admin (ausserhalb der Phone-Frame-Gruppe, volle Breite, nur Rolle ADMIN):
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]`

API (vom Client genutzt, kein direkter Seitenaufruf):
- `GET /api/feed`, `POST/DELETE/GET /api/wishlist`, `POST /api/events`,
  `POST /api/register`, `GET/POST /api/auth/[...nextauth]` (Auth.js)

## 3. Wie der Feed funktioniert

`lib/feed.ts` rankt alle aktiven Produkte pro Anfrage nach einer additiven
Formel: `categoryMatch + tagMatch + viralScore + globalEngagementScore +
noveltyBonus + randomExploration - alreadySeenPenalty`. `category-`/
`tagMatch` kommen aus den pro Nutzer in `UserPreference` gespeicherten
Gewichten (steigen/fallen bei jedem Wishlist-Add/-Remove);
`globalEngagementScore` aggregiert Likes/Wishlist-Adds/Affiliate-Klicks
**aller** Nutzer (log-skaliert, gekappt); `noveltyBonus` bevorzugt neue
Produkte 14 Tage lang abnehmend; `randomExploration` sorgt fuer Abwechslung;
`alreadySeenPenalty` schiebt bereits gezeigte Produkte nach hinten, ohne sie
hart auszuschliessen (wichtig bei nur ~34 Seed-Produkten). Anonyme/neue
Nutzer haben leere Praeferenz-Gewichte – der Feed funktioniert auch ganz
ohne Historie. Details/Konstanten siehe Kommentare direkt in `lib/feed.ts`.

## 4. Bilder & Videos

Platzhalter-Medien, keine eigenen Uploads: Bilder ueber
`picsum.photos/seed/<slug>/<w>/<h>` (deterministisch, kein API-Key),
Videos ueber oeffentliche Google-/Blender-Foundation-Sample-Videos. Jedes
Produkt hat ein `mediaFit` (`cover`/`hybrid`/`contain`/`auto`), das
`components/feed/product-media.tsx` unterschiedlich rendert (volles Bild,
verschwommener Hintergrund + scharfes Vordergrundbild, oder zentriert auf
Schwarz). Nur Slides im Bereich ±1 um den aktiven Index halten ihr
Video-Element im DOM, und nur der exakt aktive Slide spielt ab – nie zwei
Videos gleichzeitig.

## 5. Doppeltipp & Wishlist

Doppeltipp auf das Medium fuegt immer hinzu (idempotent, nie ein Entfernen)
und zeigt eine Herz-Pop-Animation. Der Herz-Button in der Aktionsleiste
toggelt (hinzufuegen/entfernen) – beide Wege sind dieselbe UI-Geste wie bei
TikTok "Like" = "Save" und feuern dieselben Event-Paare
(`product_like`/`unlike` + `product_wishlist_add`/`remove`). Nicht
eingeloggte Besucher bekommen bei einem Wishlist-Versuch ein Inline-Toast
mit Link zu `/register` statt eines Fehlers ohne Erklaerung.

## 6. `/go/[productId]`

Der einzige Ort im gesamten Code, an dem `affiliateUrl` gelesen wird – sie
ist bewusst nicht Teil des an den Client gesendeten `ProductDTO` und damit
nicht im Page-Source/DevTools sichtbar. Schreibt parallel einen
`AffiliateClick`-Eintrag (inkl. Referrer) und ein `product_affiliate_click`-
Event, dann sofortiger 302-Redirect zur echten URL. Tracking-Fehler
blockieren den Redirect nie; unbekannte Produkt-IDs landen auf `/feed`.

## 7. Getrackte Events

Alle 11 vertraglich geforderten Event-Typen sind verdrahtet und end-to-end
getestet: `product_view`, `product_visible_2s`, `product_visible_5s`,
`product_like`, `product_unlike`, `product_wishlist_add`,
`product_wishlist_remove`, `product_affiliate_click`, `product_share`,
`product_scroll_next`, `product_scroll_previous`. `POST /api/events`
validiert `eventType` streng gegen diese Liste, antwortet aber bei jedem
Fehler trotzdem mit Status 200 (`{ok:false}`) statt einem Fehlerstatus –
Tracking darf den Feed nie blockieren oder im Network-Tab als rotes
Request auffallen.

## 8. Admin-Zugang

`prisma/seed.ts` legt ein Admin-Konto an: E-Mail `admin@viralo.shop`,
Passwort aus `ADMIN_SEED_PASSWORD` (`.env`, Default `ChangeMe123!` – **vor
echtem Launch aendern**). Nach Login mit diesem Konto erscheint auf
`/profile` ein "Admin-Bereich"-Link zu `/admin/products`. Schutz in zwei
Schichten: `proxy.ts` blockt `/admin/*` netzwerkseitig fuer Nicht-Admins,
und sowohl `app/admin/layout.tsx` als auch jede einzelne Server Action in
`lib/admin-actions.ts` rufen zusaetzlich selbst `requireAdmin()` auf (per
curl verifiziert: eine direkt wiederholte Server-Action-Payload eines
Nicht-Admins wird trotzdem abgewiesen).

## 9. Produktpflege

Unter `/admin/products`: Tabelle aller Produkte (auch inaktive) mit
Aktiv/Inaktiv-Toggle und Loeschen direkt in der Zeile, sowie "Neu"/
"Bearbeiten"-Formulare mit allen Feldern aus dem Auftrag (Name,
Beschreibung, Preis, Kategorie, Bild-URL, Video-URL, Poster-URL, MediaType,
MediaFit, Affiliate-URL, Shopname, Tags, ViralScore, Aktiv/Inaktiv). Direkt
ueber Server Actions (`lib/admin-actions.ts`), keine eigene API-Schicht
dafuer noetig. Alternativ: `npm run db:seed` fuellt/aktualisiert den
~34-Produkte-Demo-Katalog, `npm run db:studio` oeffnet Prisma Studio fuer
direkten DB-Zugriff.

## 10. Empfohlene naechste Schritte

- Rechtsseiten (Impressum/Datenschutz/AGB/Affiliate-Hinweis) durch einen
  Juristen pruefen und mit echten Firmendaten ersetzen, bevor live
  geschaltet wird.
- `AUTH_SECRET`/`ADMIN_SEED_PASSWORD` vor jedem Deployment durch echte,
  zufaellige Werte ersetzen (aktuell Platzhalter in `.env.example`).
- Von SQLite auf eine Mehrnutzer-faehige DB (z. B. Postgres) wechseln,
  sobald mehr als ein Prozess gleichzeitig schreiben soll.
- Echte Produktbilder/-videos und echte Affiliate-Links/Partnerprogramme
  anbinden (aktuell Platzhalter-Medien + Demo-URLs).
- Rate-Limiting fuer `/api/events` und `/api/wishlist` ergaenzen, bevor die
  App oeffentlich erreichbar ist (aktuell keine Begrenzung).
- Self-Service-Account-Loeschung bauen (in `/datenschutz` als noch fehlend
  dokumentiert).
- Feed-Score-Gewichte/Konstanten (`lib/feed.ts`) mit echten Nutzungsdaten
  kalibrieren, sobald reale Engagement-Zahlen vorliegen.

## Autonome Default-Entscheidungen (Zusammenfassung)

- Next.js 16 + Turbopack + TypeScript + Tailwind v4 statt einer aelteren/
  anderen Stack-Kombination, weil das Repo komplett leer war.
- Prisma 7 + SQLite + `better-sqlite3`-Adapter statt eines Server-DBMS, fuer
  einfaches lokales Setup ohne externe Abhaengigkeit.
- Auth.js v5 (Credentials + JWT, kein DB-Adapter) statt einer komplexeren
  OAuth-Loesung, da nur E-Mail/Passwort gefordert war.
- Anonyme `ww_sid`-Session-Cookies fuer Event-Attribution ohne Account.
- Server Actions fuer Admin-CRUD, REST-API-Routen fuer nutzerseitige
  Feed/Wishlist/Event-Aktionen (klare Trennung Backoffice vs. Client-App).
- Picsum/Google-Sample-Medien statt eigener Uploads/Lizenzbilder.
- Kosmetische, deterministisch aus `viralScore` abgeleitete Sterne-
  Bewertung/Bewertungszahl statt eines echten Kommentar-/Bewertungssystems
  (nach Ruecksprache zu einem geteilten UI-Mockup bewusst auf echte
  Kommentare verzichtet, siehe Phase-3-Notizen).
- Drei Bottom-Nav-Tabs (Feed/Wishlist/Profil) statt der fuenf Tabs aus dem
  geteilten Mockup, da nur diese drei im Auftrag vorgesehen waren.
- App-Icons per `next/og` `ImageResponse` selbst generiert statt
  Lizenzgrafiken einzukaufen.
- Rechtsseiten als bewusst gekennzeichnete Platzhalter statt echter
  Rechtstexte, da echte Rechtsberatung ausserhalb des Auftragsumfangs liegt.

## Nicht umgesetzt / bewusst ausserhalb des Scopes

Wie im Auftrag als "nicht zu bauen" vorgegeben, wurden folgende Punkte
absichtlich **nicht** gebaut: native Apps, echter Checkout/Bezahlvorgang,
Warenkorb, TikTok-Importe, Web-Scraping, ML-basiertes Ranking, ein echtes
Kommentar-/Bewertungssystem, Datei-Uploads, Creator-Auszahlungen. Zusaetzlich
noch offen (siehe Punkt 10 oben): echte Rechtstexte, Self-Service-
Account-Loeschung, Rate-Limiting, Produktions-Secrets/-Datenbank.

## Phase 9

Erweiterung um echte Nutzerprofile, Onboarding und ein echtes
Kommentarsystem (letzteres war zuvor bewusst aussen vor, ist jetzt aber
Teil des Auftrags):

- **Usernames:** `User.username` (unique, optional). Wird bei Registrierung
  verpflichtend vergeben (Regex `^[a-zA-Z0-9_]{3,30}$`, Eindeutigkeits-Check),
  ueber JWT/Session bis ins Profil durchgereicht. Admin-Seed setzt `admin`.
- **Onboarding:** 3-Schritt-Wizard (`/onboarding`, Client Component) fuer
  Kategorien, Budget-Vibe und Stil-Vibes. Speichert in `UserPreference`
  (`onboardingCompleted`, `budgetRange`, `styleVibes`) und setzt fuer gewaehlte
  Kategorien `categoryWeights = 3` (starkes Feed-Signal). Nach Registrierung
  leitet das Formular hierher; das Profil hat einen "Interessen bearbeiten"-
  Link. Bewusste Entscheidung: kein Auto-Redirect weg vom Onboarding, damit
  Praeferenzen jederzeit neu gesetzt werden koennen. `proxy.ts` schuetzt
  `/onboarding` fuer Gaeste.
- **Produktdetailseite:** `/product/[productId]` (Server Component) mit
  Medien (wiederverwendete `ProductMedia`), Beschreibung, Wishlist-Toggle,
  Angebots-Sektion und Kommentaren. Wishlist-Karten verlinken jetzt auf die
  Detailseite, "Zum Shop" bleibt der direkte `/go/`-Affiliate-Redirect.
- **ProductOffer:** mehrere Shop-Angebote pro Produkt (Primaer-Angebot zuerst,
  dann nach Preis). `/go/[productId]?offerId=` waehlt die Affiliate-URL des
  jeweiligen Angebots (sonst Fallback auf `product.affiliateUrl`). Ein eigenes
  Admin-CRUD fuer Angebote wurde bewusst (noch) nicht gebaut - Angebote per DB.
- **Kommentare:** `ProductComment` (Soft-Delete) + `CommentLike` (Toggle,
  unique pro User/Kommentar). API unter `/api/comments` (GET/POST),
  `/api/comments/[id]` (DELETE, nur eigene), `/api/comments/[id]/like` (POST
  Toggle). UI mit optimistischem Like/Delete und Zeichenzaehler (max 500).
