import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

// Runs on every page/route (except static assets, see matcher below):
// 1. Assigns an anonymous sessionId cookie to every visitor, logged in or not.
//    This lets us attribute events and affiliate clicks to a session even
//    before/without an account.
// 2. Protects /admin/* at the network edge by redirecting non-admins to /login.
//    Server actions and pages under /admin additionally re-check the role
//    themselves (Proxy can be bypassed for Server Functions on excluded paths).
export default auth((request) => {
  const hadSessionId = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hadSessionId) {
    request.cookies.set(SESSION_COOKIE_NAME, crypto.randomUUID());
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const role = request.auth?.user?.role;
    if (role !== "ADMIN") {
      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (request.nextUrl.pathname.startsWith("/onboarding")) {
    if (!request.auth?.user) {
      const loginUrl = new URL("/login", request.nextUrl);
      loginUrl.searchParams.set("from", "/onboarding");
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({ request });
  if (!hadSessionId) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: request.cookies.get(SESSION_COOKIE_NAME)!.value,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)"],
};
