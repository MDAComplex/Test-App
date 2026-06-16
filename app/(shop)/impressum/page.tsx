import { LegalPage } from "@/components/legal/legal-page";

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <p>
        Wishlist Wars ist ein Demo-/MVP-Projekt und (noch) kein vollstaendig
        betriebenes Unternehmen. Die folgenden Angaben sind Platzhalter und
        muessen vor einem echten Launch durch die tatsaechlichen, gesetzlich
        vorgeschriebenen Anbieterangaben (§ 5 TMG / § 18 MStV) ersetzt werden.
      </p>
      <div>
        <p className="font-semibold text-white">Anbieter (Platzhalter)</p>
        <p>Wishlist Wars GmbH (Platzhalter)</p>
        <p>Musterstraße 1, 10115 Berlin, Deutschland (Platzhalter)</p>
      </div>
      <div>
        <p className="font-semibold text-white">Kontakt (Platzhalter)</p>
        <p>E-Mail: kontakt@wishlist-wars.example</p>
      </div>
      <div>
        <p className="font-semibold text-white">Vertretungsberechtigt (Platzhalter)</p>
        <p>Max Mustermann</p>
      </div>
      <p>
        Wishlist Wars verkauft selbst keine Produkte. Alle angezeigten
        Produkte werden ueber externe Shops via Affiliate-Links vertrieben –
        siehe dazu auch den Affiliate-Hinweis.
      </p>
    </LegalPage>
  );
}
