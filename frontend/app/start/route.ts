import { WHATSAPP_URL } from "@/lib/whatsapp";

// Branded short link: ailiteracy.cosmoplex.ai/start -> WhatsApp with the
// prefilled message. Keeps printed/shared links short and lets the wording
// change later without reprinting anything.
// 302 (not 308) so the destination is never cached permanently by a browser —
// the prefilled text is allowed to change.
export function GET() {
  return Response.redirect(WHATSAPP_URL, 302);
}
