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
