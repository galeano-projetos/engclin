import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas — não exigem autenticação
const publicPaths = ["/", "/login", "/registro", "/api/auth", "/api/alerts"];

function isPublicPath(pathname: string): boolean {
  return (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/equipamento/") // Página pública QR Code
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Verifica se existe o token de sessão do NextAuth
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
