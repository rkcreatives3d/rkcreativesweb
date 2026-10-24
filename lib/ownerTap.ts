// The owner's way into /owner/: tap the logo 5 times within 5 seconds.
// (Only finds the page; signing in with the owner key is what protects it.)

const TAPS = 5;
const WINDOW_MS = 5000;
let taps: number[] = [];

/**
 * Count one tap; true on the 5th within the time window. Pass the event's
 * timeStamp: it's when the finger actually touched, even if a busy phone
 * handles the tap a moment later.
 */
export function ownerTap(at: number = performance.now()) {
  const now = at;
  taps = [...taps.filter((t) => now - t < WINDOW_MS && t <= now), now];
  if (taps.length < TAPS) return false;
  taps = [];
  return true;
}
