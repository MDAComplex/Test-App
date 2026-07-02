"use client";

type DeleteOfferButtonProps = {
  offerId: string;
  productId: string;
  action: (offerId: string, productId: string) => Promise<void>;
};

export function DeleteOfferButton({ offerId, productId, action }: DeleteOfferButtonProps) {
  return (
    <form
      action={action.bind(null, offerId, productId)}
      onSubmit={(e) => {
        if (!window.confirm("Angebot wirklich loeschen?")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-xs font-semibold text-red-400">
        Loeschen
      </button>
    </form>
  );
}
