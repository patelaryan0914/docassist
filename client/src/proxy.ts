import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function getSessionToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization")
  const bearer =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader?.trim() || undefined

  return (
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("bandhucare-token")?.value ||
    bearer
  )
}

export default function middleware(request: NextRequest) {
  const token = getSessionToken(request)
  const { pathname } = request.nextUrl
  const isAuth = !!token

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up"

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  const isProtectedRoute =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/user-management")

  if (!isAuth && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api|fonts|manifest.json|robots.txt).*)",
  ],
}
