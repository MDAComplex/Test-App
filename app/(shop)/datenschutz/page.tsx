import { LegalPage } from "@/components/legal/legal-page";

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <p>
        Diese Datenschutzerklärung ist ein Platzhalter für die MVP-Phase und
        beschreibt in groben Zuegen, welche Daten Wishlist Wars verarbeitet.
        Sie ersetzt keine rechtsverbindliche, DSGVO-konforme
        Datenschutzerklärung.
      </p>
      <div>
        <p className="font-semibold text-white">Welche Daten wir verarbeiten</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Account-Daten (Name, E-Mail, gehashtes Passwort) bei Registrierung.</li>
          <li>
            Eine anonyme Session-ID (Cookie), auch ohne Account, um Klicks und
            Interaktionen einer Sitzung zuordnen zu koennen.
          </li>
          <li>
            Interaktionsdaten (z. B. angesehene/gelikte/gewishlistete
            Produkte, Shop-Klicks) zur Personalisierung des Feeds.
          </li>
        </ul>
      </div>
      <div>
        <p className="font-semibold text-white">Affiliate-Links</p>
        <p>
          Beim Klick auf &quot;Zum Shop&quot; wirst du über einen
          Weiterleitungs-Link zum externen Shop gefuehrt; dabei wird der Klick
          (nicht aber dein Einkauf) bei uns protokolliert. Mehr dazu im
          Affiliate-Hinweis.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">Loeschung deines Accounts</p>
        <p>
          Du kannst die Loeschung deines Accounts und der zugehoerigen Daten
          jederzeit beantragen, z. B. über die im Profil angegebene
          Kontakt-E-Mail. Eine vollstaendig selbstbedienbare
          Loeschfunktion ist im aktuellen MVP noch nicht eingebaut.
        </p>
      </div>
    </LegalPage>
  );
}
