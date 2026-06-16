import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Defense in depth: Proxy already blocks /admin for non-admins, but Server
// Actions can be invoked directly and bypass a Proxy matcher, so every admin
// mutation/page also checks the role itself.
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }
  return session;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
