import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("user_session");
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  
  // If there is no active session cookie and the user is trying to access a protected page, redirect to login
  if (!session && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If the user is logged in and tries to access /login, redirect them to the home page (garage/dashboard)
  if (session && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all paths except static assets, _next internals, favicon, and api routes
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"
  ],
};
