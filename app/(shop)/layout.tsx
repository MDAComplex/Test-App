// The mobile-first "phone frame" used by every consumer-facing page (feed,
// wishlist, profile, login/register, legal). Kept out of the root layout so
// the admin back-office (app/admin) can render full-width instead.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-black">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col bg-black text-white sm:shadow-[0_0_60px_rgba(124,58,237,0.15)]">
        {children}
      </div>
    </div>
  );
}
