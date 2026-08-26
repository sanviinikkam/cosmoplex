import { NextResponse, type NextRequest } from "next/server";

/**
 * Web learner channel: OFF.
 *
 * WhatsApp is the only learner channel for now. The learner pages still exist
 * in the codebase (and will be re-enabled later) but their backend APIs are
 * disabled, so reaching one would render a page that fails — this sends those
 * URLs back to the landing page instead.
 *
 * To re-enable the whole web channel later: set WEB_CHANNEL_ENABLED=true in
 * Vercel (and re-include the learner routers in backend/main.py). No code
 * change needed here.
 *
 * NOTE: 307 (temporary), never 308 — a permanent redirect gets cached by the
 * browser, so visitors who hit a page while it was off would keep bouncing to
 * "/" even after the channel is switched back on.
 */
export function middleware(req: NextRequest) {
  if (process.env.WEB_CHANNEL_ENABLED === "true") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url, 307);
}

// Only the learner routes. The landing page, /start and the admin portal are
// deliberately absent so they keep working.
export const config = {
  matcher: [
    "/login/:path*",
    "/signup/:path*",
    "/dashboard/:path*",
    "/learn/:path*",
    "/course/:path*",
    "/onboarding/:path*",
    "/certificate/:path*",
    "/language/:path*",
  ],
};
