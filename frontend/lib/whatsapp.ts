// Single source of truth for the WhatsApp entry point.
//
// The prefilled text lives here ONLY — it used to be pasted into three
// components, so changing the wording meant changing three files and the
// short link would silently drift out of sync.
export const WHATSAPP_NUMBER = "917204419938";

export const WHATSAPP_PREFILL =
  "Hi I am interested and would like to start my AI learning journey";

/** Full wa.me deep link. Used by the on-site buttons (no redirect hop). */
export const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

/** Short, branded link to share anywhere (posters, bios, SMS). Redirects to WHATSAPP_URL. */
export const WHATSAPP_SHORT_PATH = "/start";
