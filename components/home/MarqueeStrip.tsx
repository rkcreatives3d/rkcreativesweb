import { Marquee } from "../ui";

/** One calm ticker band between the cover and the shop. */
export function MarqueeStrip() {
  return (
    <div className="holo-pan relative z-20 py-3 text-[var(--on-grad)]" aria-label="Materials and services">
      <Marquee
        className="font-display text-xl font-extrabold display-case tracking-tight sm:text-2xl"
        items={["Custom prints", "Personalised gifts", "Printed to order", "Hand finished", "Delivered across India"]}
      />
    </div>
  );
}
