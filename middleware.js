import { NextResponse } from "next/server";

export function middleware(request) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // Check if hostname is 'ci.eventzone.pro', 'ci.localhost', 'checkin.eventzone.pro', etc.
  const isCiSubdomain =
    hostname.startsWith("ci.") ||
    hostname.startsWith("checkin.") ||
    hostname.includes("ci.eventzone.pro");

  if (isCiSubdomain) {
    // If requesting root '/', rewrite internally to '/checkin'
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/checkin";
      return NextResponse.rewrite(url);
    }
  }

  // Redirect /en, /fr, and /ar locale prefix paths to root /
  const pathname = (url.pathname || "").toLowerCase();
  if (pathname === "/en" || pathname === "/fr" || pathname === "/ar") {
    url.pathname = "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname.startsWith("/en/") || pathname.startsWith("/fr/") || pathname.startsWith("/ar/")) {
    url.pathname = pathname.replace(/^\/(en|fr|ar)/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.png, .jpg, .svg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
