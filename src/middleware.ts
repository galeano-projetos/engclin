import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas publicas — nao exigem autenticacao
const publicPaths = ["/", "/login", "/registro", "/api/auth", "/forgot-password", "/reset-password", "/trocar-senha"];
const publicPrefixes = ["/api/auth/", "/equipamento/"];
// Rotas publicas exatas (nao prefixos)
const publicExact = ["/api/alerts/check", "/api/stats"];

function isPublicPath(pathname: string): boolean {
  if (publicPaths.includes(pathname)) return true;
  if (publicExact.includes(pathname)) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Verifica se existe o token de sessao do NextAuth
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)"],
};
