import { BottomNav } from "@/components/bottom-nav";

// Shared shell for the app's main sections (feed/wishlist/profile): a full
// viewport-height area with the bottom nav floating on top, so each section
// can use its own h-dvh scroll container underneath it.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {children}
      <BottomNav />
    </div>
  );
}
