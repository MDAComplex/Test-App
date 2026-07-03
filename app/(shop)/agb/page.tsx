import { LegalPage } from "@/components/legal/legal-page";

export default function AgbPage() {
  return (
    <LegalPage title="AGB">
      <p>
        Diese allgemeinen Geschäftsbedingungen sind ein Platzhalter für die
        MVP-Phase von Wishlist Wars.
      </p>
      <div>
        <p className="font-semibold text-white">Kein eigener Verkauf</p>
        <p>
          Wishlist Wars verkauft selbst keine Produkte und betreibt keinen
          eigenen Checkout. Wishlist Wars ist ein Entdeckungs- und
          Empfehlungsdienst, der auf Produkte externer Shops verlinkt.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">Verantwortung der externen Shops</p>
        <p>
          Kaufvertrag, Bezahlung, Versand, Widerruf und Gewaehrleistung
          erfolgen ausschliesslich zwischen dir und dem jeweiligen externen
          Shop, zu dem dich ein &quot;Zum Shop&quot;-Link fuehrt. Es gelten die AGB
          und Widerrufsbelehrungen dieses Shops.
        </p>
      </div>
      <div>
        <p className="font-semibold text-white">Preise und Verfuegbarkeit</p>
        <p>
          Preise, Verfuegbarkeit und Produktdetails koennen sich beim externen
          Shop jederzeit ändern und werden in Wishlist Wars nicht in
          Echtzeit synchronisiert. Massgeblich ist immer die Anzeige beim
          externen Shop zum Zeitpunkt deines Kaufs.
        </p>
      </div>
    </LegalPage>
  );
}
