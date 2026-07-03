"use client";

type DeleteProductButtonProps = {
  productId: string;
  action: (id: string) => Promise<void>;
};

export function DeleteProductButton({ productId, action }: DeleteProductButtonProps) {
  return (
    <form
      action={action.bind(null, productId)}
      onSubmit={(e) => {
        if (!window.confirm("Produkt wirklich löschen?")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-xs font-semibold text-red-400">
        Löschen
      </button>
    </form>
  );
}
