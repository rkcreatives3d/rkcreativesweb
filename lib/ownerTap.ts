// The owner's way into /owner/: tap the logo 5 times within 3 seconds.
// (Only finds the page; signing in with the owner key is what protects it.)

const TAPS = 5;
const WINDOW_MS = 3000;
let taps: number[] = [];

/** Count one tap; true on the 5th within the time window. */
export function ownerTap() {
  const now = Date.now();
  taps = [...taps.filter((t) => now - t < WINDOW_MS), now];
  if (taps.length < TAPS) return false;
  taps = [];
  return true;
}
