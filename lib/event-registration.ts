/**
 * Single source of truth for "is registration open for this event".
 * Used by the public event page + register button + waitlist logic.
 */
export interface RegistrationGateInput {
  registration_closed?: boolean | null;
  registration_closes_at?: string | null;
  status?: string | null;
  date?: string | null;
}

export interface RegistrationGate {
  open:   boolean;
  reason: null | "manual" | "auto" | "ended" | "cancelled";
  /** If registration is open AND has an auto-close in the future, when. */
  closes_at: string | null;
}

export function evaluateRegistrationGate(ev: RegistrationGateInput): RegistrationGate {
  if (ev.status === "cancelled")                                       return { open: false, reason: "cancelled", closes_at: null };
  if (ev.date && new Date(ev.date).getTime() < Date.now())             return { open: false, reason: "ended",     closes_at: null };
  if (ev.registration_closed)                                          return { open: false, reason: "manual",    closes_at: null };
  if (ev.registration_closes_at && new Date(ev.registration_closes_at).getTime() <= Date.now())
                                                                       return { open: false, reason: "auto",      closes_at: null };
  return { open: true, reason: null, closes_at: ev.registration_closes_at ?? null };
}
