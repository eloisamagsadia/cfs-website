// Courier registry for shop order tracking.
//
// Deliberately OPEN, not an enum. `orders.courier` is free text so staff can
// type any courier in any country and the feature still works. This registry
// is only a convenience: a recognised name auto-builds the tracking URL so
// nobody has to paste one. Anything unrecognised still works — the admin can
// paste a tracking URL manually, and if they don't, the member simply sees the
// courier name and a copyable tracking number.
//
// Adding a courier here is optional and never required to ship an order.

export type Courier = {
  /** Stable key stored in orders.courier. */
  slug: string;
  /** Display name shown to staff and members. */
  name: string;
  /** Builds a public tracking URL from a tracking number. */
  url: (trackingNumber: string) => string;
};

export const COURIERS: Courier[] = [
  // ── Philippines ──
  { slug: "jnt",       name: "J&T Express",   url: n => `https://www.jtexpress.ph/trajectoryQuery?waybillNo=${encodeURIComponent(n)}` },
  { slug: "lbc",       name: "LBC Express",   url: n => `https://www.lbcexpress.com/track/?tracking_no=${encodeURIComponent(n)}` },
  { slug: "flash",     name: "Flash Express", url: n => `https://www.flashexpress.ph/tracking/?se=${encodeURIComponent(n)}` },
  { slug: "ninjavan",  name: "Ninja Van",     url: n => `https://www.ninjavan.co/en-ph/tracking?id=${encodeURIComponent(n)}` },
  { slug: "2go",       name: "2GO Express",   url: n => `https://supplychain.2go.com.ph/track?tracking_number=${encodeURIComponent(n)}` },
  { slug: "entrego",   name: "Entrego",       url: n => `https://track.entrego.com.ph/?trackingNumber=${encodeURIComponent(n)}` },
  { slug: "jrs",       name: "JRS Express",   url: n => `https://www.jrs-express.com/track/?awb=${encodeURIComponent(n)}` },
  { slug: "phlpost",   name: "PHLPost",       url: n => `https://www.phlpost.gov.ph/track-and-trace/?barcode=${encodeURIComponent(n)}` },
  { slug: "lalamove",  name: "Lalamove",      url: n => `https://www.lalamove.com/en-ph/track?id=${encodeURIComponent(n)}` },
  { slug: "grab",      name: "Grab Express",  url: n => `https://www.grab.com/ph/express/track/?id=${encodeURIComponent(n)}` },

  // ── International ──
  { slug: "dhl",       name: "DHL",           url: n => `https://www.dhl.com/ph-en/home/tracking/tracking-express.html?tracking-id=${encodeURIComponent(n)}` },
  { slug: "fedex",     name: "FedEx",         url: n => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}` },
  { slug: "ups",       name: "UPS",           url: n => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}` },
  { slug: "usps",      name: "USPS",          url: n => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}` },
];

const BY_SLUG = new Map(COURIERS.map(c => [c.slug, c]));
const BY_NAME = new Map(COURIERS.map(c => [c.name.toLowerCase(), c]));

/**
 * Look up a courier by slug or display name, case-insensitively.
 * Returns null for anything not in the registry — which is fine and expected.
 */
export function findCourier(courier: string | null | undefined): Courier | null {
  if (!courier) return null;
  const key = courier.trim().toLowerCase();
  return BY_SLUG.get(key) ?? BY_NAME.get(key) ?? null;
}

/** Display label for a courier value — falls back to whatever was typed. */
export function courierLabel(courier: string | null | undefined): string {
  if (!courier) return "";
  return findCourier(courier)?.name ?? courier.trim();
}

/**
 * Resolve a tracking URL, in priority order:
 *   1. an explicit URL pasted by staff (wins, so a registry entry going stale
 *      is always overridable without a deploy)
 *   2. a URL generated from a recognised courier
 *   3. null — caller should render the tracking number as plain text
 */
export function resolveTrackingUrl(
  courier: string | null | undefined,
  trackingNumber: string | null | undefined,
  manualUrl?: string | null,
): string | null {
  const manual = manualUrl?.trim();
  if (manual && /^https?:\/\//i.test(manual)) return manual;

  const n = trackingNumber?.trim();
  if (!n) return null;

  const known = findCourier(courier);
  return known ? known.url(n) : null;
}
