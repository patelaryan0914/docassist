import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization");

  const { pathname } = request.nextUrl;

  const isAuth = !!token;
  const isLoginPage = pathname === "/sign-in" || pathname === "/sign-up";
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const protectedRoutes = ["/", "/profile", "/settings", "/user-management"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isAuth && isProtectedRoute && !isLoginPage) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api|fonts|manifest.json|robots.txt).*)",
  ],
};
