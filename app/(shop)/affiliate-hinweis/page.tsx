import { LegalPage } from "@/components/legal/legal-page";

export default function AffiliateHinweisPage() {
  return (
    <LegalPage title="Affiliate-Hinweis">
      <p>
        Wishlist Wars verlinkt Produkte zu externen Online-Shops. Manche
        dieser Links sind Affiliate-Links.
      </p>
      <p className="font-semibold text-white">
        Wir erhalten ggf. eine Provision, wenn du über unsere Links kaufst.
        Für dich ändert sich der Preis nicht.
      </p>
      <p>
        Die Auswahl und Reihenfolge der angezeigten Produkte basiert auf einem
        Algorithmus (u. a. Beliebtheit und deinen bisherigen Interaktionen)
        und nicht auf der Hoehe einer moeglichen Provision.
      </p>
    </LegalPage>
  );
}
