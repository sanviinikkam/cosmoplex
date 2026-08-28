import { NextRequest } from "next/server";
import { WHATSAPP_NUMBER, WHATSAPP_PREFILL } from "@/lib/whatsapp";

// Branded short link -> WhatsApp with the prefilled message.
//
// Campaign tracking: /start?c=fb_diwali_video appends a "[c:fb_diwali_video]"
// marker to the prefilled text. The webhook reads that marker, stores it against
// the learner and strips it, so it never reaches the AI or the transcript.
//
// Click-to-WhatsApp ads don't need this — Meta attaches the ad id to the first
// message itself. This covers link ads, bio links, QR codes and print, where no
// such data exists.
//
// 302, not 308: a permanent redirect would be cached, so a printed link could
// never be re-pointed later.
const TAG_OK = /^[A-Za-z0-9_.-]{1,60}$/;

export function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");
  // Validate rather than trust: the tag is echoed into a URL and later stored,
  // so anything odd is dropped instead of passed through.
  const text = c && TAG_OK.test(c)
    ? `${WHATSAPP_PREFILL} [c:${c}]`
    : WHATSAPP_PREFILL;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return Response.redirect(url, 302);
}
