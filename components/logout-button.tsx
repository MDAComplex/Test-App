"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/feed" })}
      className="w-full rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-center font-semibold text-red-400 active:scale-[0.98] transition-transform"
    >
      Abmelden
    </button>
  );
}
